import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { PlBucketDialogComponent } from '@app/player/pl-bucket-dialog/pl-bucket-dialog.component';
import { PlayerStateService } from '@app/player/player-state.service';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { Character, ClassAllowed, Const, DamageType, EnergyType, InventoryItem, ItemType, Player, SelectedUser, Target } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { PandaGodrollsService } from '@app/service/panda-godrolls.service';
import { OLD_PREF_STATS_KEY, PreferredStatService } from '@app/service/preferred-stat.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { ClipboardService } from 'ngx-clipboard';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, filter, takeUntil, tap } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { PossibleRollsDialogComponent } from '../possible-rolls-dialog/possible-rolls-dialog.component';
import { TargetArmorStatsDialogComponent } from '../target-armor-stats-dialog/target-armor-stats-dialog.component';
import { ArmorPerksDialogComponent } from './armor-perks-dialog/armor-perks-dialog.component';
import { BulkOperationsHelpDialogComponent } from './bulk-operations-help-dialog/bulk-operations-help-dialog.component';
import { GearCompareDialogComponent } from './gear-compare-dialog/gear-compare-dialog.component';
import { GearFilterStateService, ShortcutInfo, TabOption } from './gear-filter-state.service';
import { GearHelpDialogComponent } from './gear-help-dialog/gear-help-dialog.component';
import { GearUtilitiesDialogComponent } from './gear-utilities-dialog/gear-utilities-dialog.component';
import { ModHelperDialogComponent } from './mod-helper-dialog/mod-helper-dialog.component';
import { SeasonBreakdownDialogComponent } from './season-breakdown-dialog/season-breakdown-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearComponent extends ChildComponent implements OnInit {


  // show thinking while gear filtering is occurring
  public filtering: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private shortcutInfo$: BehaviorSubject<ShortcutInfo|null> = new BehaviorSubject(null);

  @ViewChild('paginator')
  public paginator: MatPaginator;

  @ViewChild('optionsgroup')
  public optionsgroup: MatButtonToggleGroup;

  showAllWeaponStats = false;

  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
  public player$: BehaviorSubject<Player> = new BehaviorSubject(null);
  public filterKeyUp$: Subject<void> = new Subject();

  @ViewChild('filter')
  filter: ElementRef;

  options: TabOption[];
  option: TabOption;

  sortBy = 'power';
  hideDupes = false;
  sortDesc = true;
  public gearToShow$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);

  pageInfo$: BehaviorSubject<PageInfo> = new BehaviorSubject<PageInfo>({
    page: 0,
    pageStart: 0,
    pageEnd: 0,
    size: 10,
    total: 0,
  });

  ItemType = ItemType;
  DamageType = DamageType;
  EnergyType = EnergyType;
  ClassAllowed = ClassAllowed;

  trackGearItem(index, item) {
    return item ? item.id : undefined;
  }

  tabChanged(): void {
    this.router.navigate(['gear', this.optionsgroup.value.path]);
  }

  showPossibleRolls(i: InventoryItem) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
      item: i
    };
    this.dialog.open(PossibleRollsDialogComponent, dc);

  }

  copyToClipboard(i: InventoryItem) {
    const markdown = this.toMarkDown(i);
    this.clipboardService.copyFromContent(markdown);
    this.notificationService.success('Copied ' + i.name + ' to clipboard');
  }

  copyAllVisibleToClipboard() {
    let markdown = '';
    let cntr = 0;
    const gearToShow = this.gearToShow$.getValue();
    if (gearToShow.length == 1) {
      markdown += this.toMarkDown(gearToShow[0]);
    } else {
      for (const i of gearToShow) {
        cntr++;
        markdown += this.toMarkDown(i, cntr);
        markdown += '\n\n';
      }
    }
    this.clipboardService.copyFromContent(markdown);
    this.notificationService.success('Copied ' + gearToShow.length + ' items to clipboard');
  }

  async moveAllVisible(target: Target, progressTracker$: Subject<void>): Promise<void> {
    await this.gearService.bulkMove(this.player$.getValue(), this.gearToShow$.getValue(), target, progressTracker$);
    await this.load(true);
  }

  private toMarkDown(i: InventoryItem, cntr?: number): string {
    let markdown = '';
    if (cntr == null) {
      markdown = '**' + i.name + '**\n\n';
    } else {
      markdown = '**' + cntr + '. ' + i.name + '**\n\n';
    }

    for (const socket of i.sockets) {
      markdown += '\n\n* ';
      for (const plug of socket.plugs) {
        markdown += plug.name;
        if (plug !== socket.plugs[socket.plugs.length - 1]) {
          markdown += ' / ';
        }
      }
    }
    markdown += '\n\n';
    if (i.masterwork != null) {
      markdown += '\n\n* *Masterwork: ' + i.masterwork.name + ' ' + i.masterwork.tier + '*';
    }
    return markdown;
  }

  constructor(storageService: StorageService,
    private signedOnUserService: SignedOnUserService,
    public gearFilterStateService: GearFilterStateService,
    public iconService: IconService,
    public markService: MarkService,
    public gearService: GearService,
    public pandaGodRollsService: PandaGodrollsService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    public preferredStatService: PreferredStatService,
    private playerStateService: PlayerStateService,
    private route: ActivatedRoute,
    public router: Router) {
    super(storageService);
    this.loading.next(true);
    this.options = [
      { name: 'Weapons', type: ItemType.Weapon, path: 'weapons' },
      { name: 'Armor', type: ItemType.Armor, path: 'armor' },
      { name: 'Ghosts', type: ItemType.Ghost, path: 'ghosts' },
      { name: 'Vehicles', type: ItemType.Vehicle, path: 'vehicles' },
      { name: 'Material', type: ItemType.ExchangeMaterial, path: 'material' }];
    this.option = this.options[0];
    this.gearFilterStateService.init(this.option);
    const savedSize = parseInt(localStorage.getItem('page-size'), 10);
    if (savedSize > 2 && savedSize < 800) {
      // set new size on pageInfo$
      this.pageInfo$.next({
        ...this.pageInfo$.getValue(),
        size: savedSize,
      });
    }
    // selected user changed
    this.signedOnUserService.signedOnUser$.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.loadMarks();
      this.load(true);
    });
    // god rolls loaded for the first time or notably changed
    this.pandaGodRollsService.loaded$.pipe(
      takeUntil(this.unsubscribe$),
      filter(x => x)
      ).subscribe(x => {
        this.load(true);
      });

    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      // only care if magic params are here
      if (params.owner || params.postmaster) {
        this.shortcutInfo$.next({
          postmaster: params.postmaster,
          owner: params.owner
        });
        // 1) we could encounter this on initial load, when the owner data isn't populated yet
        // 2) or we could encounter it post-load, when a user clicks it as a shortcut
        // for 1, this shouldn't do anything, we'll catch it on the `load` call instead
        // for 2, this is where it should update the filters
        this.gearFilterStateService.applyShortcutInfo(this.shortcutInfo$);
      }
    });
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const sTab = params.tab;
      if (sTab) {
        for (const o of this.options) {
          if (o.path == sTab) {
            this.option = o;
            this.gearFilterStateService.updateTab(o);
          }
        }
      }
    });
    this.preferredStatService.stats$.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(x => {
        if (this.player$.getValue() != null) {
          this.preferredStatService.processGear(this.player$.getValue());
          this.load();
        }
      });

    this.gearFilterStateService.filterUpdated$.pipe(
      takeUntil(this.unsubscribe$),
      tap(x => this.filtering.next(true)),
      debounceTime(10))
      .subscribe(() => {
        this.filterGear();
        this.filtering.next(false);
      });


    this.noteChanged.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(itm => {
        this.markService.updateItem(itm);
      });

    this.filterKeyUp$.pipe(takeUntil(this.unsubscribe$), debounceTime(150)).subscribe(() => {
      this.gearFilterStateService.parseWildcardFilter();
    });
  }

  public toggleDupes(hideDupes: boolean) {
    this.hideDupes = hideDupes;
    this.gearFilterStateService.filterUpdated$.next();
  }

  public async shardBlues() {
    await this.load(true);
    await this.gearService.shardBlues(this.player$.getValue(), this.gearFilterStateService.filterUpdated$);
    await this.load(true);
    await this.syncLocks();
  }

  public async syncLocks() {
    await this.load();
    await this.gearService.processGearLocks(this.player$.getValue());
  }

  public async pullFromPostmaster(player: Player, itm: InventoryItem) {
    try {
      const owner = itm.owner.getValue();
      const success = await this.gearService.transfer(player, itm, owner, { isFull: false }, this.gearFilterStateService.filterUpdated$);
      if (success) {
        this.notificationService.success('Pulled ' + itm.name + ' from postmaster to ' + owner.label);
      } else {
        this.notificationService.info('Could not pull ' + itm.name + ' from postmaster to ' + owner.label + '. Target was full.');
      }
    } catch (e) {
      this.notificationService.fail(e);
    }
  }

  public async transfer(player: Player, itm: InventoryItem, target: Target) {
    try {
      const success = await this.gearService.transfer(player, itm, target, { isFull: false }, this.gearFilterStateService.filterUpdated$);
      if (success) {
        this.notificationService.success('Transferred ' + itm.name + ' to ' + target.label);
      } else {
        this.notificationService.info('Could not transfer ' + itm.name + ' to ' + target.label + '. Target was full.');
      }
    } catch (e) {
      this.notificationService.fail(e);
    }
  }

  public async equip(player: Player, itm: InventoryItem) {
    await this.gearService.equip(player, itm);
    this.notificationService.success('Equipped ' + itm.name + ' on ' + itm.owner.getValue().label);
    this.gearFilterStateService.filterUpdated$.next();
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  markCurrentRows(marking: string) {
    for (const item of this.gearToShow$.getValue()) {
      item.mark = marking;
      this.markService.updateItem(item);
    }
    this.gearFilterStateService.filterUpdated$.next();
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) { marking = null; }
    item.mark = marking;
    this.markService.updateItem(item);
    this.gearFilterStateService.filterUpdated$.next();
  }

  showCopies(i: InventoryItem) {
    const copies = this.gearService.findCopies(i, this.player$.getValue());
    this.openGearDialog(i, copies, false);
  }

  showSimilarArmorBySlot(i: InventoryItem) {
    const copies = this.gearService.findSimilarArmor(i, this.player$.getValue());
    this.openGearDialog(i, copies, true);
  }

  showSimilarArmorBySlotAndEnergy(i: InventoryItem) {
    const copies = this.gearService.findSimilarArmor(i, this.player$.getValue(), false, true);
    this.openGearDialog(i, copies, true);
  }

  showSimilarWeaponsByFrame(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsByFrame(i, this.player$.getValue(), false, false);
    this.openGearDialog(i, copies, true);
  }

  showSimilarWeaponsByFrameAndSlot(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsByFrame(i, this.player$.getValue(), true, false);
    this.openGearDialog(i, copies, true);
  }


  showSimilarWeaponsBySlot(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsNotByFrame(i, this.player$.getValue(), true, false);
    this.openGearDialog(i, copies, true);
  }

  showSimilarWeaponsBySlotAndEnergy(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsNotByFrame(i, this.player$.getValue(), true, true);
    this.openGearDialog(i, copies, true);
  }

  showSimilarWeaponsByFrameSlotAndEnergy(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsByFrame(i, this.player$.getValue(), true, true);
    this.openGearDialog(i, copies, true);
  }

  public showPlBuckets(char: Character) {
    const platform = Const.PLATFORMS_DICT[char.membershipType];
    this.playerStateService.loadPlayer(platform, char.membershipId, false);
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      characterId: char.characterId
    };
    this.dialog.open(PlBucketDialogComponent, dc);
  }


  showCurrentPage() {
    const copies = this.gearToShow$.getValue();
    this.openGearDialog(copies[0], copies, true);
  }



  showItem(i: InventoryItem) {
    this.openGearDialog(i, [i], false);
  }

  sort(val: string) {
    if (val == this.sortBy) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortBy = val;
      this.sortDesc = true;
    }
    this.gearFilterStateService.filterUpdated$.next();
  }

  public async setLock(player: Player, itm: InventoryItem, locked: boolean) {
    await this.gearService.setLock(player, itm, locked);
  }


  filterGear() {
    if (this.player$.getValue() == null) { return; }
    console.log(`Filtering gear...`);
    let tempGear = this.player$.getValue().gear.filter(i => i.type == this.option.type);
    tempGear = this.gearFilterStateService.filterGear(tempGear);
    GearService.sortGear(this.sortBy, this.sortDesc, tempGear);
    if (this.hideDupes) {
      tempGear = GearService.filterDupes(tempGear);
    }
    const pageInfo = {...this.pageInfo$.getValue()};
    const start = pageInfo.page * pageInfo.size;
    const end = Math.min(start + pageInfo.size, tempGear.length);
    let showMe: InventoryItem[];
    if (start >= end) {
      pageInfo.page = 0;
      showMe = tempGear.slice(0, pageInfo.size);
    } else {
      showMe = tempGear.slice(start, end);
    }
    pageInfo.total = tempGear.length;
    pageInfo.pageStart = pageInfo.page * pageInfo.size + 1;
    pageInfo.pageEnd = Math.min((pageInfo.page + 1) * pageInfo.size, pageInfo.total);
    this.gearToShow$.next(showMe);
    this.pageInfo$.next(pageInfo);
  }

  public async shardMode(itemType?: ItemType) {
    await this.load(true);
    await this.gearService.shardMode(this.player$.getValue(), this.gearFilterStateService.filterUpdated$, itemType);
    this.gearFilterStateService.filterUpdated$.next();
  }

  public async clearInv(itemType?: ItemType) {
    await this.load(true);
    await this.gearService.clearInv(this.player$.getValue(), this.gearFilterStateService.filterUpdated$, itemType);
  }

  public async upgradeMode(itemType?: ItemType) {
    await this.load(true);
    await this.gearService.upgradeMode(this.player$.getValue(), this.gearFilterStateService.filterUpdated$, itemType);
    await this.load(true);
    await this.syncLocks();
  }

  public async load(quiet?: boolean) {
    this.loading.next(true);

    if (quiet != true) {
      this.notificationService.info('Loading gear...');
    }
    try {
      if (this.selectedUser == null) {
        this.player$.next(null);
      } else {
        const p = await this.gearService.loadGear(this.selectedUser);
        this.player$.next(p);
        // a few of our toggles and our automompletes are stocked by the players inventory
        // only do this once; might be buggy if a new type shows up post load but pretty unlikely
        // browser refresh would fix anyway
        if (p?.gear?.length > 0) {
          // initialize w/ player gear info, if we had a shortcut waiting to apply, do so now
          this.gearFilterStateService.initWithPlayer(p, this.shortcutInfo$);
        }
      }
      this.gearFilterStateService.filterUpdated$.next();
    }
    finally {
      this.loading.next(false);
    }
  }

  async loadMarks() {
    if (this.selectedUser) {
      const chooseDimSyncNeeded = await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
        this.selectedUser.userInfo.membershipId);
      // force choice if not selected once we're set
      if (chooseDimSyncNeeded) {
        this.showUtilities();
      }
      if (this.player$.getValue() != null) {
        this.markService.processItems(this.player$.getValue().gear);
      }
    }
  }

  public autoCompleteSelected() {
    this.gearFilterStateService.parseWildcardFilter();
  }

  public handlePage(x: PageEvent) {
    const pageInfo = {...this.pageInfo$.getValue()};
    pageInfo.page = x.pageIndex;
    if (pageInfo.size != x.pageSize) {
      localStorage.setItem('page-size', '' + x.pageSize);
      pageInfo.size = x.pageSize;
    }
    this.pageInfo$.next(pageInfo);
    this.gearFilterStateService.filterUpdated$.next();
  }

  public showSeasonBreakdown(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    // dc.height = '95vh';
    // dc.width = '95vw';
    // dc.maxWidth = '95vw';
    // dc.maxHeight = '95vh';
    dc.data = {
      parent: this
    };
    this.dialog.open(SeasonBreakdownDialogComponent, dc);
  }

  public showModWizard(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this
    };
    this.dialog.open(ModHelperDialogComponent, dc);
  }

  public showArmorPerks(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    this.dialog.open(ArmorPerksDialogComponent, dc);
  }

  public showTargetArmorStats(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    this.dialog.open(TargetArmorStatsDialogComponent, dc);
  }


  public showUtilities(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
      isController: this.pandaGodRollsService.isController,
      matchLastTwoSockets: this.pandaGodRollsService.matchLastTwoSockets

    };
    const dialogRef = this.dialog.open(GearUtilitiesDialogComponent, dc);
    dialogRef.afterClosed().subscribe(result => {
      console.dir(dc.data);
      if (dc.data.isController != this.pandaGodRollsService.isController ||
        dc.data.matchLastTwoSockets != this.pandaGodRollsService.matchLastTwoSockets) {
        this.pandaGodRollsService.saveSettingsAndRefreshWishlist(dc.data.isController, dc.data.matchLastTwoSockets);
      }
    });
  }

  public openGearDialog(source: InventoryItem, items: InventoryItem[], showNames: boolean): MatDialogRef<GearCompareDialogComponent> {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
      source,
      items: items,
      showNames: showNames
    };
    return this.dialog.open(GearCompareDialogComponent, dc);
  }



  public showWildcardHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;

    dc.data = {
    };
    this.dialog.open(GearHelpDialogComponent, dc);
  }

  public showBulkOperationHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
    };
    this.dialog.open(BulkOperationsHelpDialogComponent, dc);
  }

  private isInputTarget(event: KeyboardEvent): boolean {
    const element = event.target as HTMLElement;
    return element?.tagName?.toUpperCase() == 'INPUT';
  }

  onLeft(event: any) {
    if (this.isInputTarget(event)) {
      return;
    }
    this.paginator.previousPage();
  }

  onRight(event: any) {
    if (this.isInputTarget(event)) {
      return;
    }
    this.paginator.nextPage();
  }

  public async onR(event: KeyboardEvent) {
    if (this.isInputTarget(event)) {
      return;
    }
    this.load();
  }

  ngOnInit(): void {
    const oldSettings = localStorage.getItem(OLD_PREF_STATS_KEY);
    if (oldSettings != null) {
      this.dialog.open(TargetArmorStatsDialogComponent);
      localStorage.removeItem(OLD_PREF_STATS_KEY);
    }
  }

}

interface PageInfo {
  page: number;
  pageStart: number;
  pageEnd: number;
  size: number;
  total: number;
}
