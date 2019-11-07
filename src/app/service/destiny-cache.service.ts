import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment as env } from '@env/environment';
import { del, get, keys, set } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';
import { tap, last } from 'rxjs/operators';

declare let JSZip: any;

@Injectable()
export class DestinyCacheService {
  public cache: any;

  public readonly ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly checkingCache: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly percent: BehaviorSubject<number> = new BehaviorSubject(0);
  public readonly unzipping: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly error: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private http: HttpClient) {
    this.init();
  }

  private async init() {
    this.checkingCache.next(true);
    const t0 = performance.now();
    console.log('Loading cache');
    try {
      const key = 'manifest-' + env.versions.app;
      const manifest = await get(key);
      this.checkingCache.next(false);
      // if nothing found, perhaps version has changed, clear old values
      if (manifest == null) {
        const ks = await keys();
        for (const k of ks) {
          if (k.toString().startsWith('manifest')) {
            del(k);
          }
        }
        await this.load(key);
      } else {
        this.cache = manifest;
      }
      this.percent.next(100);
      this.ready.next(true);
      const t1 = performance.now();
      console.log((t1 - t0) + ' ms to load manifest');


    } catch (exc) {
      console.dir(exc);
      this.error.next('There was an error loading the Bungie Manifest DB, please refresh the page and try again.');
    }
    finally {
      this.checkingCache.next(false);
      this.percent.next(100);
    }
  }

  async unzip(blob: Blob): Promise<void> {
    const zip: any = new JSZip();
    const zip2 = await zip.loadAsync(blob);
    const z2f = zip2.file('destiny2.json');
    const data2 = await z2f.async('string');
    this.cache = JSON.parse(data2);
    this.ready.next(true);
  }

  private showProgress(evt: HttpEvent<any>) {
    switch (evt.type) {
      case HttpEventType.Sent:
        this.percent.next(5);
        break;
      case HttpEventType.ResponseHeader:
        this.percent.next(10);
        break;
      case HttpEventType.DownloadProgress:
        const kbLoaded = Math.round(evt.loaded / 1024);
        console.log(`Download in progress! ${kbLoaded}Kb loaded`);
        this.percent.next(15 + 80 * evt.loaded / evt.total);
        break;
      case HttpEventType.Response: {
        this.percent.next(95);
      }
    }
  }

  async load(key: string): Promise<void> {
    console.log("--- load ---");

    let headers = new HttpHeaders();
    headers = headers
        .set('Content-Type', 'application/x-www-form-urlencoded');
    const httpOptions = {
        headers: headers};

    const req = new HttpRequest<Blob>('GET', '/assets/destiny2.zip?v=' + env.versions.app, {
      reportProgress: true,
      responseType: 'blob'
    });

    const r = this.http.request(req).pipe(
      tap((evt: HttpEvent<any>) => this.showProgress(evt)),
      last()
    );
    const event = await r.toPromise();
    this.percent.next(100);
    this.unzipping.next(true);
    try {
      await this.unzip((event as HttpResponse<Blob>).body);
      set(key, this.cache);
      return;
    }
    finally {
      this.unzipping.next(false);
    }
  }
}
