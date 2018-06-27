import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { environment as env } from '@env/environment';

declare let JSZip: any;
declare let JSZipUtils: any;

@Injectable()
export class DestinyCacheService {
  public cache: any;

  constructor() {
  }

  init(): Promise<boolean> {
    let self: DestinyCacheService = this;
    if (self.cache!=null) {
      console.log("Cache already loaded");
      return Promise.resolve(true);
    }
    return new Promise(function (resolve, reject) {
      JSZipUtils.getBinaryContent("/assets/destiny2.zip?v="+env.versions.app, function (err, data) {
        if (err) {
          reject(err);
          return;
        }
        let zip: any = new JSZip();
        zip.loadAsync(data).then(function (zip) {
          zip.file("destiny2.json").async("string").then(function (data) {
              self.cache = JSON.parse(data);
              console.log("Init cache load");
              resolve(true);
              return;
            },
            function (err) {
              reject(err);
              return;
            });
        });
      });
    });
  }
}
