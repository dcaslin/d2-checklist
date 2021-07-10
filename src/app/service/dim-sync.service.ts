import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AuthTokenRequest,
  AuthTokenResponse,
  ItemAnnotation,
  ProfileResponse,
  ProfileUpdate,
  ProfileUpdateRequest,
  ProfileUpdateResponse
} from '@destinyitemmanager/dim-api-types';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { SignedOnUserService } from './signed-on-user.service';

const LOG_CSS = `color: mediumseagreen`;

@Injectable({
  providedIn: 'root',
})
export class DimSyncService {
  public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private signedOnUserService: SignedOnUserService,
    private authService: AuthService
  ) { }

  private async buildHeaders(): Promise<HttpHeaders> {
    const auth = await this.logon();
    let headers = new HttpHeaders();
    headers = headers
      .set('X-API-Key', environment.bungie.dimApiKey)
      .set('Authorization', 'Bearer ' + auth.accessToken);
    return headers;
  }

  async logon(): Promise<CustomAuthTokenResponse> {
    const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
    if (!selectedUser) {
      return null;
    }

    const sDimAuth = localStorage.getItem('dim-authorization');
    if (sDimAuth) {
      try {
        const dimAuth: CustomAuthTokenResponse = JSON.parse(sDimAuth);
        if (dimAuth && dimAuth.expiration) {
          const now = new Date();
          if (now < new Date(dimAuth.expiration)) {
            return dimAuth;
          } else {
            console.log('DIM token expired, grabbing new one.');
          }
        }
      } catch (x) {
        // ignore
        console.dir(x);
      }
    }
    const req: AuthTokenRequest = {
      bungieAccessToken: await this.authService.getKey(),
      membershipId: selectedUser.membership.bungieId,
    };

    const headers = new HttpHeaders().set(
      'X-API-Key',
      environment.bungie.dimApiKey
    );
    console.log('%cGetting DIM token', LOG_CSS);
    const resp = await this.httpClient
      .post<CustomAuthTokenResponse>(
        'https://api.destinyitemmanager.com/auth/token',
        req,
        { headers }
      )
      .toPromise();
    if (resp.accessToken) {
      resp.expiration = new Date(
        1000 * (new Date().getTime() / 1000 + resp.expiresInSeconds - 100)
      ).toJSON();
      localStorage.setItem('dim-authorization', JSON.stringify(resp));
      return resp;
    }
    return null;
  }

  private logUpdates(updates: ProfileUpdate[]): void {
    const summary: any = {};
    for (const u of updates){
      if (summary[u.action] == null) {
        summary[u.action] = 0;
      }
      summary[u.action] = summary[u.action] + 1;
    }
    for (const key of Object.keys(summary)) {
      console.log(`    %c${key}: ${summary[key]}`, LOG_CSS);
    }
  }

  async setDimTags(updates: ProfileUpdate[]): Promise<boolean> {
    const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
    const body: ProfileUpdateRequest = {
      platformMembershipId: selectedUser.userInfo.membershipId,
      destinyVersion: 2,
      updates,
    };
    this.loading$.next(true);
    try {
      const headers = await this.buildHeaders();
      const url = `https://api.destinyitemmanager.com/profile`;
      console.log('%cSetting DIM tags', LOG_CSS);
      this.logUpdates(updates);
      console.dir(body);
      const hResp = await this.httpClient
        .post<ProfileUpdateResponse>(url, body, { headers })
        .toPromise();
      return true;
    } catch (x) {
      this.notificationService.fail('Failed to set DIM sync tags');
      console.dir(x);
      return false;
    } finally {
      this.loading$.next(false);
    }
  }

  async getDimTags(): Promise<ItemAnnotation[]> {
    const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
    this.loading$.next(true);
    try {
      console.log('%cGetting DIM tags', LOG_CSS);
      const headers = await this.buildHeaders();
      const url = `https://api.destinyitemmanager.com/profile?destinyVersion=2&platformMembershipId=${selectedUser.userInfo.membershipId}&components=tags`;
      const hResp = await this.httpClient
        .get<ProfileResponse>(url, { headers })
        .toPromise();
      // this.notificationService.success('Got latest DIM-sync tags');
      return hResp.tags;
    } catch (x) {
      this.notificationService.fail('Failed to get DIM-sync tags');
      console.dir(x);
      return [];
    } finally {
      this.loading$.next(false);
    }
  }

}

interface CustomAuthTokenResponse extends AuthTokenResponse {
  expiration: string;
}
