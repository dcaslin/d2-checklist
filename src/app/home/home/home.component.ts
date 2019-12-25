
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { Today, WeekService } from '@app/service/week.service';
import { environment as env } from '@env/environment';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BountySet, Character, Const, MilestoneActivity, Platform, Player, SelectedUser } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { BountySetsDialogComponent } from './bounty-sets-dialog/bounty-sets-dialog.component';
import { BurnDialogComponent } from './burn-dialog/burn-dialog.component';

@Component({
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly BOUNTY_CUTOFF = 4;
  readonly isSignedOn: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly showAllBounties: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly playerLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly player: BehaviorSubject<Player> = new BehaviorSubject(null);
  readonly char: BehaviorSubject<Character> = new BehaviorSubject(null);

  readonly vendorBountiesLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly playerBountiesLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly playerBountySets: BehaviorSubject<BountySet[]> = new BehaviorSubject([]);
  readonly vendorBountySets: BehaviorSubject<BountySet[]> = new BehaviorSubject([]);


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

  showBountySet(bs: BountySet) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = bs;
    dc.width = '80%';
    this.dialog.open(BountySetsDialogComponent, dc);
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

  async loadPlayerForBounties(selectedUser: SelectedUser) {
    if (!selectedUser || !selectedUser.userInfo) {
      return;
    }
    try {
      this.playerLoading.next(true);
      const player = await this.bungieService.getChars(selectedUser.userInfo.membershipType, selectedUser.userInfo.membershipId, ['Profiles', 'Characters']);
      if (!player.characters || player.characters.length == 0) {
        return;
      }
      this.player.next(player);
    }
    finally {
      this.playerLoading.next(false);
    }
  }

  async loadVendorBountySets(char: Character) {
    try {
      this.vendorBountiesLoading.next(true);
      const bounties = await this.bungieService.groupBounties(char);
      this.vendorBountySets.next(bounties);
    }
    finally {
      this.vendorBountiesLoading.next(false);
    }
  }

  async loadPlayerBountySets(char: Character) {
    try {
      this.playerBountiesLoading.next(true);
      const bounties = await this.bungieService.groupBounties(char);
      this.playerBountySets.next(bounties);
    }
    finally {
      this.playerBountiesLoading.next(false);
    }
  }


  ngOnInit() {

    this.loading.next(true);
    this.loadMileStones();

    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.player.next(null);
      this.isSignedOn.next(selectedUser != null);
      this.loadPlayerForBounties(selectedUser);
    });
    this.player.pipe(takeUntil(this.unsubscribe$)).pipe(takeUntil(this.unsubscribe$)).subscribe((player: Player) => {
      this.vendorBountySets.next([]);
      this.playerBountySets.next([]);
      if (!player || !player.characters || player.characters.length == 0) {
        this.char.next(null);
        return;
      }
      this.char.next(player.characters[0]);
    });
    this.char.pipe(takeUntil(this.unsubscribe$)).pipe(takeUntil(this.unsubscribe$)).subscribe((char: Character) => {
      this.vendorBountySets.next([]);
      this.playerBountySets.next([]);
      if (!char) {
        return;
      }

      this.loadVendorBountySets(char);
      this.loadPlayerBountySets(char);

    });


  }
}
