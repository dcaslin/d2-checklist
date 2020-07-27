import { Location } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { ApiInventoryBucket, ApiItemTierType, ClassAllowed, DamageType, DestinyAmmunitionType, EnergyType, InventoryItem, ItemType, NumComparison, Player, SelectedUser, Target, Const } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { PreferredStatService } from '@app/service/preferred-stat.service';
import { ClipboardService } from 'ngx-clipboard';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { PossibleRollsDialogComponent } from '../possible-rolls-dialog/possible-rolls-dialog.component';
import { TargetArmorStatsDialogComponent } from '../target-armor-stats-dialog/target-armor-stats-dialog.component';
import { ArmorPerksDialogComponent } from './armor-perks-dialog/armor-perks-dialog.component';
import { BulkOperationsHelpDialogComponent } from './bulk-operations-help-dialog/bulk-operations-help-dialog.component';
import { GearCompareDialogComponent } from './gear-compare-dialog/gear-compare-dialog.component';
import { GearHelpDialogComponent } from './gear-help-dialog/gear-help-dialog.component';
import { Choice, GearToggleComponent } from './gear-toggle/gear-toggle.component';
import { GearUtilitiesDialogComponent } from './gear-utilities-dialog/gear-utilities-dialog.component';
import { PandaGodrollsService } from '@app/service/panda-godrolls.service';


