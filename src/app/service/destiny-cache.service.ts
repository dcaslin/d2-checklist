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
  public readonly percent: BehaviorSubject<number> = new BehaviorSubject(0);
  public readonly error: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private http: HttpClient) {
    this.init();
  }

  private async init() {
    const t0 = performance.now();
    console.log('Loading cache');
    try {
      const key = 'manifest-' + env.versions.app;
      const manifest = await get(key);
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

      // await this.loadJson();
      // let ii = await this.loadJson2('d2-ii');
      // this.ii = ii;
      // let pruned = await this.loadJson2('d2-pruned');
      // this.cache = pruned;

      this.percent.next(100);
      this.ready.next(true);
      const t1 = performance.now();
      console.log((t1 - t0) + ' ms to load manifest');


    } catch (exc) {
      console.dir(exc);
      this.error.next('There was an error loading the Bungie Manifest DB, please refresh the page and try again.');
    }
    finally {
      this.percent.next(100);
    }
  }

  async unzip(blob: Blob): Promise<void> {

    performance.clearMarks();
    performance.clearMeasures();
    const markerNameA = 'start';
    performance.mark(markerNameA);

    const zip: any = new JSZip();
    this.percent.next(96);
    const zip2 = await zip.loadAsync(blob);
    this.percent.next(97);
    const z2f = zip2.file('destiny2.json');
    this.percent.next(98);
    const markerNameB = 'extract';
    performance.mark(markerNameB);

    const data2 = await z2f.async('string');
    const markC = 'done';

    performance.mark(markC);
    this.percent.next(99);
    this.cache = JSON.parse(data2);

    const markD = 'parse';
    performance.mark(markD);
    this.percent.next(100);
    this.ready.next(true);

    performance.measure('start', markerNameA, markerNameB);
    performance.measure('extract', markerNameB, markC);
    performance.measure('parse', markC, markD);
    performance.measure('finish', markD);
    console.log(performance.getEntriesByType('measure'));
    performance.clearMarks();
    performance.clearMeasures();

  }

  async loadJson2(name: string): Promise<void> {
    console.log('Downloading: ' + name);
    const req = new HttpRequest<any>('GET', '/assets/' + name + '.json?v=' + env.versions.app, {
      reportProgress: true
    });
    const r = this.http.request(req);
    let returnMe: any = null;
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
          const data = (event as HttpResponse<any>).body;
          this.percent.next(96);
          returnMe = data;
          // this.cache = data;
          this.percent.next(97);
        }
      }
    });
    await r.toPromise();
    return returnMe;
  }


  async loadJson(): Promise<void> {
    const req = new HttpRequest<any>('GET', '/assets/destiny2.json?v=' + env.versions.app, {
      reportProgress: true
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
          const data = (event as HttpResponse<any>).body;
          this.percent.next(96);
          this.cache = data;
          this.percent.next(97);
          this.percent.next(100);
          this.ready.next(true);
        }
      }
    });
    await r.toPromise();
    return;
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
          // const kbLoaded = Math.round(event.loaded / 1024);
          // console.log(`Download in progress! ${kbLoaded}Kb loaded`);
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
