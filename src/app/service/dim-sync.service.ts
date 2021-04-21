import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { environment as env } from '@env/environment';
import { AuthInfo, AuthService } from './auth.service';
import { SelectedUser } from './model';
import { SignedOnUserService } from './signed-on-user.service';
import { environment } from '../../environments/environment';
import { AuthTokenRequest, AuthTokenResponse, ItemAnnotation, ProfileResponse, ProfileUpdate, ProfileUpdateRequest, ProfileUpdateResponse } from '@destinyitemmanager/dim-api-types';

@Injectable({
  providedIn: 'root'
})
export class DimSyncService {
  // TODO finish this

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private signedOnUserService: SignedOnUserService,
    private authService: AuthService) { }


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
      membershipId: selectedUser.membership.bungieId
    };

    const headers = new HttpHeaders().set('X-API-Key', environment.bungie.dimApiKey);
    const resp = await this.httpClient.post<CustomAuthTokenResponse>('https://api.destinyitemmanager.com/auth/token', req, { headers }).toPromise();
    if (resp.accessToken) {
      resp.expiration = new Date(1000 * (new Date().getTime() / 1000 + resp.expiresInSeconds - 100)).toJSON();
      localStorage.setItem('dim-authorization', JSON.stringify(resp));
      return resp;
    }
    return null;
  }

  async setDimTags(deleteTags: string[], newTags: ItemAnnotation[]): Promise<void> {
    const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
    const headers = await this.buildHeaders();
    const url = `https://api.destinyitemmanager.com/profile`;
    const newTagUpdates: ProfileUpdate[] = newTags.map((x) => {
      return {
        action: 'tag',
        payload: x
      };
    });
    const updates: ProfileUpdate[] = [
      {
        action: 'tag_cleanup',
        payload: deleteTags
      },
      ...newTagUpdates
    ];

    const body: ProfileUpdateRequest = {

      platformMembershipId: selectedUser.userInfo.membershipId,
      destinyVersion: 2,
      updates
    };
    const hResp = await this.httpClient.post<ProfileUpdateResponse>(url, body, { headers }).toPromise();
    console.dir(hResp);
  }


  async getDimTags(): Promise<ItemAnnotation[]> {
    const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
    // try {
    const headers = await this.buildHeaders();
    const url = `https://api.destinyitemmanager.com/profile?destinyVersion=2&platformMembershipId=${selectedUser.userInfo.membershipId}&components=tags`;
    const hResp = await this.httpClient.get<ProfileResponse>(url, { headers }).toPromise();
    return hResp.tags;
  }
}

interface CustomAuthTokenResponse extends AuthTokenResponse {
  expiration: string;
}

// Upgrade -> Favorite
// Keep -> keep
// infuse -> infuse
// junk -> junk
// ? -> archive
// notes to notes


// x 0. Allow downloading and restoring tags/notes in D2Checklist
// ? 1. Store config for dim api key
// 2. Show dialog with proper information re: using it
// 3. Sync from d2checklist to DIM
// 4. Sync from DIM to d2checklist
