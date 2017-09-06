import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { OverlayContainer } from '@angular/material';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';


import { MdSnackBar } from '@angular/material';

import { login, logout, selectorAuth, routerTransition } from '@app/core';
import { environment as env } from '@env/environment';

import { selectorSettings } from './settings';
import { NotificationService } from './service/notification.service';

@Component({
  selector: 'anms-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routerTransition]
})
export class AppComponent implements OnInit, OnDestroy {

  private unsubscribe$: Subject<void> = new Subject<void>();

  @HostBinding('class') componentCssClass;


  version = env.versions.app;
  year = new Date().getFullYear();
  logo = require('../assets/logo.png');
  navigation = [
    { link: 'about', label: 'About' }
  ];
  navigationSideMenu = [
    ...this.navigation,
    { link: 'settings', label: 'Settings' }
  ];
  isAuthenticated;

  constructor(private notificationService: NotificationService, public overlayContainer: OverlayContainer,
    private store: Store<any>, private router: Router, public snackBar: MdSnackBar) {
  }

  ngOnInit(): void { 
    this.store
      .select(selectorSettings)
      .takeUntil(this.unsubscribe$)
      .map(({ theme }) => (theme!=null)?theme.toLowerCase():null)
      .subscribe(theme => {
        this.componentCssClass = theme;
        this.overlayContainer.themeClass = theme;
      });
    this.store
      .select(selectorAuth)
      .takeUntil(this.unsubscribe$)
      .subscribe(auth => this.isAuthenticated = auth.isAuthenticated);
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .takeUntil(this.unsubscribe$)
      .subscribe(
      (navEnd: NavigationEnd) => {
        try {
          (window as any).ga('send', 'pageview', navEnd.urlAfterRedirects);
        }
        catch (e) {
          console.log(e);
        }
      }
      );
    this.notificationService.notifyFeed
      .takeUntil(this.unsubscribe$)
      .subscribe(
      x => {
        if (x.mode === "success") {
          let snackRef = this.snackBar.openFromComponent(SuccessSnackbarComponent, {
            duration: 2000
          });
          snackRef.instance.message = x.message;
        }

        else if (x.mode === "info") {
          let snackRef = this.snackBar.openFromComponent(InfoSnackbarComponent, {
            duration: 2000
          });
          snackRef.instance.message = x.message;
        }
        else if (x.mode === "error") {
          let snackRef = this.snackBar.openFromComponent(WarnSnackbarComponent, {
            duration: 5000
          });
          snackRef.instance.message = x.message;
        }


      });
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onLoginClick() {
    this.store.dispatch(login());
  }

  onLogoutClick() {
    this.store.dispatch(logout());
  }

}


@Component({
  selector: 'success-snack',
  templateUrl: 'snackbars/success.html',
  styleUrls: ['snackbars/success.css'],
})
export class SuccessSnackbarComponent {
  message: string;

}

@Component({
  selector: 'info-snack',
  templateUrl: 'snackbars/info.html',
  styleUrls: ['snackbars/info.css'],
})
export class InfoSnackbarComponent {
  message: string;

}


@Component({
  selector: 'warn-snack',
  templateUrl: 'snackbars/warn.html',
  styleUrls: ['snackbars/warn.css'],
})
export class WarnSnackbarComponent {
  message: string;

}