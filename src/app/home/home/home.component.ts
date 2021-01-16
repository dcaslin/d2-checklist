
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { Today, WeekService } from '@app/service/week.service';
import { environment as env } from '@env/environment';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BountySet, Character, Const, MilestoneActivity, Platform, Player, SelectedUser, UserInfo, SaleItem } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { BountySetsDialogComponent, BountySetInfo } from './bounty-sets-dialog/bounty-sets-dialog.component';
import { BurnDialogComponent } from './burn-dialog/burn-dialog.component';
import { ParseService } from '@app/service/parse.service';
import { AuthService } from '@app/service/auth.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

@Component({
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly BOUNTY_CUTOFF = 4;
  readonly isSignedOn: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly showAllVendorBounties: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly showAllPlayerBounties: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly hideCompletePursuits: BehaviorSubject<boolean> = new BehaviorSubject(localStorage.getItem('hide-completed-pursuits') === 'true');
  public _hideCompletePursuits = this.hideCompletePursuits.getValue();

  readonly modalBountySet: BehaviorSubject<BountySet> = new BehaviorSubject(null);
  readonly refreshMe: Subject<void> = new Subject();

  readonly playerLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly player: BehaviorSubject<Player> = new BehaviorSubject(null);
  readonly char: BehaviorSubject<Character> = new BehaviorSubject(null);
  currentChar: Character = null;

  readonly vendorBountiesLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  readonly playerBountySets: BehaviorSubject<BountySet[]> = new BehaviorSubject([]);
  readonly rawVendorBountySets: BehaviorSubject<BountySet[]> = new BehaviorSubject([]);
  readonly vendorBountySets: BehaviorSubject<BountySet[]> = new BehaviorSubject([]);
  readonly shoppingListHashes: BehaviorSubject<{ [key: string]: boolean }> = new BehaviorSubject({});
  readonly shoppingList: BehaviorSubject<SaleItem[]> = new BehaviorSubject([]);

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
          let sl = x.shoppinglist as { [key: string]: boolean };
          sl = sl ? sl : {};
          this.shoppingListHashes.next(sl);
        });
    combineLatest([this.shoppingListHashes, this.rawVendorBountySets]).pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        ([sl, bs]) => {
          const built = this.parseService.buildShoppingList(sl, bs);
          this.shoppingList.next(built);
        });
  }

  public clearShoppingItems() {
    this.storageService.clearHashList('shoppinglist');
  }

  public removeShoppingItem(i: SaleItem) {
    this.storageService.untrackHashList('shoppinglist', i.hash);
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
    if (name==null) {
      return null;
    }
    const spot = name.lastIndexOf(':');
    if (spot>0) {
      return name.substring(0, spot);
    } else {
      return name;
    }
  }

  removeActivityPrefixes(name: string) {
    if (name==null) {
      return null;
    }
    const parts = name.split(':');
    return parts[parts.length-1].trim();
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

  showBountySet(bs: BountySet) {
    this.modalBountySet.next(bs);
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    const d: BountySetInfo = {
      modalBountySet: this.modalBountySet,
      playerLoading: this.playerLoading,
      vendorBountiesLoading: this.vendorBountiesLoading,
      refreshMe: this.refreshMe,
      shoppingList: this.shoppingList,
      shoppingListHashes: this.shoppingListHashes
    };
    dc.data = d;
    dc.width = '80%';
    const ref = this.dialog.open(BountySetsDialogComponent, dc);
    ref.afterClosed().subscribe(result => {
      this.modalBountySet.next(null);
    });
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
    if (!selectedUser) {
      return;
    }
    try {
      this.playerLoading.next(true);
      const player = await this.bungieService.getChars(selectedUser.userInfo.membershipType, selectedUser.userInfo.membershipId,
        ['Profiles', 'Characters', 'CharacterInventories', 'ItemObjectives', 'PresentationNodes', 'Records', 'Collectibles', 'ItemSockets', 'ItemPlugObjectives']);
      if (!player || !player.characters || player.characters.length == 0) {
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
      let bounties = await this.bungieService.groupVendorBounties(char);
      this.rawVendorBountySets.next(bounties);
      bounties = bounties.filter(bs => bs.bounties.length > 1);
      this.vendorBountySets.next(bounties);
    }
    finally {
      this.vendorBountiesLoading.next(false);
    }
  }

  async loadPlayerBountySets(char: Character) {
    const bounties = this.parseService.groupCharBounties(this.player.getValue(), char, this._hideCompletePursuits);
    this.playerBountySets.next(bounties);
  }

  ngOnInit() {
    this.loading.next(true);
    this.loadMileStones();
    this.refreshMe.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
      this.loadPlayerForBounties(this.signedOnUserService.signedOnUser$.getValue());
    });
    // selected user changed
    this.signedOnUserService.signedOnUser$.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.player.next(null);
      this.isSignedOn.next(selectedUser != null);
      this.refreshMe.next();
    });
    this.player.pipe(takeUntil(this.unsubscribe$)).pipe(takeUntil(this.unsubscribe$)).subscribe((player: Player) => {
      this.rawVendorBountySets.next([]);
      this.vendorBountySets.next([]);
      this.playerBountySets.next([]);
      if (!player || !player.characters || player.characters.length == 0) {
        this.char.next(null);
        return;
      }
      this.char.next(player.characters[0]);
    });

    this.hideCompletePursuits.pipe(takeUntil(this.unsubscribe$)).subscribe((x: boolean) => {
      this._hideCompletePursuits = x;
      localStorage.setItem('hide-completed-pursuits', '' + x);
      this.loadPlayerBountySets(this.char.getValue());
    });

    this.char.pipe(takeUntil(this.unsubscribe$)).subscribe((char: Character) => {
      this.currentChar = char;
      this.rawVendorBountySets.next([]);
      this.vendorBountySets.next([]);
      this.playerBountySets.next([]);
      if (!char) {
        return;
      }

      this.loadVendorBountySets(char);
      this.loadPlayerBountySets(char);

    });
    combineLatest(this.vendorBountySets, this.playerBountySets).pipe(
      takeUntil(this.unsubscribe$)).subscribe(
        ([vendorBs, playerBs]) => {
          const currModal = this.modalBountySet.getValue();
          if (!currModal) {
            return;
          }
          const checkMe = currModal.type == 'held' ? playerBs : vendorBs;
          for (const bs of checkMe) {
            if (bs.tag == currModal.tag) {
              this.modalBountySet.next(bs);
              console.dir(bs);
              return;
            }
          }

        }
      );


  }
}
