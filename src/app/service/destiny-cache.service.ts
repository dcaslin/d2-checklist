import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';

declare let JSZip: any;
declare let JSZipUtils: any;

@Injectable()
export class DestinyCacheService {
  public cache: any;

  constructor() {
  }

  init(): Promise<any> {
    let self: DestinyCacheService = this;
    return new Promise(function (resolve, reject) {
      JSZipUtils.getBinaryContent("/assets/destiny2.zip", function (err, data) {
        if (err) {
          reject(err);
          return;
        }
        let zip: any = new JSZip();
        zip.loadAsync(data).then(function (zip) {
          zip.file("destiny2.json").async("string").then(function (data) {
              self.cache = JSON.parse(data);
              resolve();
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
