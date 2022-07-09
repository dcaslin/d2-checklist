import { Injectable, OnDestroy } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { ApiInventoryBucket, ApiItemTierType, ClassAllowed, DamageType, DestinyAmmunitionType, EnergyType, InventoryItem, InventoryStat, ItemType, NumComparison, Player } from '@app/service/model';
import { IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { Action } from 'rxjs/internal/scheduler/Action';
import { debounceTime, takeUntil } from 'rxjs/operators';


export function generateState(config: ToggleConfig, choices: Choice[], visibleItemType: ItemType): ToggleState {
  const hidden = true === (config.displayTabs?.indexOf(visibleItemType) < 0);
  const allSelected = choices && choices.every(x => x.value);
  return {
    config,
    visibleItemType,
    hidden,
    allSelected,
    choices
  };
}

function sortByIndexReverse(a: any, b: any): number {
  if (a.index < b.index) {
    return 1;
  } if (a.index > b.index) {
    return -1;
  }
  return 0;
}

function sortByIndex(a: any, b: any): number {
  if (a.index < b.index) {
    return -1;
  } if (a.index > b.index) {
    return 1;
  }
  return 0;
}

const NUMBER_REGEX = /^\d+$/;


const OPERATORS = [
  '>=',
  '>',
  '<=',
  '<',
  '='
];

// tagVal might be stat:handling>=42
function _processStats(tagVal: string, stats: InventoryStat[], statChoiceMap: Map<string, number>): boolean {
  // get the part after > or < or = sign
  const statName = null;
  let prefix = null;
  for (const op of OPERATORS) {
    const index = tagVal.indexOf(op);
    if (index > 0) {
      prefix = tagVal.substring(0, index);
      break;
    }
  }
  if (!prefix) {
    return null;
  }
  // prefix would be stat:handling
  // tagVal would be stat:handling>=42
  const shortName = prefix.substring(`stat:`.length);
  const statKey = statChoiceMap.get(shortName);
  if (!statKey) {
    return null;
  }
  const stat = stats.find(x => x.hash == statKey);
  if (stat == null) {
    return null;
  }
  return _processComparison(prefix, tagVal, stat.value);
}

function _processComparison(prefix: string, tagVal: string, gearVal: number): boolean {
  if (!tagVal.startsWith(prefix)) {
    return null;
  }
  let val = tagVal.substring(prefix.length);
  let comp: NumComparison = null;
  if (val.startsWith('<=')) {
    val = val.substring(2);
    comp = NumComparison.lte;
  } else if (val.startsWith('>=')) {
    val = val.substring(2);
    comp = NumComparison.gte;
  } else if (val.startsWith('<')) {
    val = val.substring(1);
    comp = NumComparison.lt;
  } else if (val.startsWith('>')) {
    val = val.substring(1);
    comp = NumComparison.gt;
  } else if (val.startsWith('=')) {
    val = val.substring(1);
    comp = NumComparison.e;
  } else {
    return null;
  }
  if (!NUMBER_REGEX.test(val)) {
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

function _processFilterTag(actual: string, i: InventoryItem, statChoiceMap: Map<string, number>): boolean {
  actual = actual.trim();
  if (actual == 'is:locked') {
    return i.locked.getValue();
  }
  if (actual == 'is:unlocked') {
    return !i.locked.getValue();
  }
  let compResult = _processComparison('is:light', actual, i.power);
  if (compResult != null) {
    return compResult;
  }
  compResult = _processComparison('is:copies', actual, i.copies);
  if (compResult != null) {
    return compResult;
  }
  compResult = _processComparison('is:similar', actual, i.dupesTaggedToKeep);
  if (compResult != null) {
    return compResult;
  }
  compResult = _processComparison('is:prefpoints', actual, i.preferredStatPoints);
  if (compResult != null) {
    return compResult;
  }
  compResult = _processComparison('is:stattotal', actual, i.totalStatPoints);
  if (compResult != null) {
    return compResult;
  }
  compResult = _processComparison('is:energy', actual, i.energyCapacity);
  if (compResult != null) {
    return compResult;
  }
  compResult = _processComparison('is:cap', actual, i.powerCap);
  if (compResult != null) {
    return compResult;
  }
  if (actual.startsWith('stat:')) {
    compResult = _processStats(actual, i.stats, statChoiceMap);
    if (compResult != null) {
      return compResult;
    }
  }
  if (actual.startsWith(`id:'`) && actual.endsWith(`'`)) {
    const id = actual.substring(`id:'`.length, actual.length - 1);
    return i.id == id;
  }
  if (i.searchText.indexOf(actual) >= 0) {
    return true;
  }
  if (i.notes != null && i.notes.toLowerCase().indexOf(actual) >= 0) { return true; }
  return false;
}

function processFilterTag(f: string, i: InventoryItem, statChoiceMap: Map<string, number>): boolean {
  if (f.startsWith('!')) {
    const actual = f.substring(1);
    return !_processFilterTag(actual, i, statChoiceMap);
  } else {
    return _processFilterTag(f, i, statChoiceMap);
  }
}

const FIXED_AUTO_COMPLETE_OPTIONS: AutoCompleteOption[] = [
  { value: 'is:highest', desc: 'Highest PL for each slot' },
  { value: 'is:goodroll', desc: 'At least a good roll in each slot' },
  { value: 'is:godroll', desc: 'A god roll in EVERY slot' },
  { value: 'is:fixme', desc: 'Best perk unselected' },
  { value: 'is:light>=', desc: 'Filter by PL' },
  { value: 'is:energy>=', desc: 'Filter by energy pts 1-10' },
  { value: 'is:prefpoints>=', desc: 'Total of ALL stat pts' },
  { value: 'is:stattotal>=', desc: 'Total of ALL stat pts' },
  { value: 'is:postmaster' },
  { value: 'is:godrollpve', desc: 'Only PVE god rolls' },
  { value: 'is:godrollpvp', desc: 'Only PVP god rolls' },
  { value: 'is:goodrollpve' },
  { value: 'is:goodrollpvp' },
  { value: 'is:notgoodroll'},
  { value: 'is:notinteresting', desc: 'Not good/god/deepsight/crafted'},
  { value: 'is:crafted', desc: 'Crafted for Witch Queen' },
  { value: 'is:notcrafted', desc: 'A non-craftabled drop of a weapon you can shape' },
  { value: 'is:deepsight', desc: 'Witch Queen Deepsight Weapon' },
  { value: 'is:masterwork', desc: 'Fully MW\'d' },
  { value: 'is:light<=' },
  { value: 'is:light>' },
  { value: 'is:light<' },
  { value: 'is:light=' },
  { value: 'is:copies>', desc: 'Duplicate counts' },
  { value: 'is:copies>=' },
  { value: 'is:copies<' },
  { value: 'is:copies<=' },
  
  { value: 'is:similar>', desc: 'Multiple similar items tagged to keep (by slot, frame, energy)' },
  { value: 'is:similar>=' },
  { value: 'is:similar<' },
  { value: 'is:similar<=' },
  { value: 'is:cap<=', desc: 'PL cap' },
  { value: 'is:cap>=' },
  { value: 'is:cap<' },
  { value: 'is:cap>' },
  { value: 'is:prefpoints<=' },
  { value: 'is:prefpoints>' },
  { value: 'is:prefpoints<' },
  { value: 'is:prefpoints=' },
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
  { value: 'has:notes', desc: 'Item has a note on it' },
  { value: 'has:modvod', desc: 'Armor includes Vow of the Disciple mod slot' },
  { value: 'has:moddeepstone', desc: 'Armor includes Deepstone Crypt mod slot' },
  { value: 'has:modvog', desc: 'Armor includes Vault of Glass mod slot' },
  { value: 'has:modgos', desc: 'Armor includes Garden of Salvation Crypt mod slot' },
  { value: 'has:modlw', desc: 'Armor includes Last Wish raid mod slot' },
  { value: 'has:modartifice', desc: 'Armor includes Artifice mod slot' },
  { value: 'has:modcombat', desc: 'Armor can use standard Beyond Light mods' },
  { value: 'has:modspecial', desc: 'Armor has an extra Raid/Artifice/etc slot' }
];

const GEAR_FILTER_KEY = 'D2C-GEAR-FILTER';

@Injectable({
  providedIn: 'root'
})
export class GearFilterStateService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();
  public toggleData: ToggleData;
  public toggleDataArray: BehaviorSubject<ToggleState>[];
  public autoCompleteOptions: AutoCompleteOption[];
  public filteredAutoCompleteOptions$: BehaviorSubject<AutoCompleteOption[]> = new BehaviorSubject([]);
  private filterTags$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public sortBy$: BehaviorSubject<string> = new BehaviorSubject('power');
  public hideDupes$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public sortDesc$: BehaviorSubject<boolean> = new BehaviorSubject(true);

  public filtersDirty$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public filterUpdated$: Subject<void> = new Subject<void>();
  public visibleFilterText = null;
  private orMode = false;

  private weaponStatChoices: AutoCompleteOption[] = [];
  private armorStatChoices: AutoCompleteOption[] = [];
  private statChoiceMap = new Map<string, number>();


  constructor(
    private destinyCacheService: DestinyCacheService,
    private iconService: IconService,
    private markService: MarkService,
  ) {


    const statKeys = destinyCacheService.cacheLite.Stat;
    let stats: any[] = [];
    for (const key of Object.keys(statKeys)) {
      const stat = statKeys[key];
      stats.push(stat);
    }
    stats = stats.filter(stat => stat.displayProperties?.name?.trim().length > 0);
    stats = stats.filter(stat => stat.statCategory == 1 || stat.statCategory == 2);
    stats = stats.filter(stat => !(stat.displayProperties.name == 'Ammo Capacity' ||
    stat.displayProperties.name == 'Boost' ||
    stat.displayProperties.name == 'Durability' ||
    stat.displayProperties.name == 'Heroic Resistance' ||
    stat.displayProperties.name == 'Move Speed' ||
    stat.displayProperties.name == 'Precision Damage' ||
    stat.displayProperties.name == 'Time to Aim Down Sights'));
    // sort stats by stat.displayProperties.name
    stats.sort((a, b) => {
      const aName = a.displayProperties.name.toLowerCase();
      const bName = b.displayProperties.name.toLowerCase();
      if (aName < bName) { return -1; }
      if (aName > bName) { return 1; }
      return 0;
    });

    for (const stat of stats) {
      const name = stat.displayProperties.name;
      // make name lowercase and remove spaces
      const simpleName = name.toLowerCase().replace(/\s/g, '');
      this.statChoiceMap.set(simpleName, stat.hash);
      if (stat.statCategory == 1) {
        this.weaponStatChoices.push({ value: `stat:${simpleName}>=` });
      }
      if (stat.statCategory == 2) {
        this.armorStatChoices.push({ value: `stat:${simpleName}>=` });
      }
    }

    // tap into the filter changes to mark things dirty if necessary
    this.filterUpdated$.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(20))
      .subscribe(() => {
        const dirty = this.isFilterDirty();
        if (dirty != this.filtersDirty$.getValue()) {
          this.filtersDirty$.next(dirty);
        }
        if (this.isToggleDataInit()) {
          const worthSaving = dirty || this.sortBy$.getValue() != 'power' || this.sortDesc$.getValue() != true || this.hideDupes$.getValue() != false;
          // we have no filters, so clear everything in localstorage
          if (!worthSaving) {
            localStorage.removeItem(GEAR_FILTER_KEY);
          } else {
            const filterSettings: FilterSettings = {
              hideDupes: this.hideDupes$.getValue(),
              sortBy: this.sortBy$.getValue(),
              sortDesc: this.sortDesc$.getValue(),
              filterText: this.visibleFilterText,
              deselectedChoices: {}
            };
            for (const key of Object.keys(this.toggleData)) {
              const t = this.toggleData[key];
              const deselectedVals: string[] = t.getValue().choices.filter(c => !c.value).map(c => c.matchValue);
              if (deselectedVals.length > 0) {
                filterSettings.deselectedChoices[key] = deselectedVals;
              }
            }
            localStorage.setItem(GEAR_FILTER_KEY, JSON.stringify(filterSettings));
          }
        }
      });
  }

  public init(visibleItemType: TabOption) {
    this.toggleData = this.initToggles(this.iconService, visibleItemType);
    const a = [];
    const thingsToListenTo$ = [this.filterTags$];
    for (const key of Object.keys(this.toggleData)) {
      a.push(this.toggleData[key]);
      thingsToListenTo$.push(this.toggleData[key]);
    }
    combineLatest(thingsToListenTo$).pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(10)).subscribe(() => {
        this.filterUpdated$.next();
      });
    this.toggleDataArray = a;
    this.autoCompleteOptions = FIXED_AUTO_COMPLETE_OPTIONS.slice(0);
  }


  public updateTab(option: TabOption) {
    for (const toggle$ of this.toggleDataArray) {
      const val = toggle$.getValue();
      toggle$.next(generateState(val.config, val.choices, option.type));
    }
  }

  private isToggleDataInit() {
    return (this.toggleData.weaponTypes$?.getValue()?.choices?.length > 0);
  }


  private isFilterDirty() {
    // we have wildcard entries
    if (this.filterTags$.getValue().length > 0) {
      return true;
    }
    // check if toggles are filtering anything
    for (const toggle$ of this.toggleDataArray) {
      if (!toggle$.getValue().allSelected) {
        return true;
      }
    }
    return false;
  }


  private shouldKeepItem(i: InventoryItem): boolean {

    for (const f of this.filterTags$.getValue()) {
      const match = processFilterTag(f, i, this.statChoiceMap);
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



  private toggleFilterSingle(i: InventoryItem): boolean {

    for (const t$ of this.toggleDataArray) {
      const t: ToggleState = t$.getValue();
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
        // is it checked?
        if (c.value) {
          if (c.matchValue == val) {
            matched = true;
            continue;
          } else if (Array.isArray(val)) {
            const aVal = val as string[];
            if (aVal.indexOf(c.matchValue) >= 0) {
              matched = true;
              continue;
            }
          } else if (t.config.wildcard && val) {
            const sVal = val as string;
            if (sVal.indexOf(c.matchValue) >= 0) {
              matched = true;
              continue;
            }
          }
        }
      }
      if (matched) {
        continue;
      }
      return false;
    }
    return true;
  }

  public filterGear(gear: InventoryItem[]): InventoryItem[] {
    gear = this.wildcardFilter(gear);
    return this.toggleFilter(gear);
  }

  private wildcardFilter(gear: InventoryItem[]): InventoryItem[] {
    if (this.filterTags$.getValue().length > 0) {
      return gear.filter(this.shouldKeepItem, this);
    } else {
      return gear;
    }
  }

  private toggleFilter(gear: InventoryItem[]): InventoryItem[] {
    const returnMe: InventoryItem[] = [];
    for (const i of gear) {
      if (this.toggleFilterSingle(i)) {
        returnMe.push(i);
      }
    }
    return returnMe;
  }

  public resetFilters(): void {
    this.visibleFilterText = null;
    this.filterTags$.next([]);
    this.orMode = false;
    for (const toggle$ of this.toggleDataArray) {
      const val = toggle$.getValue();
      const choices = val.choices.slice(0);
      choices.forEach(x => x.value = true);
      toggle$.next(generateState(val.config, choices, val.visibleItemType));
    }
  }

  public initWithPlayer(player: Player, shortcutInfo$: BehaviorSubject<ShortcutInfo | null>, visibleItemType: TabOption) {
    if (!this.isToggleDataInit()) {
      this.generateDynamicChoices(player, this.toggleData);
      this.autoCompleteOptions = this.generateDynamicAutocompleteOptions(player.gear);

      const sSettings = localStorage.getItem(GEAR_FILTER_KEY);
      if (sSettings) {
        const filterSettings: FilterSettings = JSON.parse(sSettings);
        if (filterSettings.sortBy) {
          this.sortBy$.next(filterSettings.sortBy);
        }
        if (filterSettings.sortDesc != null) {
          this.sortDesc$.next(filterSettings.sortDesc);
        }
        if (filterSettings.hideDupes!=null) {
          this.hideDupes$.next(filterSettings.hideDupes);
        }
        this.visibleFilterText = filterSettings.filterText;
        this.parseWildcardFilter(visibleItemType);
        for (const key of Object.keys(this.toggleData)) {
          let changeMade = false;
          const t: ToggleState = this.toggleData[key].getValue();
          const deselectedVals: string[] = filterSettings.deselectedChoices[key];
          if (deselectedVals) {
            const choices = t.choices.slice(0);
            for (const deselectedVal of deselectedVals) {
              const choice = t.choices.find(x => x.matchValue === deselectedVal);
              if (choice) {
                choice.value = false;
                changeMade = true;
              }
            }
            if (changeMade) {
              this.toggleData[key].next(generateState(t.config, choices, t.visibleItemType));
            }
          }
        }
      }
    }
    this.applyShortcutInfo(shortcutInfo$);
  }

  public parseWildcardFilter(visibleItemType: TabOption) {
    const val: string = this.visibleFilterText;
    if (val == null || val.trim().length === 0) {
      this.filteredAutoCompleteOptions$.next([]);
      this.filterTags$.next([]);
      this.orMode = false;
    } else {
      const rawFilter = val.toLowerCase();
      if (rawFilter.indexOf(' or ') >= 0) {
        this.filterTags$.next(rawFilter.split(' or '));
        this.orMode = true;
      } else {
        this.orMode = false;
        this.filterTags$.next(rawFilter.split(' and '));
      }
      const newFilteredOptions = [];
      if (rawFilter.startsWith('is:') || rawFilter.startsWith('has:')) {
        for (const o of this.autoCompleteOptions) {
          if (o.value.startsWith(rawFilter)) {
            newFilteredOptions.push(o);
          }
        }
      }  else if (rawFilter.startsWith('sta')) {
        if (ItemType.Weapon === visibleItemType.type) {
          for (const o of this.weaponStatChoices) {
            if (o.value.startsWith(rawFilter)) {
              newFilteredOptions.push(o);
            }
          }
        } else if (ItemType.Armor === visibleItemType.type) {
          for (const o of this.armorStatChoices) {
            if (o.value.startsWith(rawFilter)) {
              newFilteredOptions.push(o);
            }
          }
        }
      }  else if (rawFilter.startsWith('#')) {
        const hashTags = this.markService.hashTags$.getValue();
        for (const hashTag of hashTags) {
          if (hashTag.startsWith(rawFilter)) {
            newFilteredOptions.push({
              value: hashTag
            });
          }
        }
      }
      this.filteredAutoCompleteOptions$.next(newFilteredOptions);
    }
  }



  private generateDynamicAutocompleteOptions(gear: InventoryItem[]) {
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
    const newChoices = FIXED_AUTO_COMPLETE_OPTIONS.slice(0);
    for (const c of amwChoices) {
      newChoices.push({
        value: c
      });
    }
    return newChoices;
  }

  public applyShortcutInfo(shortcutInfo$: BehaviorSubject<ShortcutInfo | null>) {
    const shortcutInfo = shortcutInfo$.getValue();
    if (!shortcutInfo) {
      return;
    }
    if (!this.isToggleDataInit()) {
      return;
    }
    this.resetFilters();
    if (shortcutInfo.owner) {
      const val = this.toggleData.owners$.getValue();
      const choices = val.choices.slice(0);

      choices.forEach(x => x.value = (x.matchValue == shortcutInfo.owner));
      this.toggleData.owners$.next(generateState(val.config, choices, val.visibleItemType));
    }
    if (shortcutInfo.postmaster) {
      const val = this.toggleData.postmaster$.getValue();
      const choices = val.choices.slice(0);
      choices.forEach(x => x.value = (x.matchValue == true));
      this.toggleData.postmaster$.next(generateState(val.config, choices, val.visibleItemType));
    }
    shortcutInfo$.next(null);
  }

  private generateDynamicChoices(player: Player, toggleData: ToggleData) {
    const tempOwners: Choice[] = [];
    for (const char of player.characters) {
      tempOwners.push(new Choice(char.id, char.label));
    }
    tempOwners.push(new Choice(player.vault.id, player.vault.label));
    tempOwners.push(new Choice(player.shared.id, player.shared.label));

    toggleData.owners$.next({
      ...toggleData.owners$.getValue(),
      choices: tempOwners
    });

    // enumerate the actual types of gear, since we'll want that for guns and exchange
    // actually sift through the gear to find only the ones we need
    const temp: any = {};
    const dPowerCaps: any = {};
    for (const i of player.gear) {
      if (temp[i.type + ''] == null) {
        temp[i.type + ''] = [];
      }
      temp[i.type + ''][i.typeName] = true;
      if (i.powerCap) {
        dPowerCaps[i.powerCap] = true;
      }
    }
    const aPowerCaps = [];
    for (const key of Object.keys(dPowerCaps)) {
      aPowerCaps.push(key);
    }
    aPowerCaps.sort();
    aPowerCaps.reverse();
    const aPowerCapChoices = [];
    for (const pc of aPowerCaps) {
      if (pc == 9999) {
        aPowerCapChoices.push(new Choice(pc, 'None'));
      } else {
        aPowerCapChoices.push(new Choice(pc, `${pc}`));
      }
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

    toggleData.exchangeType$.next({
      ...toggleData.exchangeType$.getValue(),
      choices: arrays[ItemType.ExchangeMaterial + '']
    });
    toggleData.weaponTypes$.next({
      ...toggleData.weaponTypes$.getValue(),
      choices: arrays[ItemType.Weapon + '']
    });
    toggleData.powerCaps$.next({
      ...toggleData.powerCaps$.getValue(),
      choices: aPowerCapChoices
    });
  }

  private initToggles(iconService: IconService, currentTab: TabOption): ToggleData {
    const tagConfig: ToggleConfig = {
      title: 'Tags',
      debugKey: 'Tags',
      icon: iconService.fasTags,
      displayTabs: [ItemType.Weapon, ItemType.Armor, ItemType.Ghost, ItemType.Vehicle],
      grabValue: (x: InventoryItem) => x.mark
    };
    const godRollConfig: ToggleConfig = {
      title: 'God Rolls',
      debugKey: 'God Roll',
      icon: iconService.fasStar,
      displayTabs: [ItemType.Weapon],
      wildcard: true,
      grabValue: (x: InventoryItem) => x.searchText
    };
    const armorStatPointsConfig: ToggleConfig = {
      title: 'Stat Points',
      debugKey: 'Stat Points',
      icon: iconService.fasStar,
      displayTabs: [ItemType.Armor],
      grabValue: (x: InventoryItem) => x.statPointTier()
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
      title: 'Season Mods',
      debugKey: 'Seasonal Mods',
      icon: iconService.fasTicketAlt,
      displayTabs: [ItemType.Armor],
      grabValue: (x: InventoryItem) => x.specialModSockets  // this is a string[]
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
    const powerCapsConfig: ToggleConfig = {
      title: 'Cap',
      debugKey: 'Cap',
      icon: iconService.fasLevelUpAlt,
      displayTabs: [ItemType.Weapon, ItemType.Armor],
      grabValue: (x: InventoryItem) => x.powerCap
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
      icon: iconService.fasChessKnight,
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
    const returnMe: ToggleData = {
      tags$: new BehaviorSubject(generateState(tagConfig, [
        new Choice('upgrade', 'Upgrade'),
        new Choice('keep', 'Keep'),
        new Choice('infuse', 'Infuse'),
        new Choice('junk', 'Junk'),
        new Choice('archive', 'Archive'),
        new Choice(null, 'Unmarked')
      ], currentTab.type)),
      energyType$: new BehaviorSubject(generateState(energyConfig, [
        new Choice(`${EnergyType.Stasis}`, 'Stasis'),
        new Choice(`${EnergyType.Arc}`, 'Arc'),
        new Choice(`${EnergyType.Thermal}`, 'Solar'),
        new Choice(`${EnergyType.Void}`, 'Void'),
        new Choice(`${EnergyType.Any}`, 'Any')
      ], currentTab.type)),
      seasons$: new BehaviorSubject(generateState(seasonConfig, [
        new Choice('special', 'Any Special'),
        new Choice('artifice', 'Artifice'),
        new Choice('vod', 'Vow of the Disciple Raid'),
        new Choice('vog', 'Vault of Glass Raid'),
        new Choice('deepstone', 'Deepstone Crypt'),
        new Choice('gos', 'Garden of Salvation'),
        new Choice('lw', 'Last Wish'),
        new Choice('combat', 'Combat'),
        new Choice('none', 'None')
      ], currentTab.type)),
      damageType$: new BehaviorSubject(generateState(damageConfig,
        [
          new Choice(`${DamageType.Kinetic}`, 'Kinetic'),
          new Choice(`${DamageType.Stasis}`, 'Stasis'),
          new Choice(`${DamageType.Arc}`, 'Arc'),
          new Choice(`${DamageType.Thermal}`, 'Solar'),
          new Choice(`${DamageType.Void}`, 'Void'),
        ], currentTab.type)),
      ammoTypes$: new BehaviorSubject(generateState(ammoTypesConfig, [
        new Choice(DestinyAmmunitionType.Primary + '', 'Primary'),
        new Choice(DestinyAmmunitionType.Special + '', 'Special'),
        new Choice(DestinyAmmunitionType.Heavy + '', 'Heavy')
      ], currentTab.type)),
      classType$: new BehaviorSubject(generateState(classTypeConfig, [
        new Choice(ClassAllowed.Titan + '', 'Titan'),
        new Choice(ClassAllowed.Warlock + '', 'Warlock'),
        new Choice(ClassAllowed.Hunter + '', 'Hunter'),
        new Choice(ClassAllowed.Any + '', 'Any'),
      ], currentTab.type)),
      equipped$: new BehaviorSubject(generateState(equippedConfig, [
        new Choice(true, 'Equipped'),
        new Choice(false, 'Not Equipped')
      ], currentTab.type)),
      postmaster$: new BehaviorSubject(generateState(postmasterConfig, [
        new Choice(true, 'Postmaster'),
        new Choice(false, 'Not postmaster')
      ], currentTab.type)),
      armorStatPoints$: new BehaviorSubject(generateState(armorStatPointsConfig,
        [
          new Choice(3, ' > 65'),
          new Choice(2, ' 60 - 65 '),
          new Choice(1, ' 50 - 59'),
          new Choice(0, ' < 50'),
        ], currentTab.type)),
      godRolls$: new BehaviorSubject(generateState(godRollConfig,
        [

          new Choice('is:deepsight', 'Deepsight'),
          new Choice('is:crafted', 'Crafted'),
          new Choice('is:godroll', 'God Roll'),
          new Choice('is:goodroll', 'Good Roll'),
          new Choice('is:godrollpve', 'God Roll PVE'),
          new Choice('is:godrollpvp', 'God Roll PVP'),
          new Choice('is:goodrollpve', 'Good Roll PVE'),
          new Choice('is:goodrollpvp', 'Good Roll PVP'),
          new Choice('is:fixme', 'Suboptimal perks active'),
          new Choice('is:notcrafted', 'Not Crafted'),
          new Choice('is:notinteresting', 'Not good/god/deepsight/crafted')
        ], currentTab.type)),
      weaponBuckets$: new BehaviorSubject(generateState(weaponBucketsConfig,
        this.generateBucketChoices(ItemType.Weapon), currentTab.type)),
      armorBuckets$: new BehaviorSubject(generateState(armorBucketsConfig,
        this.generateBucketChoices(ItemType.Armor), currentTab.type)),
      vehicleBuckets$: new BehaviorSubject(generateState(vehicleBucketsConfig,
        this.generateBucketChoices(ItemType.Vehicle), currentTab.type)),
      rarities$: new BehaviorSubject(generateState(raritiesConfig,
        this.generateRarityChoices(), currentTab.type)),
      weaponTypes$: new BehaviorSubject(generateState(weaponTypesConfig, [], currentTab.type)),
      exchangeType$: new BehaviorSubject(generateState(exchangeTypesConfig, [], currentTab.type)),
      owners$: new BehaviorSubject(generateState(ownerConfig, [], currentTab.type)),
      powerCaps$: new BehaviorSubject(generateState(powerCapsConfig, [], currentTab.type))
    };
    return returnMe;
  }


  private generateBucketChoices(itemType: ItemType): Choice[] {
    const buckets = this.destinyCacheService.cacheLite.InventoryBucket;
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
    aBuckets.sort(sortByIndex);
    const returnMe: Choice[] = [];

    for (const bucket of aBuckets) {
      returnMe.push(new Choice(bucket.displayProperties.name, bucket.displayProperties.name));
    }
    return returnMe;
  }

  private generateRarityChoices(): Choice[] {
    const tiers = this.destinyCacheService.cacheLite.ItemTierType;
    const aTiers: ApiItemTierType[] = [];
    for (const key of Object.keys(tiers)) {
      const val: ApiItemTierType = tiers[key];
      if (!val.blacklisted && !val.redacted) {
        if (val.displayProperties.name != 'Basic') {
          aTiers.push(val);
        }
      }
    }
    aTiers.sort(sortByIndexReverse);
    const returnMe: Choice[] = [];
    for (const tier of aTiers) {
      returnMe.push(new Choice(tier.displayProperties.name, tier.displayProperties.name));
    }
    return returnMe;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}


export interface ToggleConfig {
  title: string;
  debugKey: string;
  icon?: IconDefinition;
  iconClass?: string;
  displayTabs: ItemType[];
  wildcard?: boolean;
  grabValue(i: InventoryItem): any;
}

export interface ToggleState {
  config: ToggleConfig;
  visibleItemType: ItemType;
  hidden: boolean;
  allSelected: boolean;
  choices: Choice[];
}


export class Choice {
  readonly matchValue: any;
  readonly display: string;
  public value = true;

  constructor(matchValue: any, display: string, value?: boolean) {
    this.matchValue = matchValue;
    this.display = display;
    if (value != undefined) { this.value = value; }
  }
}


export interface TabOption {
  name: string;
  type: ItemType;
  path: string;
}

export interface ToggleData {
  tags$: BehaviorSubject<ToggleState>;
  weaponBuckets$: BehaviorSubject<ToggleState>;
  godRolls$: BehaviorSubject<ToggleState>;
  armorStatPoints$: BehaviorSubject<ToggleState>;
  weaponTypes$: BehaviorSubject<ToggleState>;
  ammoTypes$: BehaviorSubject<ToggleState>;
  armorBuckets$: BehaviorSubject<ToggleState>;
  energyType$: BehaviorSubject<ToggleState>;
  seasons$: BehaviorSubject<ToggleState>;
  damageType$: BehaviorSubject<ToggleState>;
  vehicleBuckets$: BehaviorSubject<ToggleState>;
  exchangeType$: BehaviorSubject<ToggleState>;
  owners$: BehaviorSubject<ToggleState>;
  rarities$: BehaviorSubject<ToggleState>;
  equipped$: BehaviorSubject<ToggleState>;
  classType$: BehaviorSubject<ToggleState>;
  postmaster$: BehaviorSubject<ToggleState>;
  powerCaps$: BehaviorSubject<ToggleState>;
}

export interface ShortcutInfo {
  postmaster: boolean | null;
  owner: string | null;
}

export interface AutoCompleteOption {
  value: string;
  desc?: string;
}

interface FilterSettings {
  sortBy: string;
  sortDesc: boolean;
  hideDupes: boolean;
  filterText: string;
  deselectedChoices: { [key: string]: string[] }; // toggle key, and matched values that are deslected
}