@Component({
  selector: 'd2c-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearComponent extends ChildComponent implements OnInit, AfterViewInit {

  private static NUMBER_REGEX = /^\d+$/;

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


  readonly fixedAutoCompleteOptions: AutoCompleteOption[] = [
    {value: 'is:highest', desc: 'Highest PL for each slot'},
    {value: 'is:goodroll', desc: 'At least a good roll in each slot'},
    {value: 'is:godroll', desc: 'A god roll in EVERY slot'},
    {value: 'is:fixme', desc: 'Best perk unselected'},
    {value: 'is:light>=', desc: 'Filter by PL'},
    {value: 'is:stattotal>=', desc: 'Total of ALL stat pts'},
    {value: 'is:postmaster'},
    {value: 'is:godrollpve', desc: 'Only PVE god rolls'},
    {value: 'is:godrollpvp', desc: 'Only PVP god rolls'},
    {value: 'is:goodrollpve'},
    {value: 'is:goodrollpvp'},
    {value: 'is:masterwork', desc: 'Fully MW\'d'},
    {value: 'is:light<='},
    {value: 'is:light>'},
    {value: 'is:light<'},
    {value: 'is:light='},
    {value: 'is:copies>', desc: 'Duplicate counts'},
    {value: 'is:copies>='},
    {value: 'is:copies<'},
    {value: 'is:copies<='},
    {value: 'is:cap<=', desc: 'PL cap'},
    {value: 'is:cap>='},
    {value: 'is:cap<'},
    {value: 'is:cap>'},
    {value: 'is:stattotal<='},
    {value: 'is:stattotal>'},
    {value: 'is:stattotal<'},
    {value: 'is:stattotal='},
    {value: 'is:random', desc: 'Random'},
    {value: 'is:fixed'},
    {value: 'is:hasmod'},
    {value: 'is:locked'},
    {value: 'is:unlocked'},
    {value: 'is:extratagged', desc: 'It\'s complicated. See help button'},
    {value: 'season:none', desc: 'No season mod slot'},
    {value: 'season:arrivals', desc: 'Arrivals mode slot'},
    {value: 'season:worthy'},
    {value: 'season:undying'},
    {value: 'season:dawn'},
    {value: 'season:opulence'},
    {value: 'season:drifter'},
    {value: 'season:forge'},
    {value: 'season:outlaw'},
    {value: 'is:seasonmod', desc: 'Has a seasonal mod slot'}
  ];

  public autoCompleteOptions: AutoCompleteOption[];

  public filteredAutoCompleteOptions: BehaviorSubject<AutoCompleteOption[]> = new BehaviorSubject([]);

  weaponTypeChoices: Choice[] = [];
  // armorTypeChoices: Choice[] = [];
  armorInventoryBucketChoices: Choice[] = [];
  weaponInventoryBucketChoices: Choice[] = [];
  energyTypeChoices: Choice[] = [];
  seasonChoices: Choice[] = [];
  damageTypeChoices: Choice[] = [];

  vehicleTypeChoices: Choice[] = [];
  modTypeChoices: Choice[] = [];
  consumableTypeChoices: Choice[] = [];
  exchangeTypeChoices: Choice[] = [];
  ownerChoices: Choice[] = [];
  rarityChoices: Choice[] = [];

  @ViewChild('paginator')
  public paginator: MatPaginator;

  @ViewChild('optionsgroup')
  public optionsgroup: MatButtonToggleGroup;

  @ViewChild('markToggle')
  public markToggle: GearToggleComponent;
  @ViewChild('weaponTypeToggle')
  public weaponTypeToggle: GearToggleComponent;
  @ViewChild('ammoTypeToggle')
  public ammoTypeToggle: GearToggleComponent;
  @ViewChild('armorInventoryBucketToggle')
  public armorInventoryBucketToggle: GearToggleComponent;
  @ViewChild('weaponInventoryBucketToggle')
  public weaponInventoryBucketToggle: GearToggleComponent;
  @ViewChild('energyTypeToggle')
  public energyTypeToggle: GearToggleComponent;
  @ViewChild('seasonToggle')
  public seasonToggle: GearToggleComponent;
  @ViewChild('damageTypeToggle')
  public damageTypeToggle: GearToggleComponent;
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

  // filters: GearToggleComponent[] = [];
  filtersDirty = false;
  filterNotes: string[] = [];

  showAllWeaponStats = false;
  controller = true;

  private filterChangedSubject: Subject<void> = new Subject<void>();
  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
  public _player: BehaviorSubject<Player> = new BehaviorSubject(null);
  public filterKeyUp: Subject<void> = new Subject();
  visibleFilterText = null;

  @ViewChild('filter')
  filter: ElementRef;

  filterTags: string[] = [];
  orMode = false;
  appendMode = false;

  options = [
    { name: 'Weapons', type: ItemType.Weapon, path: 'weapons' },
    { name: 'Armor', type: ItemType.Armor, path: 'armor' },
    { name: 'Ghosts', type: ItemType.Ghost, path: 'ghosts' },
    { name: 'Vehicles', type: ItemType.Vehicle, path: 'vehicles' },
    { name: 'Material', type: ItemType.ExchangeMaterial, path: 'material' }];
  option = this.options[0];
  sortBy = 'power';
  sortDesc = true;
  gearToShow: InventoryItem[] = [];
  page = 0;
  pageStart = 0;
  pageEnd = 0;
  size = 10;
  total = 0;

  ItemType = ItemType;
  DamageType = DamageType;
  EnergyType = EnergyType;
  ClassAllowed = ClassAllowed;

  show(count: number) {
    this.size = count;
    this.filterChanged();
  }

  trackGearItem(index, item) {
    return item ? item.id : undefined;

  }

  tabChanged(): void {
    this.router.navigate(['gear', this.optionsgroup.value.path]);
  }

  filterChanged(): void {
    this.filtering.next(true);
    this.filterChangedSubject.next();
  }

  resetFilters(): void {
    if (this.filter) {
      this.filter.nativeElement.value = '';
    }
    this.visibleFilterText = null;
    this.filterTags = [];
    this.orMode = false;
    this.appendMode = false;
    const filters = this.grabFilters();
    for (const toggle of filters) {
      toggle.selectAll(true);
    }
    this.filterChanged();

  }

  showPossibleRolls(i: InventoryItem) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    // dc.autoFocus = true;
    // dc.width = '1000px';
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

  async moveAllVisible(target: Target) {
    await this.gearService.bulkMove(this._player.getValue(), this.gearToShow, target);
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
    for (const mod of i.mods) {
      markdown += '\n\n* *Mod: ' + mod.name + '*';
    }
    return markdown;
  }

  constructor(storageService: StorageService,
    private bungieService: BungieService,
    private cacheService: DestinyCacheService,
    public iconService: IconService,
    public markService: MarkService,
    public gearService: GearService,
    private pandaGodRollsService: PandaGodrollsService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialog: MatDialog,
    public preferredStatService: PreferredStatService,
    private route: ActivatedRoute,
    public router: Router,
    private location: Location,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.loading.next(true);

    this.autoCompleteOptions = this.fixedAutoCompleteOptions.slice(0);
    const savedSize = parseInt(localStorage.getItem('page-size'), 10);
    if (savedSize > 2 && savedSize < 800) {
      this.size = savedSize;
    }


    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const sTab = params.tab;
      if (sTab) {
        for (const o of this.options) {
          if (o.path == sTab) {
            this.option = o;
          }
        }
      }
      this.filterChanged();
    });
    this.preferredStatService.stats.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(x => {
        if (this._player.getValue() != null) {
          this.preferredStatService.processGear(this._player.getValue());
          this.load();
        }
      });
  }

  public async shardBlues() {
    await this.load(true);
    await this.gearService.shardBlues(this._player.getValue());
    await this.load(true);
    await this.syncLocks();
  }

  public async syncLocks() {
    await this.load();
    await this.gearService.processGearLocks(this._player.getValue());
    this.filterChanged();
  }

  public async pullFromPostmaster(player: Player, itm: InventoryItem) {
    try {
      const owner = itm.owner.getValue();
      const success = await this.gearService.transfer(player, itm, owner, {isFull: false});
      if (success) {
        this.notificationService.success('Pulled ' + itm.name + ' from postmaster to ' + owner.label);
      } else {
        this.notificationService.info('Could not pull ' + itm.name + ' from postmaster to ' + owner.label + '. Target was full.');
      }
    } catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async transfer(player: Player, itm: InventoryItem, target: Target) {
    try {
      const success = await this.gearService.transfer(player, itm, target, {isFull: false});
      if (success) {
      this.notificationService.success('Transferred ' + itm.name + ' to ' + target.label);
      } else {
        this.notificationService.info('Could not transfer ' + itm.name + ' to ' + target.label + '. Target was full.');
      }
    } catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async equip(player: Player, itm: InventoryItem) {
    await this.gearService.equip(player, itm);
    this.notificationService.success('Equipped ' + itm.name + ' on ' + itm.owner.getValue().label);
    this.filterChanged();
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  markCurrentRows(marking: string) {
    for (const item of this.gearToShow) {
      item.mark = marking;
      this.markService.updateItem(item);
    }
    this.filterChanged();
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) { marking = null; }
    item.mark = marking;
    this.markService.updateItem(item);
    this.filterChanged();
  }

  showCopies(i: InventoryItem) {
    const copies = this.gearService.findCopies(i, this._player.getValue());
    this.openGearDialog(i, copies, false);
  }

  showSimilarArmorBySeason(i: InventoryItem) {
    const copies = this.gearService.findSimilarArmor(i, this._player.getValue(), true);
    this.openGearDialog(i, copies, true);
  }

  showSimilarArmorBySeasonAndBurn(i: InventoryItem) {
    const copies = this.gearService.findSimilarArmor(i, this._player.getValue(), true, true);
    this.openGearDialog(i, copies, true);
  }

  showSimilarArmor(i: InventoryItem) {
    const copies = this.gearService.findSimilarArmor(i, this._player.getValue());
    this.openGearDialog(i, copies, true);
  }

  showSimilarWeaponsByFrame(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsByFrame(i, this._player.getValue(), false, false);
    this.openGearDialog(i, copies, true);
  }

  showSimilarWeaponsByFrameSlotAndEnergy(i: InventoryItem) {
    const copies = this.gearService.findSimilarWeaponsByFrame(i, this._player.getValue(), true, true);
    this.openGearDialog(i, copies, true);
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
    this.filterChanged();
  }

  private static _processComparison(prefix: string, tagVal: string, gearVal: number): boolean {
    if (!tagVal.startsWith(prefix)) {
      return null;
    }
    let val = tagVal.substr(prefix.length);
    let comp: NumComparison = null;
    if (val.startsWith('<=')) {
      val = val.substr(2);
      comp = NumComparison.lte;
    } else if (val.startsWith('>=')) {
      val = val.substr(2);
      comp = NumComparison.gte;
    } else if (val.startsWith('<')) {
      val = val.substr(1);
      comp = NumComparison.lt;
    } else if (val.startsWith('>')) {
      val = val.substr(1);
      comp = NumComparison.gt;
    } else if (val.startsWith('=')) {
      val = val.substr(1);
      comp = NumComparison.e;
    } else {
      return null;
    }
    if (!GearComponent.NUMBER_REGEX.test(val)) {
      return null;
    }
    const iVal = +val;
    switch (comp) {
      case NumComparison.gte: {
        return gearVal >= iVal;
      }
      case NumComparison.lte: {
        return gearVal <= iVal;
      }
      case NumComparison.gt: {
        return gearVal > iVal;
      }
      case NumComparison.lt: {
        return gearVal < iVal;
      }
      case NumComparison.e: {
        return gearVal == iVal;
      }
      default: {
        return null;
      }
    }
  }

  public async setLock(player: Player, itm: InventoryItem, locked: boolean) {
    await this.gearService.setLock(player, itm, locked);
    this.filterChanged();
  }


  private static _processFilterTag(actual: string, i: InventoryItem): boolean {
    if (actual == 'is:locked') {
      return i.locked.getValue();
    }
    if (actual == 'is:unlocked') {
      return !i.locked.getValue();
    }
    let compResult = GearComponent._processComparison('is:light', actual, i.power);
    if (compResult != null) {
      return compResult;
    }
    compResult = GearComponent._processComparison('is:copies', actual, i.copies);
    if (compResult != null) {
      return compResult;
    }
    compResult = GearComponent._processComparison('is:stattotal', actual, i.totalStatPoints);
    if (compResult != null) {
      return compResult;
    }
    compResult = GearComponent._processComparison('is:cap', actual, i.powerCap);
    if (compResult != null) {
      return compResult;
    }
    if (i.searchText.indexOf(actual) >= 0) {
      return true;
    }
    if (i.notes != null && i.notes.toLowerCase().indexOf(actual) >= 0) { return true; }
    return false;
  }

  private static processFilterTag(f: string, i: InventoryItem): boolean {
    if (f.startsWith('!')) {
      const actual = f.substr(1);
      return !this._processFilterTag(actual, i);
    } else {
      return this._processFilterTag(f, i);
    }
  }

  shouldKeepItem(i: InventoryItem): boolean {
    for (const f of this.filterTags) {
      const match = GearComponent.processFilterTag(f, i);
      if (!this.orMode && !match) {
        return false;
      } else if (this.orMode && match) {
        return true;
      }
    }
    if (this.orMode) {
      return false;
    } else {
      return true;
    }
  }

  private wildcardFilter(gear: InventoryItem[]): InventoryItem[] {
    if (this.filterTags.length > 0) {
      for (const f of this.filterTags) {
        this.filterNotes.push('wildcard = ' + f);
      }
      return gear.filter(this.shouldKeepItem, this);
    } else {
      return gear;
    }
  }

  checkFilterDirty() {
    if (this.filterTags.length > 0) { return true; }
    const filters = this.grabFilters();
    for (const toggle of filters) {
      if (!toggle.isAllSelected$.getValue()) { return true; }
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
    this.appendToggleFilterNote(this.armorInventoryBucketToggle);
    this.appendToggleFilterNote(this.weaponInventoryBucketToggle);
    this.appendToggleFilterNote(this.energyTypeToggle);
    this.appendToggleFilterNote(this.seasonToggle);
    this.appendToggleFilterNote(this.damageTypeToggle);
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
    if (!this.armorInventoryBucketToggle.isChosen(this.option.type, i.inventoryBucket.displayProperties.name)) {
      const key = 'armorInventoryBucket';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.damageTypeToggle.isChosen(this.option.type, i.damageType)) {
      const key = 'damageType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.energyTypeToggle.isChosen(this.option.type, i.energyType)) {
      const key = 'energyType';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.seasonToggle.isChosen(this.option.type, i.seasonalModSlot)) {
      const key = 'season';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.weaponInventoryBucketToggle.isChosen(this.option.type, i.inventoryBucket.displayProperties.name)) {
      const key = 'weaponInventoryBucket';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.vehicleTypeToggle.isChosen(this.option.type, i.inventoryBucket.displayProperties.name)) {
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
    if (!this.ownerToggle.isChosen(this.option.type, i.owner.getValue().id)) {
      const key = 'owner';
      if (report[key] == null) {
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false;
    }
    if (!this.equippedToggle.isChosen(this.option.type, '' + i.equipped.getValue())) {
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
    this.armorInventoryBucketToggle.setCurrentItemType(this.option.type);
    this.weaponInventoryBucketToggle.setCurrentItemType(this.option.type);
    this.energyTypeToggle.setCurrentItemType(this.option.type);
    this.seasonToggle.setCurrentItemType(this.option.type);
    this.damageTypeToggle.setCurrentItemType(this.option.type);
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
    if (this._player.getValue() == null) { return; }
    let tempGear = this._player.getValue().gear.filter(i => i.type == this.option.type);
    tempGear = this.wildcardFilter(tempGear);
    tempGear = this.toggleFilter(tempGear);
    GearService.sortGear(this.sortBy, this.sortDesc, tempGear);
    const start = this.page * this.size;
    const end = Math.min(start + this.size, tempGear.length);
    if (start >= end) {
      this.page = 0;
      this.gearToShow = tempGear.slice(0, this.size);
    } else {

      this.gearToShow = tempGear.slice(start, end);
    }
    this.total = tempGear.length;
    this.pageStart = this.page * this.size + 1;
    this.pageEnd = Math.min((this.page + 1) * this.size, this.total);
  }

  public async shardMode(itemType?: ItemType) {
    await this.load(true);
    await this.gearService.shardMode(this._player.getValue(), itemType);
    this.filterChanged();
  }

  public async clearInv(itemType?: ItemType) {
    await this.load(true);
    await this.gearService.clearInv(this._player.getValue(), itemType);
    this.filterChanged();
  }

  public async upgradeMode(itemType?: ItemType) {
    await this.load(true);
    await this.gearService.upgradeMode(this._player.getValue(), itemType);
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
        this._player.next(null);
      } else {
        const p = await this.gearService.loadGear(this.selectedUser);
        this._player.next(p);
      }
      this.generateChoices();
      this.filterChanged();
    }
    finally {
      this.loading.next(false);
    }
  }

  private static sortByIndexReverse(a: any, b: any): number {
    if (a.index < b.index) {
      return 1;
    } if (a.index > b.index) {
      return -1;
    }
    return 0;
  }

  private static sortByIndex(a: any, b: any): number {
    if (a.index < b.index) {
      return -1;
    } if (a.index > b.index) {
      return 1;
    }
    return 0;
  }

  private generateDamageTypeChoices(): Choice[] {
    const returnMe: Choice[] = [];
    returnMe.push(new Choice('' + DamageType.Kinetic, 'Kinetic'));
    returnMe.push(new Choice('' + DamageType.Arc, 'Arc'));
    returnMe.push(new Choice('' + DamageType.Thermal, 'Solar'));
    returnMe.push(new Choice('' + DamageType.Void, 'Void'));
    return returnMe;
  }

  private generateEnergyTypeChoices(): Choice[] {
    const returnMe: Choice[] = [];
    returnMe.push(new Choice('' + EnergyType.Arc, 'Arc'));
    returnMe.push(new Choice('' + EnergyType.Thermal, 'Solar'));
    returnMe.push(new Choice('' + EnergyType.Void, 'Void'));
    returnMe.push(new Choice('' + EnergyType.Any, 'Any'));
    return returnMe;
  }


  private generateSeasonChoices(): Choice[] {
    const returnMe: Choice[] = [];
    returnMe.push(new Choice(null, 'None'));
    returnMe.push(new Choice('11', 'Arrivals'));
    returnMe.push(new Choice('10', 'Worthy'));
    returnMe.push(new Choice('9', 'Dawn'));
    returnMe.push(new Choice('8', 'Undying'));
    returnMe.push(new Choice('7', 'Opulence'));
    returnMe.push(new Choice('6', 'Drifter'));
    returnMe.push(new Choice('5', 'Forge'));
    returnMe.push(new Choice('4', 'Outlaw'));
    return returnMe;
  }





  private generateRarityChoices(): Choice[] {
    const tiers = this.cacheService.cache['ItemTierType'];
    const aTiers: ApiItemTierType[] = [];
    for (const key of Object.keys(tiers)) {
      const val: ApiItemTierType = tiers[key];
      if (!val.blacklisted && !val.redacted) {
        if (val.displayProperties.name != 'Basic') {
          aTiers.push(val);
        }
      }
    }
    aTiers.sort(GearComponent.sortByIndexReverse);
    const returnMe: Choice[] = [];
    for (const tier of aTiers) {
      returnMe.push(new Choice(tier.displayProperties.name, tier.displayProperties.name));
    }
    return returnMe;
  }

  private generateBucketChoices(itemType: ItemType): Choice[] {
    const buckets = this.cacheService.cache['InventoryBucket'];
    const aBuckets: ApiInventoryBucket[] = [];
    for (const key of Object.keys(buckets)) {
      const val: ApiInventoryBucket = buckets[key];
      if (!val.blacklisted && !val.redacted && val.category == 3) {
        if (itemType === ItemType.Weapon) {
          if (val.index <= 2) {
            aBuckets.push(val);
          }
        } else if (itemType === ItemType.Armor) {

          if (val.index >= 3 && val.index <= 7) {
            aBuckets.push(val);
          }
        } else if (itemType === ItemType.Vehicle) {

          if (val.index >= 9 && val.index <= 10) {
            aBuckets.push(val);
          }
        }

      }
    }
    aBuckets.sort(GearComponent.sortByIndex);
    const returnMe: Choice[] = [];

    for (const bucket of aBuckets) {
      returnMe.push(new Choice(bucket.displayProperties.name, bucket.displayProperties.name));
    }
    return returnMe;
  }


  // TODO use inventorybucket to generate other type choices properly

  private generateChoices(force?: boolean) {
    if (this._player.getValue() == null) { return; }
    if (this._player.getValue().gear == null) { return; }
    if (this._player.getValue().gear.length == 0) { return; }
    if (this.weaponTypeChoices.length > 0 && !force) { return; }

    const tempOwners = [];
    for (const char of this._player.getValue().characters) {
      tempOwners.push(new Choice(char.id, char.label));
    }
    tempOwners.push(new Choice(this._player.getValue().vault.id, this._player.getValue().vault.label));
    tempOwners.push(new Choice(this._player.getValue().shared.id, this._player.getValue().shared.label));
    this.ownerChoices = tempOwners;

    const temp: any = {};
    // for each piece of gear, grab a set of its type names, by type
    // and grab the superset of rarity tiers

    const mwChoices: { [key: string]: boolean } = {};

    for (const i of this._player.getValue().gear) {
      if (temp[i.type + ''] == null) {
        temp[i.type + ''] = [];
        temp[i.type + 'bucket'] = [];
      }
      temp[i.type + ''][i.typeName] = true;
      temp[i.type + 'bucket'][i.inventoryBucket.displayProperties.name] = true;
      if (i.masterwork) {
        const key = 'is:mw:' + i.masterwork.name.toLowerCase();
        mwChoices[key] = true;
      }

    }
    const amwChoices: string[] = [];
    for (const mwChoice of Object.keys(mwChoices)) {
      amwChoices.push(mwChoice);
    }
    amwChoices.sort();
    const newChoices = this.fixedAutoCompleteOptions.slice(0);
    for (const c of amwChoices) {
      newChoices.push({
        value: c
      });
    }
    this.autoCompleteOptions = newChoices;

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
    this.weaponInventoryBucketChoices = this.generateBucketChoices(ItemType.Weapon);
    this.damageTypeChoices = this.generateDamageTypeChoices();
    this.energyTypeChoices = this.generateEnergyTypeChoices();
    this.seasonChoices = this.generateSeasonChoices();
    this.armorInventoryBucketChoices = this.generateBucketChoices(ItemType.Armor);
    this.vehicleTypeChoices = this.generateBucketChoices(ItemType.Vehicle);
    this.modTypeChoices = arrays[ItemType.GearMod + ''];
    this.consumableTypeChoices = arrays[ItemType.Consumable + ''];
    this.exchangeTypeChoices = arrays[ItemType.ExchangeMaterial + ''];
    this.rarityChoices = this.generateRarityChoices();
  }

  async loadMarks() {
    if (this.selectedUser) {
      await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
        this.selectedUser.userInfo.membershipId);
      if (this._player.getValue() != null) {
        this.markService.processItems(this._player.getValue().gear);
      }
    }
  }

  async loadWishlist() {
    await this.pandaGodRollsService.init(this.controller);
    if (this._player.getValue() != null) {
      this.pandaGodRollsService.processItems(this._player.getValue().gear);
    }
    this.load(true);
  }

  parseWildcardFilter() {
    const val: string = this.visibleFilterText;
    if (val == null || val.trim().length == 0) {
      localStorage.removeItem('gear-filter');
    } else {
      localStorage.setItem('gear-filter', val);
    }
    if (val == null || val.trim().length === 0) {
      this.filteredAutoCompleteOptions.next([]);
      this.filterTags = [];
      this.orMode = false;
      this.appendMode = false;
    } else {
      const rawFilter = val.toLowerCase();
      if (rawFilter.indexOf(' or ') >= 0) {
        this.filterTags = rawFilter.split(' or ');
        this.orMode = true;
      } else {
        this.orMode = false;
        this.filterTags = rawFilter.split(' and ');
      }
      this.appendMode = rawFilter.endsWith(' and ') || rawFilter.endsWith(' or ');
      const newFilteredOptions = [];
      if (rawFilter.startsWith('is:') || rawFilter.startsWith('sea') || rawFilter.startsWith('mw')) {
        for (const o of this.autoCompleteOptions) {
          if (o.value.startsWith(rawFilter)) {
            newFilteredOptions.push(o);
          }
        }
      }
      this.filteredAutoCompleteOptions.next(newFilteredOptions);
    }
    this.filterChanged();
  }

  public autoCompleteSelected(event: MatAutocompleteSelectedEvent) {
    this.parseWildcardFilter();
    // console.dir(event);
  }

  public handlePage(x: PageEvent) {
    this.page = x.pageIndex;
    if (this.size != x.pageSize) {
      localStorage.setItem('page-size', '' + x.pageSize);
      this.size = x.pageSize;
    }
    this.filterChanged();
  }

  private grabFilters(): GearToggleComponent[] {
    const filters = [];
    if (this.markToggle) { filters.push(this.markToggle); }
    if (this.weaponTypeToggle) { filters.push(this.weaponTypeToggle); }
    if (this.ammoTypeToggle) { filters.push(this.ammoTypeToggle); }
    if (this.armorInventoryBucketToggle) { filters.push(this.armorInventoryBucketToggle); }
    if (this.weaponInventoryBucketToggle) { filters.push(this.weaponInventoryBucketToggle); }
    if (this.energyTypeToggle) { filters.push(this.energyTypeToggle); }
    if (this.seasonToggle) { filters.push(this.seasonToggle); }
    if (this.damageTypeToggle) { filters.push(this.damageTypeToggle); }

    if (this.vehicleTypeToggle) { filters.push(this.vehicleTypeToggle); }
    if (this.modTypeToggle) { filters.push(this.modTypeToggle); }
    if (this.consumableTypeToggle) { filters.push(this.consumableTypeToggle); }
    if (this.exchangeTypeToggle) { filters.push(this.exchangeTypeToggle); }
    if (this.ownerToggle) { filters.push(this.ownerToggle); }
    if (this.equippedToggle) { filters.push(this.equippedToggle); }
    if (this.rarityToggle) { filters.push(this.rarityToggle); }
    if (this.classTypeToggle) { filters.push(this.classTypeToggle); }
    return filters;
  }

  ngAfterViewInit() {
    this.filterChangedSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filtersDirty = this.checkFilterDirty();
        try {
          if (this.optionsgroup) {
            this.option = this.optionsgroup.value;
            this.filterGear();
          }

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


    const gFilter = localStorage.getItem('gear-filter');
    if (gFilter != null) {
      this.visibleFilterText = gFilter;
    }
    this.parseWildcardFilter();
    this.filterKeyUp.pipe(takeUntil(this.unsubscribe$),
      debounceTime(150))
      .subscribe(() => {
        this.parseWildcardFilter();
      });
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
    };
    const previousController = this.controller;
    const dialogRef = this.dialog.open(GearUtilitiesDialogComponent, dc);

    dialogRef.afterClosed().subscribe(result => {
      if (this.controller != previousController) {
        this.updateMnkVsController(this.controller);
      }
    });
  }

  public openGearDialog(source: InventoryItem, items: InventoryItem[], showNames: boolean): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
      source,
      items: items,
      showNames: showNames
    };
    this.dialog.open(GearCompareDialogComponent, dc);
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

  ngOnInit() {
    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      const controllerPref = localStorage.getItem('mnk-vs-controller');
      if (controllerPref != null) {
        this.controller = 'true' == controllerPref;
      } else {
        // if no explicit prep, assume MnK on steam, controller otherwise
        if (this.selectedUser != null && this.selectedUser.userInfo.membershipType == Const.STEAM_PLATFORM.type) {
          this.controller = false;
        } else {
          this.controller = true;
        }
      }
      console.log(`--- Controller: ${this.controller}`);
      this.loadMarks();
      this.loadWishlist();
    });
  }

  async updateSelectedUser(selectedUser: SelectedUser) {

  }

  onLeft() {
    this.paginator.previousPage();
  }

  onRight() {
    this.paginator.nextPage();
  }

  public async updateMnkVsController(controller: boolean) {
    localStorage.setItem('mnk-vs-controller', controller ? 'true' : 'false');
    this.controller = controller;
    this.loadWishlist();
  }
}

interface AutoCompleteOption {
  value: string;
  desc?: string;
}