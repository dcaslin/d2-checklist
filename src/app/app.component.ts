import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { OverlayContainer } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import { MdSnackBar } from '@angular/material';
import { routerTransition } from './animations/router.transition';
import { environment as env } from '@env/environment';
import { NotificationService } from './service/notification.service';
import { StorageService } from './service/storage.service';
import { BungieService } from './service/bungie.service';
import { SelectedUser } from './service/model';
import { AuthService } from './service/auth.service';
import { DestinyCacheService } from './service/destiny-cache.service';

@Component({
  selector: 'anms-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routerTransition]
})
export class AppComponent implements OnInit, OnDestroy {

  private unsubscribe$: Subject<void> = new Subject<void>();

  @HostBinding('class') componentCssClass;

  disableads: boolean;

  version = env.versions.app;
  year = new Date().getFullYear();
  logo = require('../assets/logo.png');
  navigation = [
    { link: 'search', label: 'Search Users' },
    { link: 'about', label: 'About' }
  ];
  navigationSideMenu = [
    ...this.navigation,
    { link: 'settings', label: 'Settings' }
  ];

  //signed on info
  loggingOn = true;
  signedOnUser: SelectedUser = null;

  constructor(private notificationService: NotificationService, private storageService: StorageService,
    private authService: AuthService,
    private bungieService: BungieService,
    private destinyCacheService: DestinyCacheService, public overlayContainer: OverlayContainer,
    private router: Router, public snackBar: MdSnackBar) {

    this.componentCssClass = 'default-theme';
    this.overlayContainer.themeClass = 'default-theme';



    this.bungieService.selectedUserFeed.takeUntil(this.unsubscribe$).subscribe((selectedUser: SelectedUser) => {
      this.signedOnUser = selectedUser;
      this.loggingOn = false;
    });

    this.logon(false);

    this.storageService.settingFeed
      .takeUntil(this.unsubscribe$)
      .subscribe(
      x => {
        if (x.theme != null) {
          this.componentCssClass = x.theme;
          this.overlayContainer.themeClass = x.theme;
        }
        if (x.disableads != null) {
          this.disableads = x.disableads;
        }
      });
    //emit current settings
    this.storageService.refresh();

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

  myClan() {
    if (this.signedOnUser != null) {
      console.log(this.signedOnUser.membership.clanId);
      this.router.navigate(["clan", this.signedOnUser.membership.clanId]);
    }
  }

  myProfile() {
    if (this.signedOnUser != null) {
      this.router.navigate([this.signedOnUser.selectedUser.membershipType,
        this.signedOnUser.selectedUser.displayName]);
    }
  }


  ngOnInit(): void {
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
    this.destinyCacheService.init().then(() => {
      //this.notificationService.info("Cache loaded");
    })
      .catch((err) => {
        console.dir(err);
        this.notificationService.fail("Failed to load destiny manifest.");
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  logon(force: boolean) {
    this.authService.getCurrentMemberId(force);
  }

  selectUser(user) {
    this.bungieService.selectUser(user);
  }

  onLoginClick() {
    this.logon(true);

  }

  onLogoutClick() {
    this.authService.signOut();
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