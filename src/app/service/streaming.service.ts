import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { NotificationService } from '@app/service/notification.service';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { catchError, concatAll, map, tap } from 'rxjs/operators';



@Injectable({
  providedIn: 'root',
})
export class StreamingService {

  public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  httpClient: HttpClient;
  bungieService: BungieService;
  notificationService: NotificationService;

  constructor(
    httpClient: HttpClient,
    bungieService: BungieService,
    notificationService: NotificationService
  ) {
    this.httpClient = httpClient;
    this.bungieService = bungieService;
    this.notificationService = notificationService;
  }

  streamReq(operation: string, url: string): Observable<any> {
    this.loading.next(true);
    return from(this.bungieService.buildReqOptions()).pipe(
      map((opt) => this.httpClient.get<any>(url, opt)),
      concatAll(),
      map(this.bungieService.parseBungieResponse),
      catchError(this.handleError<any>(operation, null)),
      tap((x) => this.loading.next(false))
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
          return of(result as T);
        }
      }
      console.dir(err);
      if (err.status === 0) {
        this.notificationService.fail(
          'Connection refused? Is your internet connected? ' +
            'Are you using something like Privacy Badger? ' +
            'If so, please whitelist Bungie.net or disable it for this site'
        );
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
