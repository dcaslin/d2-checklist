import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { fromEvent as observableFromEvent, Subject, BehaviorSubject } from 'rxjs';

import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Player, InventoryItem, SelectedUser, ItemType, DamageType, ClassAllowed, Target, Character, InventoryPlug, DestinyAmmunitionType } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';
import { MarkService, Marks } from '@app/service/mark.service';
import { GearService } from '@app/service/gear.service';
import { Choice, GearToggleComponent } from './gear-toggle.component';
import { WishlistService } from '@app/service/wishlist.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog, MatButtonToggleGroup, MatPaginator } from '@angular/material';
import { ClipboardService } from 'ngx-clipboard';
import { NotificationService } from '@app/service/notification.service';
import { TargetArmorPerksDialogComponent } from '../target-armor-perks-dialog/target-armor-perks-dialog.component';
import { TargetPerkService } from '@app/service/target-perk.service';

@Component({
  selector: 'anms-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearComponent extends ChildComponent implements OnInit, AfterViewInit {
  public filtering: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly markChoices: Choice[] = [
    new Choice('upgrade', 'Upgrade'),
    new Choice('keep', 'Keep'),
    new Choice('infuse', 'Infuse'),
    new Choice('junk', 'Junk'),
    new Choice(null, 'Unmarked')
  ];

  readonly ammoTypeChoices: Choice[] = [
    new Choice(DestinyAmmunitionType.Primary + '', 'Primary'),
    new Choice(DestinyAmmunitionType.Special + '', 'Special'),
    new Choice(DestinyAmmunitionType.Heavy + '', 'Heavy')
  ];


  readonly classTypeChoices: Choice[] = [
    new Choice(ClassAllowed.Titan + '', 'Titan'),
    new Choice(ClassAllowed.Warlock + '', 'Warlock'),
    new Choice(ClassAllowed.Hunter + '', 'Hunter'),
    new Choice(ClassAllowed.Any + '', 'Any'),
  ];
  readonly equippedChoices: Choice[] = [
    new Choice('true', 'Equipped'),
    new Choice('false', 'Not Equipped')
  ];

  weaponTypeChoices: Choice[] = [];
  armorTypeChoices: Choice[] = [];
  vehicleTypeChoices: Choice[] = [];
  modTypeChoices: Choice[] = [];
  consumableTypeChoices: Choice[] = [];
  exchangeTypeChoices: Choice[] = [];
  ownerChoices: Choice[] = [];
  rarityChoices: Choice[] = [];

  @ViewChild(MatPaginator)
  public paginator: MatPaginator;

  @ViewChild('optionsgroup')
  public optionsgroup: MatButtonToggleGroup;

  @ViewChild('markToggle')
  public markToggle: GearToggleComponent;
  @ViewChild('weaponTypeToggle')
  public weaponTypeToggle: GearToggleComponent;
  @ViewChild('ammoTypeToggle')
  public ammoTypeToggle: GearToggleComponent;
  @ViewChild('armorTypeToggle')
  public armorTypeToggle: GearToggleComponent;
  @ViewChild('vehicleTypeToggle')
  public vehicleTypeToggle: GearToggleComponent;
  @ViewChild('modTypeToggle')
  public modTypeToggle: GearToggleComponent;
  @ViewChild('consumableTypeToggle')
  public consumableTypeToggle: GearToggleComponent;
  @ViewChild('exchangeTypeToggle')
  public exchangeTypeToggle: GearToggleComponent;
  @ViewChild('classTypeToggle')
  public classTypeToggle: GearToggleComponent;
  @ViewChild('ownerToggle')
  public ownerToggle: GearToggleComponent;
  @ViewChild('equippedToggle')
  public equippedToggle: GearToggleComponent;
  @ViewChild('rarityToggle')
  public rarityToggle: GearToggleComponent;

  filters: GearToggleComponent[] = [];
  filtersDirty = false;
  filterNotes: string[] = [];


  private static HIGHLIGHT_ALL_PERKS_KEY = 'highlightAllPerks';
  private static WISHLIST_OVERRIDE_PVE_URL_KEY = 'wishlistOverridePveUrl';
  private static WISHLIST_OVERRIDE_PVP_URL_KEY = 'wishlistOverridePvpUrl';
  public wishlistOverridePveUrl;
  public wishlistOverridePvpUrl;


  public highlightAllPerks = true;

  private filterChangedSubject: Subject<void> = new Subject<void>();
  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
  player: Player = null;
  visibleFilterText = null;
  @ViewChild('filter') filter: ElementRef;
  filterTags: string[] = [];
  options = [
    { name: 'Weapons', type: ItemType.Weapon },
    { name: 'Armor', type: ItemType.Armor },
    { name: 'Ghosts', type: ItemType.Ghost },
    { name: 'Vehicles', type: ItemType.Vehicle },
    { name: 'Mods', type: ItemType.GearMod },
    { name: 'Consumable', type: ItemType.Consumable },
    { name: 'Material', type: ItemType.ExchangeMaterial }];
  option = this.options[0];
  sortBy = 'power';
  sortDesc = true;
  gearToShow: InventoryItem[] = [];
  page = 0;
  size = 20;
  total = 0;

  ItemType = ItemType;
  DamageType = DamageType;
  ClassAllowed = ClassAllowed;

  show(count: number) {
    this.size = count;
    this.filterChanged();
  }

  filterChanged(): void {
    this.filtering.next(true);
    this.filterChangedSubject.next();
  }

  resetFilters(): void {
    this.filter.nativeElement.value = '';
    this.visibleFilterText = null;
    this.filterTags = [];
    for (const toggle of this.filters) {
      toggle.selectAll(true);
    }
    this.filterChanged();

  }

  copyToClipboard(i: InventoryItem) {
    const markdown = this.toMarkDown(i);
    this.clipboardService.copyFromContent(markdown);
    this.notificationService.success('Copied ' + i.name + ' to clipboard');
  }

  copyAllVisibleToClipboard() {
    let markdown = '';
    let cntr = 0;
    if (this.gearToShow.length == 1) {
      markdown += this.toMarkDown(this.gearToShow[0]);
    } else {
      for (const i of this.gearToShow) {
        cntr++;
        markdown += this.toMarkDown(i, cntr);
        markdown += '\n\n';
      }
    }
    this.clipboardService.copyFromContent(markdown);
    this.notificationService.success('Copied ' + this.gearToShow.length + ' items to clipboard');
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
    if (i.mod != null) {
      markdown += '\n\n* *Mod: ' + i.mod.name + '*';
    }
    return markdown;
  }

  constructor(storageService: StorageService, private bungieService: BungieService,
    public markService: MarkService,
    public gearService: GearService,
    private wishlistSerivce: WishlistService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    private targetPerkService: TargetPerkService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
    this.loading.next(true);
    if (localStorage.getItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY) == 'false') {
      this.highlightAllPerks = false;
    }

    const wishlistOverridePveUrl = localStorage.getItem(GearComponent.WISHLIST_OVERRIDE_PVE_URL_KEY);
    if (wishlistOverridePveUrl != null) {
      this.wishlistOverridePveUrl = wishlistOverridePveUrl;
    }

    const wishlistOverridePvpUrl = localStorage.getItem(GearComponent.WISHLIST_OVERRIDE_PVP_URL_KEY);
    if (wishlistOverridePvpUrl != null) {
      this.wishlistOverridePvpUrl = wishlistOverridePvpUrl;
    }
    this.targetPerkService.perks.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(x => {
          if (this.player != null) {
            this.targetPerkService.processGear(this.player);
            this.load();
          }
      });

  }

  public updateHighlightAllPerks() {
    if (this.highlightAllPerks == false) {
      localStorage.setItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY, 'false');
    } else {
      localStorage.removeItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY);
    }
  }



  public async updateWishlistOverrideUrl(newPveVal: string, newPvpVal: string) {
    // just reload the page if this works, easier then worrying about it
    if (newPveVal == null) {
      localStorage.removeItem(GearComponent.WISHLIST_OVERRIDE_PVE_URL_KEY);
    }
    if (newPvpVal == null) {
      localStorage.removeItem(GearComponent.WISHLIST_OVERRIDE_PVP_URL_KEY);
    }
    if (newPveVal == null && newPvpVal == null) {
      location.reload();
      return;
    }
    let reloadMe = false;
    if (newPveVal != this.wishlistOverridePveUrl) {
      const tempRolls = await this.wishlistSerivce.loadSingle('testPve', newPveVal, null);
      if (tempRolls.length > 0) {
        localStorage.setItem(GearComponent.WISHLIST_OVERRIDE_PVE_URL_KEY, newPveVal);
        reloadMe = true;
      }
    }
    if (newPvpVal != this.wishlistOverridePvpUrl) {
      const tempRolls = await this.wishlistSerivce.loadSingle('testPvp', newPvpVal, null);
      if (tempRolls.length > 0) {
        localStorage.setItem(GearComponent.WISHLIST_OVERRIDE_PVP_URL_KEY, newPvpVal);
        reloadMe = true;
      }
    }
    if (reloadMe) {
      location.reload();
    }
  }

  public async syncLocks() {
    await this.load();
    await this.gearService.processGearLocks(this.player);
    this.filterChanged();
  }

  public async pullFromPostmaster(player: Player, itm: InventoryItem) {
    try {
      await this.gearService.transfer(player, itm, itm.owner);
      this.notificationService.success('Pulled ' + itm.name + ' from postmaster to ' + itm.owner.label);
    } catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async transfer(player: Player, itm: InventoryItem, target: Target) {
    try {
      await this.gearService.transfer(player, itm, target);
      this.notificationService.success('Transferred ' + itm.name + ' to ' + target.label);
    } catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async equip(player: Player, itm: InventoryItem) {
    await this.gearService.equip(player, itm);
    this.notificationService.success('Equipped ' + itm.name + ' on ' + itm.owner.label);
    this.filterChanged();
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) { marking = null; }
    item.mark = marking;
    this.markService.updateItem(item);
    this.filterChanged();
  }

  showCopies(i: InventoryItem) {
    const copies = this.gearService.findCopies(i, this.player);
    this.openGearDialog(copies);
  }

  showItem(i: InventoryItem) {
    this.openGearDialog([i]);
  }

  sort(val: string) {
    if (val == this.sortBy) {
      this.sortDesc = !this.sortDesc;
    } else {
      this.sortBy = val;
      this.sortDesc = true;
    }
    this.filterChanged();
  }

  filterItem(i: InventoryItem): boolean {
    for (const f of this.filterTags) {
      // not argument
      if (f.startsWith('!')) {
        const actual = f.substr(1);
        if (i.searchText.indexOf(actual) >= 0) { return false; }
        if (i.notes != null && i.notes.toLowerCase().indexOf(actual) >= 0) { return false; }
      } else {
        // check wildcard first
        if (i.searchText.indexOf(f) < 0) {
          // then check notes
          if (i.notes == null) { return false; }
          if (i.notes.toLowerCase().indexOf(f) < 0) { return false; }
        }
      }
      
    }
    return true;
  }

  private wildcardFilter(gear: InventoryItem[]): InventoryItem[] {
    if (this.filterTags.length > 0) {
      for (const f of this.filterTags) {
        this.filterNotes.push('wildcard = ' + f);
      }
      return gear.filter(this.filterItem, this);
    } else {
      return gear;
    }
  }

  checkFilterDirty() {
    if (this.filterTags.length > 0) { return true; }
    for (const toggle of this.filters) {
      if (!toggle.isAllSelected) { return true; }
    }
    return false;
  }

  private appendToggleFilterNote(t: GearToggleComponent) {
    if (t == null) { return; }
    const note = t.getNotes();
    if (note != null) {
      this.filterNotes.push(note);
    }
  }

  private appendToggleFilterNotes() {
    this.appendToggleFilterNote(this.markToggle);
    this.appendToggleFilterNote(this.weaponTypeToggle);
    this.appendToggleFilterNote(this.ammoTypeToggle);
    this.appendToggleFilterNote(this.armorTypeToggle);
    this.appendToggleFilterNote(this.vehicleTypeToggle);
    this.appendToggleFilterNote(this.modTypeToggle);
    this.appendToggleFilterNote(this.consumableTypeToggle);
    this.appendToggleFilterNote(this.exchangeTypeToggle);
    this.appendToggleFilterNote(this.ownerToggle);
    this.appendToggleFilterNote(this.equippedToggle);
    this.appendToggleFilterNote(this.rarityToggle);
    this.appendToggleFilterNote(this.classTypeToggle);
  }

  private toggleFilterSingle(i: InventoryItem, report: any): boolean {

    if (!this.markToggle.isChosen(this.option.type, i.mark)) {
      const key = 'mark';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.weaponTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'weaponType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.ammoTypeToggle.isChosen(this.option.type, i.ammoType)) {
      const key = 'ammoType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.armorTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'armorType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.vehicleTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'vehicleType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.modTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'modType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.consumableTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'consumableType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.exchangeTypeToggle.isChosen(this.option.type, i.typeName)) {
      const key = 'exchangeType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.ownerToggle.isChosen(this.option.type, i.owner.id)) {
      const key = 'owner';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.equippedToggle.isChosen(this.option.type, '' + i.equipped)) {
      const key = 'equipped';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.rarityToggle.isChosen(this.option.type, i.tier)) {
      const key = 'rarity';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.classTypeToggle.isChosen(this.option.type, i.classAllowed)) {
      const key = 'classType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    return true;
  }

  private toggleFilter(gear: InventoryItem[]): InventoryItem[] {
    // hit it with a hammer, owner and rarity are fine
    this.markToggle.setCurrentItemType(this.option.type);
    this.weaponTypeToggle.setCurrentItemType(this.option.type);
    this.ammoTypeToggle.setCurrentItemType(this.option.type);
    this.armorTypeToggle.setCurrentItemType(this.option.type);
    this.vehicleTypeToggle.setCurrentItemType(this.option.type);
    this.modTypeToggle.setCurrentItemType(this.option.type);
    this.consumableTypeToggle.setCurrentItemType(this.option.type);
    this.exchangeTypeToggle.setCurrentItemType(this.option.type);
    this.ownerToggle.setCurrentItemType(this.option.type);
    this.equippedToggle.setCurrentItemType(this.option.type);
    this.rarityToggle.setCurrentItemType(this.option.type);
    this.classTypeToggle.setCurrentItemType(this.option.type);


    this.appendToggleFilterNotes();
    const returnMe: InventoryItem[] = [];
    const report: any = {};
    for (const i of gear) {
      if (this.toggleFilterSingle(i, report)) {
        returnMe.push(i);
      }
    }

    return returnMe;
  }

  filterGear() {
    this.filterNotes = [];
    if (this.player == null) { return; }
    let tempGear = this.player.gear.filter(i => i.type == this.option.type);
    tempGear = this.wildcardFilter(tempGear);
    tempGear = this.toggleFilter(tempGear);
    if (this.sortBy == 'masterwork' || this.sortBy == 'mod') {
      tempGear.sort((a: any, b: any): number => {
        let aV = '';
        let bV = '';
        if (this.sortBy == 'masterwork') {
          aV = a[this.sortBy] != null ? a[this.sortBy].tier : -1;
          bV = b[this.sortBy] != null ? b[this.sortBy].tier : -1;
        } else if (this.sortBy == 'mod') {
          aV = a[this.sortBy] != null ? a[this.sortBy].name : '';
          bV = b[this.sortBy] != null ? b[this.sortBy].name : '';
        }

        if (aV < bV) {
          return this.sortDesc ? 1 : -1;
        } else if (aV > bV) {
          return this.sortDesc ? -1 : 1;
        } else {
          if (this.sortBy == 'masterwork') {
            aV = a[this.sortBy] != null ? a[this.sortBy].name : '';
            bV = b[this.sortBy] != null ? b[this.sortBy].name : '';
            if (aV < bV) {
              return this.sortDesc ? 1 : -1;
            } else if (aV > bV) {
              return this.sortDesc ? -1 : 1;
            }
          }
          return 0;
        }
      });
    } else {
      tempGear.sort((a: any, b: any): number => {
        try {
          const aV = a[this.sortBy] != null ? a[this.sortBy] : '';
          const bV = b[this.sortBy] != null ? b[this.sortBy] : '';

          if (aV < bV) {
            return this.sortDesc ? 1 : -1;
          } else if (aV > bV) {
            return this.sortDesc ? -1 : 1;
          } else {
            return 0;
          }
        } catch (e) {
          console.log('Error sorting: ' + e);
          return 0;
        }
      });
    }
    const start = this.page * this.size;
    const end = Math.min(start + this.size, tempGear.length);
    if (start >= end) {
      this.page = 0;
      this.gearToShow = tempGear.slice(0, this.size);
    } else {

      this.gearToShow = tempGear.slice(start, end);
    }
    this.total = tempGear.length;
  }

  public async shardMode(weaponsOnly?: boolean) {
    await this.load();
    await this.gearService.shardMode(this.player, weaponsOnly);
    await this.load();
    await this.syncLocks();
    this.filterChanged();
  }

  public async upgradeMode(weaponsOnly?: boolean) {
    await this.load();
    await this.gearService.upgradeMode(this.player, weaponsOnly);
    await this.load();
    await this.syncLocks();
    this.filterChanged();
  }

  public async load(initialLoad?: boolean) {
    this.loading.next(true);

    if (initialLoad != true) {
      this.notificationService.info('Loading gear...');
    }
    try {
      if (this.selectedUser == null) {
        this.player = null;
      } else {
        this.player = await this.gearService.loadGear(this.selectedUser);
      }
      this.generateChoices();
      this.filterChanged();
    }
    finally {
      this.loading.next(false);
    }
  }

  private generateChoices(force?: boolean) {
    if (this.player == null) { return; }
    if (this.player.gear == null) { return; }
    if (this.player.gear.length == 0) { return; }
    if (this.weaponTypeChoices.length > 0 && !force) { return; }

    const tempOwners = [];
    for (const char of this.player.characters) {
      tempOwners.push(new Choice(char.id, char.label));
    }
    tempOwners.push(new Choice(this.player.vault.id, this.player.vault.label));
    tempOwners.push(new Choice(this.player.shared.id, this.player.shared.label));
    this.ownerChoices = tempOwners;

    const temp: any = {};
    temp['rarity'] = {};
    for (const i of this.player.gear) {
      if (temp[i.type + ''] == null) {
        temp[i.type + ''] = [];
      }
      temp[i.type + ''][i.typeName] = true;
      temp['rarity'][i.tier] = true;

    }
    const arrays: any = {};
    for (const key of Object.keys(temp)) {
      const arr = [];
      for (const typeName of Object.keys(temp[key])) {
        arr.push(new Choice(typeName, typeName));
      }
      arr.sort(function (a, b) {
        if (a.display < b.display) {
          return -1;
        }
        if (a.display > b.display) {
          return 1;
        }
        return 0;
      });
      arrays[key] = arr;
    }
    this.weaponTypeChoices = arrays[ItemType.Weapon + ''];
    this.armorTypeChoices = arrays[ItemType.Armor + ''];
    this.vehicleTypeChoices = arrays[ItemType.Vehicle + ''];
    this.modTypeChoices = arrays[ItemType.GearMod + ''];
    this.consumableTypeChoices = arrays[ItemType.Consumable + ''];
    this.exchangeTypeChoices = arrays[ItemType.ExchangeMaterial + ''];
    this.rarityChoices = arrays['rarity'];
  }

  async loadMarks() {
    await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
      this.selectedUser.userInfo.membershipId);
    if (this.player != null) {
      this.markService.processItems(this.player.gear);
    }
  }

  async loadWishlist() {
    await this.wishlistSerivce.init(this.wishlistOverridePveUrl, this.wishlistOverridePvpUrl);
    if (this.player != null) {
      this.wishlistSerivce.processItems(this.player.gear);
    }
    this.filterChanged();
  }


  ngAfterViewInit() {
    this.filters.push(this.markToggle);
    this.filters.push(this.weaponTypeToggle);
    this.filters.push(this.ammoTypeToggle);
    this.filters.push(this.armorTypeToggle);
    this.filters.push(this.vehicleTypeToggle);
    this.filters.push(this.modTypeToggle);
    this.filters.push(this.consumableTypeToggle);
    this.filters.push(this.exchangeTypeToggle);
    this.filters.push(this.ownerToggle);
    this.filters.push(this.equippedToggle);
    this.filters.push(this.rarityToggle);
    this.filters.push(this.classTypeToggle);

    this.paginator.page.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(x => {
        this.page = x.pageIndex;
        this.size = x.pageSize;
        this.filterChanged();
      });
  }

  public showArmorPerks(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    const dialogRef = this.dialog.open(ArmorPerksDialogComponent, dc);
  }

  public showTargetArmorPerks(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    const dialogRef = this.dialog.open(TargetArmorPerksDialogComponent, dc);
  }

  public showUtilities(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    const dialogRef = this.dialog.open(GearUtilitiesDialogComponent, dc);
  }

  public openGearDialog(items: InventoryItem[]): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    // dc.autoFocus = true;
    // dc.width = '500px';
    dc.data = {
      parent: this,
      items: items
    };
    const dialogRef = this.dialog.open(GearDetailsDialogComponent, dc);
  }



  public showWildcardHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;

    dc.data = {
    };
    const dialogRef = this.dialog.open(GearHelpDialogComponent, dc);
  }

  public showBulkOperationHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
    };
    const dialogRef = this.dialog.open(BulkOperationsHelpDialogComponent, dc);
  }

  ngOnInit() {
    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.loadMarks();
      this.load(true);
    });
    this.loadWishlist();

    this.filterChangedSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filtersDirty = this.checkFilterDirty();
        try {
          this.option = this.optionsgroup.value;
          this.filterGear();
        } catch (e) {
          console.log('Error filtering: ' + e);
        }
        this.filtering.next(false);
        this.ref.markForCheck();
      });


    this.noteChanged.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(itm => {
        this.markService.updateItem(itm);
      });

    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(150),
      distinctUntilChanged())
      .subscribe(() => {
        const val: string = this.filter.nativeElement.value;
        if (val == null || val.trim().length === 0) {
          this.filterTags = [];
        } else {
          const rawFilter = val.toLowerCase();
          this.filterTags = rawFilter.split(' and ');
        }
        this.filterChanged();
      });
  }
}


