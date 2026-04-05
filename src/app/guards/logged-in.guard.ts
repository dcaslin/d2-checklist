import { Injectable } from '@angular/core';

import { AuthService } from '@app/service/auth.service';
import { NotificationService } from '@app/service/notification.service';
import { Observable } from 'rxjs';


@Injectable()
export class LoggedInGuard  {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  public loggedIn: boolean = false;

  constructor(
    private auth: AuthService,
    private notifications: NotificationService
  ) {
    this.auth.authFeed.subscribe(x => this.loggedIn = !!x );
  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.loginCheckAndAlert();
  }

  canActivateChild(): Observable<boolean> | Promise<boolean> | boolean {
    return this.loginCheckAndAlert();
  }

  private loginCheckAndAlert(): Observable<boolean> | Promise<boolean> | boolean {
    if (!this.loggedIn) {
      this.notifications.fail('Sorry, you need to be logged in to view that page!');
    }
    return this.loggedIn;
  }
}
