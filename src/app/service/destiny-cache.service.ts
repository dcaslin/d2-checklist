import { Injectable } from '@angular/core';

import { environment as env } from '@env/environment';
import { Subject, BehaviorSubject } from 'rxjs';
import { HttpClient, HttpRequest, HttpEventType, HttpEvent, HttpResponse } from '@angular/common/http';
import { unzip } from 'zlib';

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
    console.log('Loading cache');
    try {
      await this.load();
    } catch (exc) {
      console.dir(exc);
      this.error.next('There was an error loading the Bungie Manifest DB, please refresh the page and try again.');
    }
    finally{
      this.percent.next(100);
    }
  }

  async unzip(blob: Blob): Promise<void> {
    const zip: any = new JSZip();
    const zip2 = await zip.loadAsync(blob);
    const data2 = await zip2.file('destiny2.json').async('string');
    this.cache = JSON.parse(data2);
    this.percent.next(100);
    this.ready.next(true);
  }

  async load(): Promise<void> {
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
    return;
  }
}
