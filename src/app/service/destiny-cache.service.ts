import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment as env } from '@env/environment';
import { del, get, keys, set } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';

declare let JSZip: any;
declare let JSZipUtils: any;

@Injectable()
export class DestinyCacheService {
  public cache: any;

  public readonly ready: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly checkingCache: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly percent: BehaviorSubject<number> = new BehaviorSubject(0);
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
    this.percent.next(96);
    const zip2 = await zip.loadAsync(blob);
    this.percent.next(97);
    const z2f = zip2.file('destiny2.json');
    this.percent.next(98);
    const data2 = await z2f.async('string');
    this.percent.next(99);
    this.cache = JSON.parse(data2);
    this.percent.next(100);
    this.ready.next(true);
  }

  async load(key: string): Promise<void> {
    const req = new HttpRequest<Blob>('GET', '/assets/destiny2.zip?v=' + env.versions.app, {
      reportProgress: true,
      responseType: 'blob'
    });
    const r = this.http.request(req);
    r.subscribe((event: HttpEvent<any>) => {
      switch (event.type) {
        case HttpEventType.Sent:
          this.percent.next(5);
          break;
        case HttpEventType.ResponseHeader:
          this.percent.next(10);
          break;
        case HttpEventType.DownloadProgress:
          const kbLoaded = Math.round(event.loaded / 1024);
          console.log(`Download in progress! ${kbLoaded}Kb loaded`);
          this.percent.next(15 + 80 * event.loaded / event.total);
          break;
        case HttpEventType.Response: {
          this.percent.next(95);
        }
      }
    });
    const event = await r.toPromise();
    await this.unzip((event as HttpResponse<Blob>).body);
    set(key, this.cache);
    return;
  }
}
