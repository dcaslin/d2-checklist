
import { OverlayContainer } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Inject, OnDestroy, OnInit, HostListener } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { AuthGuard } from '@app/app-routing.module';
import { environment as env } from '@env/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from './service/auth.service';
import { BungieService } from './service/bungie.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { IconService } from './service/icon.service';
import { ClanRow, Const, SelectedUser, UserInfo } from './service/model';
import { NotificationService } from './service/notification.service';
import { StorageService } from './service/storage.service';
import { PwaService } from './service/pwa.service';

@Component({
  selector: 'd2c-success-snack',
  templateUrl: 'snackbars/success.html',
  styleUrls: ['snackbars/success.css']
})
export class SuccessSnackbarComponent {
  message: string;
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    this.message = data.message;
  }
}

@Component({
  selector: 'd2c-info-snack',
  templateUrl: 'snackbars/info.html',
  styleUrls: ['snackbars/info.css'],
})
export class InfoSnackbarComponent {
  message: string;
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    this.message = data.message;
  }
}

@Component({
  selector: 'd2c-warn-snack',
  templateUrl: 'snackbars/warn.html',
  styleUrls: ['snackbars/warn.css']
})
export class WarnSnackbarComponent {
  message: string;
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {
    this.message = data.message;
  }
}

@Component({
  selector: 'd2c-select-platform-dialog',
  templateUrl: './select-platform-dialog.component.html',
})
export class SelectPlatformDialogComponent {
  public const: Const = Const;
  public PLATFORMS_DICT = Const.PLATFORMS_DICT;
  newMessage = '';
  constructor(
    public dialogRef: MatDialogRef<SelectPlatformDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserInfo[]) { }


  onSelect(u: UserInfo): void {
    this.dialogRef.close(u);
  }
}


@Component({
  selector: 'd2c-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();

  @HostBinding('class') componentCssClass;

  readonly version = env.versions.app;
  readonly year = new Date().getFullYear();
  readonly logo = require('../assets/logo.svg');

  public readonly const: Const = Const;
  public PLATFORMS_DICT = Const.PLATFORMS_DICT;


  disableads: boolean; // for GA

  // signed on info

  public loggingOn: BehaviorSubject<boolean> = new BehaviorSubject(true);
  public signedOnUser: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);

  public showInstallButton: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public debugmode: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    public authGuard: AuthGuard,
    public iconService: IconService,
    private notificationService: NotificationService, private storageService: StorageService,
    private authService: AuthService,
    public bungieService: BungieService,
    public overlayContainer: OverlayContainer,
    public destinyCacheService: DestinyCacheService,
    private router: Router, public snackBar: MatSnackBar,
    private pwaService: PwaService,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private ref: ChangeDetectorRef) {


    this.componentCssClass = 'default-theme';
    this.overlayContainer.getContainerElement().classList.add('default-theme');

    this.logon(false);

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.theme != null) {
            this.overlayContainer.getContainerElement().classList.remove(this.componentCssClass);
            document.body.classList.remove('parent-' + this.componentCssClass);
            this.componentCssClass = x.theme;
            this.overlayContainer.getContainerElement().classList.add(x.theme);
            document.body.classList.add('parent-' + x.theme);
            this.ref.markForCheck();
          }
          if (x.disableads != null) {
            this.disableads = x.disableads;
            this.ref.markForCheck();
          }
          if (x.debugmode != null) {
            this.debugmode.next(x.debugmode);
        }
        });

    this.notificationService.notifyFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.mode === 'success') {
            this.snackBar.openFromComponent(SuccessSnackbarComponent, {
              duration: 2000,
              data: {
                message: x.message
              }
            });
          } else if (x.mode === 'info') {
            this.snackBar.openFromComponent(InfoSnackbarComponent, {
              duration: 2000,
              data: {
                message: x.message
              }
            });
          } else if (x.mode === 'error') {
            this.snackBar.openFromComponent(WarnSnackbarComponent, {
              duration: 5000,
              data: {
                message: x.message
              }
            });
          }
        });
  }


  deferredPrompt: any;

  @HostListener('window:beforeinstallprompt', ['$event'])
  beforeInstall(e) {
    console.log(e);
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    this.deferredPrompt = e;
    this.showInstallButton.next(true);
  }

  install() {
    // hide our user interface that shows our A2HS button
    this.showInstallButton.next(false);
    if (!this.deferredPrompt) {
      return;
    }
    // Show the prompt
    this.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    this.deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.deferredPrompt = null;
      });
  }


  public openDialog(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.width = '300px';
    dc.data = this.signedOnUser.value.membership.destinyMemberships;

    const dialogRef = this.dialog.open(SelectPlatformDialogComponent, dc);

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result == null) { return; }
      this.selectUser(result);
    });
  }


  loadClan(clanRow: ClanRow) {
    if (this.signedOnUser != null) {
      this.router.navigate(['clan', clanRow.id]);
    }
  }

  private static getFinalComponent(r: ActivatedRoute): string {
    // grab platform while we're here
    if (r.snapshot.params.platform != null) {
      (window as any).ga('set', 'platform', r.snapshot.params.platform);
    }
    if (r.children != null && r.children.length > 0) {
      if (r.routeConfig != null) {
        return r.routeConfig.path + '/' + AppComponent.getFinalComponent(r.children[0]);
      }
      return AppComponent.getFinalComponent(r.children[0]);

    }
    return r.routeConfig.path;
  }

  ngOnInit(): void {
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.signedOnUser.next(selectedUser);
      this.loggingOn.next(false);
      if (selectedUser == null) { return; }
      if (selectedUser.promptForPlatform === true) {
        selectedUser.promptForPlatform = false;
        this.openDialog();
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.unsubscribe$))
      .subscribe(
        (navEnd: NavigationEnd) => {
          try {
            const route = this.route;
            const path = AppComponent.getFinalComponent(route);
            (window as any).ga('set', 'disabled-ads', this.disableads);
            (window as any).ga('send', 'pageview', path);
            // const platform = (window as any).ga('get', 'platform');
            // console.log(path + ': ' + this.disableads + ': ' + platform);
          } catch (err) {
            console.dir(err);
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  logon(force: boolean) {
    this.authService.getCurrentMemberId(force);
    this.ref.markForCheck();
  }

  selectUser(user) {
    this.bungieService.selectUser(user);
    this.ref.markForCheck();
  }

  onLoginClick() {
    this.logon(true);

  }

  onLogoutClick() {
    this.authService.signOut();
    this.ref.markForCheck();
  }

}
