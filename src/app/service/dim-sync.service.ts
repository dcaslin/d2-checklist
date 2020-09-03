import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { environment as env } from '@env/environment';
import { AuthInfo, AuthService } from './auth.service';
import { SelectedUser } from './model';

@Injectable({
  providedIn: 'root'
})
export class DimSyncService {
  // TODO finish this

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService,
    private authService: AuthService) { }

  async logon(selectedUser: SelectedUser): Promise<AuthResp> {
    const sDimAuth = localStorage.getItem('dim-authorization');
    if (sDimAuth) {
      try {
        const dimAuth: AuthResp = JSON.parse(sDimAuth);
        if (dimAuth && dimAuth.expiration) {
          const now = new Date();
          if (now < new Date(dimAuth.expiration)) {
            return dimAuth;
          }
        }
      } catch (x) {
        // ignore
        console.dir(x);
      }
    }
    const req = {
      app: 'd2checklist',
      bungieAccessToken: this.authService.getKey(),
      membershipId: selectedUser.membership.bungieId
    };
    const resp = await this.httpClient.post<AuthResp>('https://api.destinyitemmanager.com/auth/token', req).toPromise();
    if (resp.accessToken) {
      resp.expiration = new Date(1000 * (new Date().getTime() / 1000 + resp.expiresInSeconds - 100)).toJSON();
      localStorage.setItem('dim-authorization', JSON.stringify(resp));
      return resp;
    }
    return null;
  }
}

interface AuthReq {
  app: string;
  bungieAccessToken: string;
  membershipId: string;
}

interface AuthResp {
  accessToken: string;
  expiresInSeconds: number;
  expiration?: string;
}

interface UpdateRequest {
  platformMembershipId: string;
  destinyVersion: number;
  updates: UpdateRow[];
}

interface UpdateRow {
  action: string;
  payload: UpdateRowPayload;
}

interface UpdateRowPayload {
  id: string;
  tag: string;
}

interface TagsResp {
  tags: Tag[];
}

interface Tag {
  id: string;
  tag: string;
  notes?: string;
}

// Upgrade -> Favorite
// Keep -> keep
// infuse -> infuse
// junk -> junk
// ? -> archive
// notes to notes


// 0. Allow downloading and restoring tags/notes in D2Checklist
// 1. Store config for dim api key
// 2. Show dialog with proper information re: using it
// 3. Sync from d2checklist to DIM
// 4. Sync from DIM to d2checklist
