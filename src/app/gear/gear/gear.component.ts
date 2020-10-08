import { Location } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
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
import { Choice, GearToggleComponent, ToggleConfig, ToggleState } from './gear-toggle/gear-toggle.component';
import { GearUtilitiesDialogComponent } from './gear-utilities-dialog/gear-utilities-dialog.component';
import { PandaGodrollsService } from '@app/service/panda-godrolls.service';
import { SeasonBreakdownDialogComponent } from './season-breakdown-dialog/season-breakdown-dialog.component';

@Component({
  selector: 'd2c-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearComponent extends ChildComponent {

  private static NUMBER_REGEX = /^\d+$/;

  // show thinking while gear filtering is occurring
  public filtering: BehaviorSubject<boolean> = new BehaviorSubject(false);

  // our state for all our gear toggles
  public toggleData: ToggleData;
  private shortcutInfo: ShortcutInfo = null;

  readonly fixedAutoCompleteOptions: AutoCompleteOption[] = [
    { value: 'is:highest', desc: 'Highest PL for each slot' },
    { value: 'is:goodroll', desc: 'At least a good roll in each slot' },
    { value: 'is:godroll', desc: 'A god roll in EVERY slot' },
    { value: 'is:fixme', desc: 'Best perk unselected' },
    { value: 'is:light>=', desc: 'Filter by PL' },
    { value: 'is:stattotal>=', desc: 'Total of ALL stat pts' },
    { value: 'is:postmaster' },
    { value: 'is:godrollpve', desc: 'Only PVE god rolls' },
    { value: 'is:godrollpvp', desc: 'Only PVP god rolls' },
    { value: 'is:goodrollpve' },
    { value: 'is:goodrollpvp' },
    { value: 'is:masterwork', desc: 'Fully MW\'d' },
    { value: 'is:light<=' },
    { value: 'is:light>' },
    { value: 'is:light<' },
    { value: 'is:light=' },
    { value: 'is:copies>', desc: 'Duplicate counts' },
    { value: 'is:copies>=' },
    { value: 'is:copies<' },
    { value: 'is:copies<=' },
    { value: 'is:cap<=', desc: 'PL cap' },
    { value: 'is:cap>=' },
    { value: 'is:cap<' },
    { value: 'is:cap>' },
    { value: 'is:stattotal<=' },
    { value: 'is:stattotal>' },
    { value: 'is:stattotal<' },
    { value: 'is:stattotal=' },
    { value: 'is:random', desc: 'Random' },
    { value: 'is:fixed' },
    { value: 'is:hasmod' },
    { value: 'is:locked' },
    { value: 'is:unlocked' },
    { value: 'is:extratagged', desc: 'It\'s complicated. See help button' },
    { value: 'has:arrivals', desc: 'Armor can load mods from Arrivals' },
    { value: 'has:worthy' },
    { value: 'has:dawn' },
    { value: 'has:undying' },
    { value: 'has:opulence' },
    { value: 'has:drifter' },
    { value: 'has:forge' },
    { value: 'has:outlaw' },
    { value: 'season:none', desc: 'No season mod slot' },
    { value: 'season:arrivals', desc: 'Arrivals mod slot' },
    { value: 'season:worthy' },
    { value: 'season:dawn' },
    { value: 'season:undying' },
    { value: 'season:opulence' },
    { value: 'season:drifter' },
    { value: 'season:forge' },
    { value: 'season:outlaw' },
    { value: 'is:seasonmod', desc: 'Has a seasonal mod slot' }
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
  exchangeTypeChoices: Choice[] = [];
  ownerChoices: Choice[] = [];
  rarityChoices: Choice[] = [];

  @ViewChild('paginator')
  public paginator: MatPaginator;

  @ViewChild('optionsgroup')
  public optionsgroup: MatButtonToggleGroup;

  // filters: GearToggleComponent[] = [];
  filtersDirty = false;
  debugFilterNotes: string[] = [];

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

  options: TabOption[];
  option: TabOption;

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


  private static initToggles(iconService: IconService, currentTab: TabOption, cacheService: DestinyCacheService): ToggleData {
    const tagConfig: ToggleConfig = {
      title: 'Tags',
      debugKey: 'Tags',
      icon: iconService.fasTags,
      displayTabs: [ItemType.Weapon, ItemType.Armor, ItemType.Ghost, ItemType.Vehicle],
      grabValue: (x: InventoryItem) => x.mark
    };
    const weaponBucketsConfig: ToggleConfig = {
      title: 'Slot',
      debugKey: 'Weapon Bucket',
      icon: iconService.fasHelmetBattle,
      displayTabs: [ItemType.Weapon],
      grabValue: (x: InventoryItem) => x.inventoryBucket.displayProperties.name
    };
    const ammoTypesConfig: ToggleConfig = {
      title: 'Ammo',
      debugKey: 'Ammo Type',
      iconClass: 'icon-ammo_heavy_mono',
      displayTabs: [ItemType.Weapon],
      grabValue: (x: InventoryItem) => x.ammoType
    };
    const weaponTypesConfig: ToggleConfig = {
      title: 'Type',
      debugKey: 'Weapon Type',
      icon: iconService.fasSwords,
      displayTabs: [ItemType.Weapon],
      grabValue: (x: InventoryItem) => x.typeName
    };
    const armorBucketsConfig: ToggleConfig = {
      title: 'Slot',
      debugKey: 'Armor Bucket',
      icon: iconService.fasHelmetBattle,
      displayTabs: [ItemType.Armor],
      grabValue: (x: InventoryItem) => x.inventoryBucket.displayProperties.name
    };
    const energyConfig: ToggleConfig = {
      title: 'Energy',
      debugKey: 'Armor Energy Type',
      icon: iconService.fasBolt,
      displayTabs: [ItemType.Armor],
      grabValue: (x: InventoryItem) => x.energyType
    };
    const seasonConfig: ToggleConfig = {
      title: 'Season',
      debugKey: 'Seasonal mod slot',
      icon: iconService.fasWheat,
      displayTabs: [ItemType.Armor],
      grabValue: (x: InventoryItem) => x.seasonalModSlot
    };
    const damageConfig: ToggleConfig = {
      title: 'Energy',
      debugKey: 'Weapon Damage Type (energy)',
      icon: iconService.fasBolt,
      displayTabs: [ItemType.Weapon],
      grabValue: (x: InventoryItem) => x.damageType
    };
    const vehicleBucketsConfig: ToggleConfig = {
      title: 'Slot',
      debugKey: 'Vehicle Bucket',
      icon: iconService.fasHelmetBattle,
      displayTabs: [ItemType.Vehicle],
      grabValue: (x: InventoryItem) => x.inventoryBucket.displayProperties.name
    };
    const exchangeTypesConfig: ToggleConfig = {
      title: 'Type',
      debugKey: 'Exchange/Material type',
      icon: iconService.fasGem,
      displayTabs: [ItemType.ExchangeMaterial],
      grabValue: (x: InventoryItem) => x.typeName
    };
    const ownerConfig: ToggleConfig = {
      title: 'Owner',
      debugKey: 'Owner',
      icon: iconService.fasUsers,
      displayTabs: null,
      grabValue: (x: InventoryItem) => x.owner.getValue().id
    };
    const raritiesConfig: ToggleConfig = {
      title: 'Rarity',
      debugKey: 'Rarity/Tier',
      icon: iconService.fasBalanceScale,
      displayTabs: null,
      grabValue: (x: InventoryItem) => x.tier
    };
    const classTypeConfig: ToggleConfig = {
      title: 'Class',
      debugKey: 'Class Type',
      icon: iconService.fasBalanceScale,
      displayTabs: [ItemType.Armor],
      grabValue: (x: InventoryItem) => x.classAllowed
    };
    const equippedConfig: ToggleConfig = {
      title: 'Equipped',
      debugKey: 'Equipped',
      icon: iconService.fasTShirt,
      displayTabs: null,
      grabValue: (x: InventoryItem) => x.equipped.getValue()
    };
    const postmasterConfig: ToggleConfig = {
      title: 'Postmaster',
      debugKey: 'Postmaster',
      icon: iconService.fasEnvelope,
      displayTabs: null,
      grabValue: (x: InventoryItem) => x.postmaster
    };

    return {
      tags: GearToggleComponent.generateState(tagConfig, [
        new Choice('upgrade', 'Upgrade'),
        new Choice('keep', 'Keep'),
        new Choice('infuse', 'Infuse'),
        new Choice('junk', 'Junk'),
        new Choice(null, 'Unmarked')
      ], currentTab.type),
      energyType: GearToggleComponent.generateState(energyConfig, [
        new Choice(`${EnergyType.Arc}`, 'Arc'),
        new Choice(`${EnergyType.Thermal}`, 'Solar'),
        new Choice(`${EnergyType.Void}`, 'Void'),
        new Choice(`${EnergyType.Any}`, 'Any')
      ], currentTab.type),
      seasons: GearToggleComponent.generateState(seasonConfig, [
        new Choice(null, 'None'),
        new Choice('11', 'Arrivals'),
        new Choice('10', 'Worthy'),
        new Choice('9', 'Dawn'),
        new Choice('8', 'Undying'),
        new Choice('7', 'Opulence'),
        new Choice('6', 'Drifter'),
        new Choice('5', 'Forge'),
        new Choice('4', 'Outlaw'),
      ], currentTab.type),
      damageType: GearToggleComponent.generateState(damageConfig,
        [
          new Choice(`${DamageType.Kinetic}`, 'Kinetic'),
          new Choice(`${DamageType.Arc}`, 'Arc'),
          new Choice(`${DamageType.Thermal}`, 'Solar'),
          new Choice(`${DamageType.Void}`, 'Void')
        ], currentTab.type),
      ammoTypes: GearToggleComponent.generateState(ammoTypesConfig, [
        new Choice(DestinyAmmunitionType.Primary + '', 'Primary'),
        new Choice(DestinyAmmunitionType.Special + '', 'Special'),
        new Choice(DestinyAmmunitionType.Heavy + '', 'Heavy')
      ], currentTab.type),
      classType: GearToggleComponent.generateState(classTypeConfig, [
        new Choice(ClassAllowed.Titan + '', 'Titan'),
        new Choice(ClassAllowed.Warlock + '', 'Warlock'),
        new Choice(ClassAllowed.Hunter + '', 'Hunter'),
        new Choice(ClassAllowed.Any + '', 'Any'),
      ], currentTab.type),
      equipped: GearToggleComponent.generateState(equippedConfig, [
        new Choice(true, 'Equipped'),
        new Choice(false, 'Not Equipped')
      ], currentTab.type),
      postmaster: GearToggleComponent.generateState(postmasterConfig, [
        new Choice(true, 'Postmaster'),
        new Choice(false, 'Not postmaster')
      ], currentTab.type),
      weaponBuckets: GearToggleComponent.generateState(weaponBucketsConfig,
        GearComponent.generateBucketChoices(ItemType.Weapon, cacheService), currentTab.type),
      armorBuckets: GearToggleComponent.generateState(armorBucketsConfig,
        GearComponent.generateBucketChoices(ItemType.Armor, cacheService), currentTab.type),
      vehicleBuckets: GearToggleComponent.generateState(vehicleBucketsConfig,
        GearComponent.generateBucketChoices(ItemType.Vehicle, cacheService), currentTab.type),
      rarities: GearToggleComponent.generateState(raritiesConfig,
        GearComponent.generateRarityChoices(cacheService), currentTab.type),
      weaponTypes: GearToggleComponent.generateState(weaponTypesConfig, [], currentTab.type),
      exchangeType: GearToggleComponent.generateState(exchangeTypesConfig, [], currentTab.type),

      owners: GearToggleComponent.generateState(ownerConfig, [], currentTab.type)
    };
  }


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

  resetFilters(noEmit?: boolean): void {
    if (this.filter) {
      this.filter.nativeElement.value = '';
    }
    this.visibleFilterText = null;
    this.filterTags = [];
    this.orMode = false;
    this.appendMode = false;

    for (const key of Object.keys(this.toggleData)) {
      const data = this.toggleData[key];
      GearToggleComponent.selectAllState(data);
      this.toggleData[key] = GearToggleComponent.cloneState(data);
    }
    if (!noEmit) {
      this.filterChanged();
    }
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
    this.options = [
      { name: 'Weapons', type: ItemType.Weapon, path: 'weapons' },
      { name: 'Armor', type: ItemType.Armor, path: 'armor' },
      { name: 'Ghosts', type: ItemType.Ghost, path: 'ghosts' },
      { name: 'Vehicles', type: ItemType.Vehicle, path: 'vehicles' },
      { name: 'Material', type: ItemType.ExchangeMaterial, path: 'material' }];
    this.option = this.options[0];

    this.autoCompleteOptions = this.fixedAutoCompleteOptions.slice(0);
    this.toggleData = GearComponent.initToggles(this.iconService, this.option, this.cacheService);
    const savedSize = parseInt(localStorage.getItem('page-size'), 10);
    if (savedSize > 2 && savedSize < 800) {
      this.size = savedSize;
    }
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

    this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      // only care if magic params are here
      if (params.owner || params.postmaster) {
        this.shortcutInfo = {
          postmaster: params.postmaster,
          owner: params.owner
        };
        // 1) we could encounter this on initial load, when the owner data isn't populated yet
        // 2) or we could encounter it post-load, when a user clicks it as a shortcut
        // for 1, this shouldn't do anything, we'll catch it on the `load` call instead
        // for 2, this is where it should update the filters
        this.applyShortcutInfo();
      }
    });
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const sTab = params.tab;
      if (sTab) {
        for (const o of this.options) {
          if (o.path == sTab) {
            this.option = o;
            console.log('Updating toggles from new tab');
            // update toggles view of current state
            for (const key of Object.keys(this.toggleData)) {
              const data: ToggleState = this.toggleData[key];
              data.visibleItemType = this.option.type;
              this.toggleData[key] = GearToggleComponent.cloneState(data);
            }
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
    this.filterChangedSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(10))
      .subscribe(() => {
        this.filtersDirty = this.checkFilterDirty();
        this.filterGear();
        this.filtering.next(false);
        // TODO is this needed?
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
      this.parseWildcardFilter();
    }

    this.filterKeyUp.pipe(takeUntil(this.unsubscribe$), debounceTime(150)).subscribe(() => {
      this.parseWildcardFilter();
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
      const success = await this.gearService.transfer(player, itm, owner, { isFull: false });
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
      const success = await this.gearService.transfer(player, itm, target, { isFull: false });
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

  private wildcardFilter(gear: InventoryItem[], debugFilterNotes: string[]): InventoryItem[] {
    if (this.filterTags.length > 0) {
      if (this.debugmode.getValue()) {
        for (const f of this.filterTags) {
          debugFilterNotes.push('wildcard = ' + f);
        }
      }
      return gear.filter(this.shouldKeepItem, this);
    } else {
      return gear;
    }
  }

  checkFilterDirty() {
    // we have wildcard entries
    if (this.filterTags.length > 0) {
      return true;
    }

    // check if toggles are filtering anything
    for (const key of Object.keys(this.toggleData)) {
      if (!this.toggleData[key].allSelected) {
        return true;
      }
    }
    return false;
  }

  private toggleFilterSingle(i: InventoryItem, report: any): boolean {

    for (const key of Object.keys(this.toggleData)) {
      const t: ToggleState = this.toggleData[key];
      // toggle is hidden or not filtering anything
      if (t.hidden || t.allSelected) {
        continue;
      }
      // toggle is empty for some reason
      if (t.choices == null || t.choices.length == 0) {
        continue;
      }
      // only now do we actually have to grab the value from our gear
      const val = t.config.grabValue(i);
      // iterate through choices and see if one matches
      let matched = false;
      for (const c of t.choices) {
        if (c.value && c.matchValue == val) {
          matched = true;
          continue;
        }
      }
      if (matched) {
        continue;
      }
      // nothing matched, this item is filtered out, log it
      if (this.debugmode.getValue()) {
        if (report[t.config.title] == null) {
          report[t.config.title] = 0;
        }
        report[t.config.title]++;
      }
      return false;
    }
    return true;
  }


  private toggleFilter(gear: InventoryItem[], debugFilterNotes: string[]): InventoryItem[] {

    // add debug notes if debugging
    if (this.debugmode.getValue()) {
      for (const key of Object.keys(this.toggleData)) {
        const data = this.toggleData[key];
        const note = GearToggleComponent.getNote(data);
        if (note) {
          debugFilterNotes.push(note);
        }
      }
    }
    const returnMe: InventoryItem[] = [];
    const report: any = {};
    for (const i of gear) {
      if (this.toggleFilterSingle(i, report)) {
        returnMe.push(i);
      }
    }
    if (this.debugmode.getValue()) {
      console.dir(report);
    }

    return returnMe;
  }



  filterGear() {
    if (this._player.getValue() == null) { return; }
    let tempGear = this._player.getValue().gear.filter(i => i.type == this.option.type);
    console.log(`Filtering gear - ${tempGear.length}`);
    const debugFilterNotes = [];
    tempGear = this.wildcardFilter(tempGear, debugFilterNotes);
    tempGear = this.toggleFilter(tempGear, debugFilterNotes);
    this.debugFilterNotes = debugFilterNotes;
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
        // a few of our toggles and our automompletes are stocked by the players inventory
        // only do this once; might be buggy if a new type shows up post load but pretty unlikely
        // browser refresh would fix anyway
        if (p?.gear?.length > 0) {
          // if we already stocked our weapon types, this has been done
          if (!this.isToggleDataInit()) {
            GearComponent.generateDynamicChoices(p, this.toggleData);
            this.autoCompleteOptions = GearComponent.generateDynamicAutocompleteOptions(this.fixedAutoCompleteOptions, this._player.getValue().gear);
            this.applyShortcutInfo();
          }
        }
      }
      this.filterChanged();
    }
    finally {
      this.loading.next(false);
    }
  }

  private isToggleDataInit() {
    return (this.toggleData.weaponTypes.choices.length > 0);
  }

  private applyShortcutInfo() {
    if (!this.shortcutInfo) {
      return;
    }
    if (!this.isToggleDataInit()) {
      return;
    }
    this.resetFilters(true);
    if  (this.shortcutInfo.owner) {
      GearToggleComponent.selectExclusiveVal(this.toggleData.owners, this.shortcutInfo.owner);
      this.toggleData.owners = GearToggleComponent.cloneState(this.toggleData.owners);
    }
    if (this.shortcutInfo.postmaster) {
      GearToggleComponent.selectExclusiveVal(this.toggleData.postmaster, true);
      this.toggleData.postmaster = GearToggleComponent.cloneState(this.toggleData.postmaster);
    }
    this.shortcutInfo = null;
    this.filterChanged();
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

  private static generateRarityChoices(cacheService: DestinyCacheService): Choice[] {
    const tiers = cacheService.cache['ItemTierType'];
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

  private static generateBucketChoices(itemType: ItemType, cacheService: DestinyCacheService): Choice[] {
    const buckets = cacheService.cache['InventoryBucket'];
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

  private static generateDynamicAutocompleteOptions(baseOptions: AutoCompleteOption[], gear: InventoryItem[]) {
    // for each piece of gear, grab a set of its type names, by type
    // and grab the superset of rarity tiers
    const mwChoices: { [key: string]: boolean } = {};
    for (const i of gear) {
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
    const newChoices = baseOptions.slice(0);
    for (const c of amwChoices) {
      newChoices.push({
        value: c
      });
    }
    return newChoices;
  }


  private static generateDynamicChoices(player: Player, toggleData: ToggleData) {
    const tempOwners: Choice[] = [];
    for (const char of player.characters) {
      tempOwners.push(new Choice(char.id, char.label));
    }
    tempOwners.push(new Choice(player.vault.id, player.vault.label));
    tempOwners.push(new Choice(player.shared.id, player.shared.label));
    toggleData.owners.choices = tempOwners;
    toggleData.owners = GearToggleComponent.cloneState(toggleData.owners);

    // enumerate the actual types of gear, since we'll want that for guns and exchange
    // actually sift through the gear to find only the ones we need
    const temp: any = {};
    for (const i of player.gear) {
      if (temp[i.type + ''] == null) {
        temp[i.type + ''] = [];
      }
      temp[i.type + ''][i.typeName] = true;
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
    toggleData.exchangeType.choices = arrays[ItemType.ExchangeMaterial + ''];
    toggleData.exchangeType = GearToggleComponent.cloneState(toggleData.exchangeType);
    toggleData.weaponTypes.choices = arrays[ItemType.Weapon + ''];
    toggleData.weaponTypes = GearToggleComponent.cloneState(toggleData.weaponTypes);
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
      if (rawFilter.startsWith('is:') || rawFilter.startsWith('sea') || rawFilter.startsWith('mw') || rawFilter.startsWith('has')) {
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
  }

  public handlePage(x: PageEvent) {
    this.page = x.pageIndex;
    if (this.size != x.pageSize) {
      localStorage.setItem('page-size', '' + x.pageSize);
      this.size = x.pageSize;
    }
    this.filterChanged();
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

interface ShortcutInfo {
  postmaster: boolean | null;
  owner: string | null;
}

interface ToggleData {
  tags: ToggleState;
  weaponBuckets: ToggleState;
  weaponTypes: ToggleState;
  ammoTypes: ToggleState;
  armorBuckets: ToggleState;
  energyType: ToggleState;
  seasons: ToggleState;
  damageType: ToggleState;
  vehicleBuckets: ToggleState;
  exchangeType: ToggleState;
  owners: ToggleState;
  rarities: ToggleState;
  equipped: ToggleState;
  classType: ToggleState;
  postmaster: ToggleState;
}

interface TabOption {
  name: string;
  type: ItemType;
  path: string;
}
