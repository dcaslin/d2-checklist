
import {filter, takeUntil} from 'rxjs/operators';
import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Subject } from 'rxjs';



import { MatSnackBar } from '@angular/material';
import { routerTransition } from './animations/router.transition';
import { environment as env } from '@env/environment';
import { NotificationService } from './service/notification.service';
import { StorageService } from './service/storage.service';
import { BungieService } from './service/bungie.service';
import { SelectedUser, ClanRow } from './service/model';
import { AuthService } from './service/auth.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { ChildComponent } from './shared/child.component';
import { AuthGuard } from '@app/app-routing.module';

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
    { link: 'home', label: 'Home' },
    { link: 'leaderboard/leviathan', label: 'Raid Leaderboard' },
    { link: 'leaderboard/leviathan-prestige', label: 'Prestige Leaderboard' },
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

  constructor(
    public authGuard: AuthGuard,
    private notificationService: NotificationService, private storageService: StorageService,
    private authService: AuthService,
    public bungieService: BungieService,
    private destinyCacheService: DestinyCacheService, public overlayContainer: OverlayContainer,
    private router: Router, public snackBar: MatSnackBar) {


    this.componentCssClass = 'default-theme';
    this.overlayContainer.getContainerElement().classList.add('default-theme');
    //this.overlayContainer.themeClass = 'default-theme';



    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.signedOnUser = selectedUser;
      this.loggingOn = false;
    });

    this.logon(false);

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
      x => {
        if (x.theme != null) {
          this.componentCssClass = x.theme;
          this.overlayContainer.getContainerElement().classList.add(x.theme);
          
          //this.overlayContainer.themeClass = x.theme;
        }
        if (x.disableads != null) {
          this.disableads = x.disableads;
        }
      });
    //emit current settings
    this.storageService.refresh();

    this.notificationService.notifyFeed.pipe(
      takeUntil(this.unsubscribe$))
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

  loadClan(clanRow: ClanRow) {
    if (this.signedOnUser != null) {
      this.router.navigate(["clan", clanRow.id]);
    }
  }

  myProfile() {
    if (this.signedOnUser != null) {
      this.router.navigate([this.signedOnUser.selectedUser.membershipType,
        this.signedOnUser.selectedUser.displayName]);
    }
  }

  refreshCurrency(){
    this.bungieService.refreshCurrency();
  }


  ngOnInit(): void {
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.unsubscribe$),)
      .subscribe(
      (navEnd: NavigationEnd) => {
        try {
          (window as any).ga('send', 'pageview', navEnd.urlAfterRedirects+"-"+(this.disableads?'disabledAds':'enabledAds'));
        }
        catch (err) {
          console.dir(err);
        }
      }
      );
    // this.destinyCacheService.init().then(() => {
    //   this.notificationService.info("Cache loaded");
    // })
      // .catch((err) => {
      //   console.dir(err);
      //   this.notificationService.fail("Failed to load destiny manifest.");
      // });
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
    console.log("Logout clicked, signing out.");
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