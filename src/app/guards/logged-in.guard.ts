import { Injectable } from '@angular/core';

import { AuthService } from '@app/service/auth.service';
import { NotificationService } from '@app/service/notification.service';
import { Destroyable } from '@app/util/destroyable';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Injectable()
export class LoggedInGuard extends Destroyable  {
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  public loggedIn: boolean = false;

  constructor(
    private auth: AuthService,
    private notifications: NotificationService
  ) {
    super();
    this.auth.authFeed.pipe(takeUntil(this.destroy$)).subscribe(x => this.loggedIn = !!x );
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
