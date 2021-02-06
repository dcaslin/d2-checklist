
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '@app/service/auth.service';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { Const, MilestoneActivity, Platform, SelectedUser } from '@app/service/model';
import { ParseService } from '@app/service/parse.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { Today, WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { environment as env } from '@env/environment';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BurnDialogComponent } from './burn-dialog/burn-dialog.component';

@Component({
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly isSignedOn: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly hideCompletePursuits: BehaviorSubject<boolean> = new BehaviorSubject(localStorage.getItem('hide-completed-pursuits') === 'true');
  public _hideCompletePursuits = this.hideCompletePursuits.getValue();

  readonly version = env.versions.app;
  manifestVersion = '';
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;

  hideAnnouncement = true;
  bountiesExpanded = true;

  selectedPlatform: Platform;
  gamerTag: string;
  showMoreInfo = false;
  today: Today = null;

  onHideAnnouncement() {
    this.hideAnnouncement = true;
    localStorage.setItem('hide-announcement-content-vault', 'true');
  }

  onToggleBounties(val: boolean) {
    this.bountiesExpanded = val;
    localStorage.setItem('expand-bounties', val.toString());
  }

  constructor(
    private destinyCacheService: DestinyCacheService,
    private signedOnUserService: SignedOnUserService,
    public bungieService: BungieService,
    private authService: AuthService,
    private parseService: ParseService,
    public iconService: IconService,
    public dialog: MatDialog,
    storageService: StorageService,
    private weekService: WeekService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.selectedPlatform = this.platforms[0];
    if (this.destinyCacheService.cache != null) {
      this.manifestVersion = this.destinyCacheService.cache.version;
    }
    this.hideAnnouncement = 'true' === localStorage.getItem('hide-announcement-content-vault');
    this.bountiesExpanded = 'true' === localStorage.getItem('expand-bounties');

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.defaultplatform != null) {
            this.setPlatform(x.defaultplatform);
            this.ref.markForCheck();
          }
          if (x.defaultgt != null) {
            this.gamerTag = x.defaultgt;
            this.ref.markForCheck();
          }
        });

  }

  private setPlatform(type: number) {
    // already set
    if (this.selectedPlatform != null && this.selectedPlatform.type === type) { return; }
    this.selectedPlatform = Const.PLATFORMS_DICT['' + type];
  }

  public routeSearch(): void {
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }

    this.router.navigate(['gt', this.selectedPlatform.type, this.gamerTag]);
  }

  onPlatformChange() {
    this.storageService.setItem('defaultplatform', this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem('defaultgt', this.gamerTag);
  }

  removeActivitySuffix(name: string) {
    if (name == null) {
      return null;
    }
    const spot = name.lastIndexOf(':');
    if (spot > 0) {
      return name.substring(0, spot);
    } else {
      return name;
    }
  }

  removeActivityPrefixes(name: string) {
    // return name;
    if (name == null) {
      return null;
    }
    const parts = name.split(':');
    return parts[parts.length - 1].trim();
  }

  showBurns(msa: MilestoneActivity) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = msa;
    this.dialog.open(BurnDialogComponent, dc);
  }

  logon() {
    this.authService.getCurrentMemberId(true);
  }

  async loadMileStones() {
    try {
      this.today = await this.weekService.getToday();
      this.ref.markForCheck();
    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() {
    this.loading.next(true);
    this.loadMileStones();
    // selected user changed
    this.signedOnUserService.signedOnUser$.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.isSignedOn.next(selectedUser != null);
    });

  }
}
