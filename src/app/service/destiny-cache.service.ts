import {Injectable} from '@angular/core';

import { environment as env } from '@env/environment';

declare let JSZip: any;
declare let JSZipUtils: any;

@Injectable()
export class DestinyCacheService {
  public cache: any;

  constructor() {
  }

  init(): Promise<boolean> {
    const self: DestinyCacheService = this;
    if (self.cache != null) {
      return Promise.resolve(true);
    }
    return new Promise(function (resolve, reject) {
      JSZipUtils.getBinaryContent('/assets/destiny2.zip?v=' + env.versions.app, function (err, data) {
        if (err) {
          reject(err);
          return;
        }
        const zip: any = new JSZip();
        zip.loadAsync(data).then(function (zip2) {
          zip2.file('destiny2.json').async('string').then(function (data2) {
              self.cache = JSON.parse(data2);
              resolve(true);
              return;
            },
            function (err2) {
              reject(err2);
              return;
            });
        });
      });
    });
  }
}
