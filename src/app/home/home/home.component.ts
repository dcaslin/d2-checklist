
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { Today, WeekService } from '@app/service/week.service';
import { environment as env } from '@env/environment';
import { takeUntil } from 'rxjs/operators';
import { Const, Platform, MilestoneActivity, SelectedUser, BountySet } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { BurnDialogComponent } from './burn-dialog/burn-dialog.component';
import { BungieService } from '@app/service/bungie.service';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {

  readonly isSignedOn: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly showAllBounties: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly bountiesLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly bountySets: BehaviorSubject<BountySet[]> = new BehaviorSubject([]);
  readonly version = env.versions.app;
  manifestVersion = '';
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;

  selectedPlatform: Platform;
  gamerTag: string;
  showMoreInfo = false;
  today: Today = null;


  constructor(
    private destinyCacheService: DestinyCacheService,
    private bungieService: BungieService,
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

  showBurns(msa: MilestoneActivity) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = msa;
    this.dialog.open(BurnDialogComponent, dc);
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

  async loadBountieGroups(selectedUser: SelectedUser) {
    if (!selectedUser || !selectedUser.userInfo) {
      return;
    }
    try {
      this.bountiesLoading.next(true);
      const player = await this.bungieService.getChars(selectedUser.userInfo.membershipType, selectedUser.userInfo.membershipId, ['Profiles', 'Characters']);
      if (!player.characters || player.characters.length == 0) {
        return;
      }
      const bounties = await this.bungieService.groupBounties(player.characters[0]);
      this.bountySets.next(bounties);
      for (const bs of bounties) {
        if (bs.bounties.length >= 4) {
          console.log('---' + bs.tag + " - " + bs.bounties.length);
          // for (const b of bs.bounties) {
          //   console.log('    ' + b.name + ': ' + b.tags);
          //   console.dir(b);
          // }
        }

      }
    }
    finally {
      this.bountiesLoading.next(false);
    }
  }

  ngOnInit() {

    this.loading.next(true);
    this.loadMileStones();

    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      if (!selectedUser) {
        this.isSignedOn.next(false);
        this.bountySets.next([]);
      } else {
        this.isSignedOn.next(true);
        this.bountySets.next([]);
        this.loadBountieGroups(selectedUser);
      }
    });
  }
}
