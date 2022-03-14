
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '@app/service/auth.service';
import { BungieService } from '@app/service/bungie.service';
import { ElasticSearchResult, ElasticSearchService } from '@app/service/elastic-search.service';
import { IconService } from '@app/service/icon.service';
import { Const, MilestoneActivity, Platform, SelectedUser } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { Today, WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { LostSectorNextDaysComponent } from '@app/shared/lost-sector-next-days/lost-sector-next-days.component';
import { environment as env } from '@env/environment';
import { BehaviorSubject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import { BurnDialogComponent } from './burn-dialog/burn-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly isSignedOn$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly version = env.versions.app;
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;
  readonly platformMap = Const.PLATFORMS_DICT;

  
  gamerTagControl = new FormControl();

  hideAnnouncement = true;
  bountiesExpanded = 'true' === localStorage.getItem('expand-bounties');
  dealsExpanded = 'false' !== localStorage.getItem('expand-deals');

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

  onToggleDeals(val: boolean) {
    this.dealsExpanded = val;
    localStorage.setItem('expand-deals', val.toString());
  }

  constructor(
    private signedOnUserService: SignedOnUserService,
    public bungieService: BungieService,
    public  elasticSearchService: ElasticSearchService,
    private authService: AuthService,
    public iconService: IconService,
    public dialog: MatDialog,
    storageService: StorageService,
    private weekService: WeekService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.selectedPlatform = this.platforms[0];
    this.hideAnnouncement = 'true' === localStorage.getItem('hide-announcement-content-vault');

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

  showLostSectorNextDays() {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    this.dialog.open(LostSectorNextDaysComponent, dc);
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
      this.isSignedOn$.next(selectedUser != null);
    });

    this.gamerTagControl.valueChanges.pipe(takeUntil(this.unsubscribe$), startWith('')).subscribe((value) => {
      this.elasticSearchService.searchInput$.next(value);
    } );

  }

  select(event: MatAutocompleteSelectedEvent) {
    const value: ElasticSearchResult = event.option.value;
    if (value) {
      this.router.navigate(['/',value.membershipType, value.membershipId])
    }
    
  }

  displayFn(user: ElasticSearchResult): string {
    return user? user.displayName : '';
  }
}