@Component({
  selector: 'anms-gear-details-dialog',
  templateUrl: './gear-details-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearDetailsDialogComponent {
  ItemType = ItemType;
  hideJunk = false;
  items: InventoryItem[];
  parent: GearComponent;
  constructor(
    public dialogRef: MatDialogRef<GearDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.items = data.items;
    this.parent = data.parent;

  }
}

@Component({
  selector: 'anms-armor-perks-dialog',
  templateUrl: './armor-perks-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class ArmorPerksDialogComponent {
  parent: GearComponent;
  tempWishlistOverrideUrl: string;
  WishlistService = WishlistService;
  constructor(
    private targetPerkSerice: TargetPerkService,
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
  }

}

@Component({
  selector: 'anms-gear-utilities-dialog',
  templateUrl: './gear-utilities-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearUtilitiesDialogComponent {
  parent: GearComponent;
  tempWishlistPveOverrideUrl: string;
  tempWishlistPvpOverrideUrl: string;
  WishlistService = WishlistService;
  constructor(
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    this.tempWishlistPveOverrideUrl = this.parent.wishlistOverridePveUrl != null ? this.parent.wishlistOverridePveUrl : WishlistService.DEFAULT_PVE_URL;
    this.tempWishlistPvpOverrideUrl = this.parent.wishlistOverridePvpUrl != null ? this.parent.wishlistOverridePvpUrl : WishlistService.DEFAULT_PVP_URL;
  }
}

@Component({
  selector: 'anms-bulk-operations-help-dialog',
  templateUrl: './bulk-operations-help-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class BulkOperationsHelpDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BulkOperationsHelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }
}


@Component({
  selector: 'anms-gear-help-dialog',
  templateUrl: './gear-help-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearHelpDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<GearHelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

}
