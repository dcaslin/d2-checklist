import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { bungieDev } from '@env/keys';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AuthService } from '@app/service/auth.service';

/**
 * Responsible for adding auth headers to outbound requests
 */
@Injectable()
export class HttpService {

  private authKey: string;

  constructor(private http: HttpClient,
    private auth: AuthService) {
      this.loadAuthKey();
    }

  public get(url: string, options?: any): Observable<any> {
    options = options || {};
    let headers = new HttpHeaders(options.headers)
      .set('x-api-key', bungieDev.apiKey);

    // add the auth header if we have an auth key
    headers = this.authKey ? headers.set('authorization', `Bearer ${this.authKey}`) : headers;

    const withHeaders = { ...options, headers };
    return this.http.get(url, withHeaders);
  }

  private loadAuthKey() {
    from(this.auth.getKey()).subscribe((key: string) => {
      this.authKey = key;
    });
  }

}
