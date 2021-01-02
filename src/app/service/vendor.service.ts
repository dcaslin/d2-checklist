import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, defer, from } from 'rxjs';
import { catchError, concatAll, flatMap, map, switchAll, switchMap } from 'rxjs/operators';
import { API_ROOT, BungieService } from './bungie.service';
import { NotificationService } from './notification.service';
import { Character } from './model';
import { ParseService } from './parse.service';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

  constructor(
    private httpClient: HttpClient,
    private bungieService: BungieService,
    private notificationService: NotificationService,
    private parseService: ParseService) {

  }

  public loadVendors(c: Character): Observable<number> {
    const url = 'Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' +
      c.characterId + '/Vendors/?components=Vendors,VendorSales,ItemStats,ItemSockets,ItemInstances';
    return this.streamReq('loadVendors', url)
      .pipe(
        map((resp) => {
          const vendors = resp?.vendors;
          if (!vendors) {
            return 0;
          } else {
            return Object.keys(vendors).length;
          }
        })
      );
  }

  private streamReq(operation: string, uri: string): Observable<any> {
    return from(this.bungieService.buildReqOptions()).pipe(
      map(opt => this.httpClient.get<any>(API_ROOT + uri, opt)),
      concatAll(),
      map(this.bungieService.parseBungieResponse),
      catchError(this.handleError<any>(operation, null)),
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (err: any): Observable<T> => {

      if (err.error != null) {
        const j = err.error;
        if (j.ErrorCode && j.ErrorCode !== 1) {
          if (j.ErrorCode === 1665) {
            // ignore this for now
          }
          if (j.ErrorCode === 5) {
            this.bungieService.apiDown = true;
          }
          this.notificationService.fail(j.Message);
          return;
        }
      }
      console.dir(err);
      if (err.status === 0) {
        this.notificationService.fail('Connection refused? Is your internet connected? ' +
          'Are you using something like Privacy Badger? ' +
          'If so, please whitelist Bungie.net or disable it for this site');
      } else if (err.message != null) {
        this.notificationService.fail(err.message);
      } else if (err.status != null) {
        this.notificationService.fail(err.status + ' ' + err.statusText);
      } else {
        this.notificationService.fail('Unexpected problem: ' + err);
      }
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }


}

export interface VendorData {
  name: string;
}
