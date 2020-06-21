import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthInfo, AuthService } from '@app/service/auth.service';
import { bungieDev } from '@env/keys';
import { Observable } from 'rxjs';

/**
 * Responsible for adding auth headers to outbound requests
 */
@Injectable()
export class HttpService {

  private authHeader: string;

  constructor(private http: HttpClient,
    private auth: AuthService) {
      this.loadAuthKey();
    }

  public get(url: string, options?: any): Observable<any> {
    options = options || {};
    let headers = new HttpHeaders(options.headers)
      .set('x-api-key', bungieDev.apiKey);

    // add the auth header if we have an auth key
    headers = this.authHeader ? headers.set('authorization', this.authHeader) : headers;

    const withHeaders = { ...options, headers };
    return this.http.get(url, withHeaders);
  }

  private loadAuthKey() {
    this.auth.authFeed.subscribe((info: AuthInfo) => {
      this.authHeader = info.header;
    });
  }

}
