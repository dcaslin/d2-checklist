import { Injectable, OnDestroy } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import {
  InventoryItem,
  ItemType,
  MileStoneName,
  MilestoneStatus,
  NameQuantity,
  Player,
  PursuitTuple,
} from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import {
  generateUberState,
  UberChoice,
  UberToggleConfig,
  UberToggleState,
} from './uber-list-toggle/uber-list-toggle.component';

const UBER_FILTER_KEY = 'D2C-UBER-FILTER';

@Injectable({
  providedIn: 'root',
})
export class UberListStateService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();

  public filterKeyUp$: Subject<void> = new Subject();
  public rows$: BehaviorSubject<(MilestoneRow | PursuitRow)[]> =
    new BehaviorSubject([]);
  public filteredRows$: BehaviorSubject<(MilestoneRow | PursuitRow)[]> =
    new BehaviorSubject([]);
  public toggleData: UberToggleData | null = null;
  public toggleDataArray: BehaviorSubject<UberToggleState>[] = [];
  public visibleFilterText = '';
  public filtersDirty$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public filterUpdated$: Subject<void> = new Subject<void>();
  private toggleDataInit = false;
  public orMode = false;
  public filterTags$: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor(
    private signedOnUserService: SignedOnUserService,
    private destinyCacheService: DestinyCacheService,
    private iconService: IconService
  ) {
    this.toggleData = this.buildInitToggles();
    const a: BehaviorSubject<UberToggleState>[] = [];
    const thingsToListenTo$ = [this.rows$, this.filterTags$];
    for (const key of Object.keys(this.toggleData)) {
      a.push(this.toggleData[key]);
      thingsToListenTo$.push(this.toggleData[key]);
    }
    this.toggleDataArray = a;

    this.filterKeyUp$
      .pipe(takeUntil(this.unsubscribe$), debounceTime(150))
      .subscribe(() => {
        this.parseWildcardFilter();
      });
    combineLatest(thingsToListenTo$)
      .pipe(takeUntil(this.unsubscribe$), debounceTime(10))
      .subscribe(() => {
        this.filterUpdated$.next();
      });

    combineLatest([
      this.signedOnUserService.player$,
      this.signedOnUserService.vendors$,
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(([player, vendors]) => player != null && vendors != null)
      )
      .subscribe(([player, charVendors]) => {
        const rowData: { [key: string]: MilestoneRow | PursuitRow } = {};
        for (const char of player.characters) {
          const vendors = charVendors.find((x) => x.char.id == char.id);
          if (vendors) {
            for (const vi of vendors.data) {
              if (vi.type == ItemType.Bounty) {
                // create empty pursuit row
                if (!rowData[vi.hash]) {
                  rowData[vi.hash] = this.buildInitialPursuitRow(vi);
                }
                const target = rowData[vi.hash] as PursuitRow;
                if (!target.characterEntries[char.id]) {
                  target.characterEntries[char.id] = {
                    characterItem: null,
                    vendorItem: null,
                  };
                }
                target.characterEntries[char.id].vendorItem = vi;
              }
            }
          }
          const bounties = player.bounties.filter(
            (x) => x.owner.getValue().id == char.id
          );
          for (const b of bounties) {
            if (!rowData[b.hash]) {
              rowData[b.hash] = this.buildInitialPursuitRow(b);
            }
            const target = rowData[b.hash] as PursuitRow;
            if (!target.characterEntries[char.id]) {
              target.characterEntries[char.id] = {
                characterItem: null,
                vendorItem: null,
              };
            }
            target.characterEntries[char.id].characterItem = b;
          }
          for (const msn of player.milestoneList) {
            const c = char.milestones[msn.key];
            if (c) {
              if (!rowData[c.hash]) {
                rowData[c.hash] = this.buildInitialMilestoneRow(msn);
              }
              const target = rowData[c.hash];
              target.characterEntries[char.id] = c;
            }
          }
        }
        const rows: (MilestoneRow | PursuitRow)[] = [];
        for (const key of Object.keys(rowData)) {
          rows.push(rowData[key]);
        }
        this.rows$.next(rows);
        this.initWithPlayer(player, rows);

        // TODO sorting
        // TODO filtering using toggles
        // TODO click on item for more info (just bounties? also milestones?)
      });

    this.filterUpdated$
      .pipe(takeUntil(this.unsubscribe$), debounceTime(30))
      .subscribe(() => {
        this.filterAndSortRows();
      });

    // mark tags dirty and save settings if changed
    this.filterUpdated$
      .pipe(takeUntil(this.unsubscribe$), debounceTime(20))
      .subscribe(() => {
        const dirty = this.isFilterDirty();
        if (dirty != this.filtersDirty$.getValue()) {
          this.filtersDirty$.next(dirty);
        }
        if (this.toggleDataInit) {
          // we have no filters, so clear everything in localstorage
          if (!dirty) {
            localStorage.removeItem(UBER_FILTER_KEY);
          } else {
            const filterSettings: UberFilterSettings = {
              filterText: this.visibleFilterText,
              deselectedChoices: {},
            };
            for (const key of Object.keys(this.toggleData)) {
              const t = this.toggleData[key];
              const deselectedVals: string[] = t
                .getValue()
                .choices.filter((c) => !c.checked)
                .map((c) => c.matchValue);
              if (deselectedVals.length > 0) {
                filterSettings.deselectedChoices[key] = deselectedVals;
              }
            }
            localStorage.setItem(
              UBER_FILTER_KEY,
              JSON.stringify(filterSettings)
            );
          }
        }
      });
  }



  private shouldKeepRow(i: MilestoneRow | PursuitRow): boolean {
    for (const f of this.filterTags$.getValue()) {
      const match = processFilterTag(f, i);
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


  private wildcardFilter(rows: (MilestoneRow | PursuitRow)[]): (MilestoneRow | PursuitRow)[] {
    if (this.filterTags$.getValue().length > 0) {
      return rows.filter(this.shouldKeepRow, this);
    } else {
      return rows;
    }
  }

  private toggleFilter(rows: (MilestoneRow | PursuitRow)[]): (MilestoneRow | PursuitRow)[] {
    return rows.filter(x => this.toggleFilterSingle(x));
  }

  private toggleFilterSingle(i: (MilestoneRow | PursuitRow)): boolean {

    for (const t$ of this.toggleDataArray) {
      const t: UberToggleState = t$.getValue();
      // toggle is hidden or not filtering anything
      if (t.allSelected) {
        continue;
      }
      // toggle is empty for some reason
      if (t.choices == null || t.choices.length == 0) {
        continue;
      }
      // the toggled filtered this item
      if (!t.config.includeValue(i, t)) {
        return false;
      }
    }
    return true;
  }

  private filterAndSortRows() {
    console.log(`Filtering and sorting rows...`);
    let filterMe = this.rows$.getValue().slice(0);
    filterMe = this.wildcardFilter(filterMe);
    filterMe = this.toggleFilter(filterMe);
    this.filteredRows$.next(filterMe);
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

  public initWithPlayer(player: Player, rows: (MilestoneRow | PursuitRow)[]) {
    if (!this.toggleDataInit) {
      this.generateDynamicChoices(player, rows);
      const sSettings = localStorage.getItem(UBER_FILTER_KEY);
      if (sSettings) {
        const filterSettings: UberFilterSettings = JSON.parse(sSettings);
        this.visibleFilterText = filterSettings.filterText;
        this.parseWildcardFilter();
        for (const key of Object.keys(this.toggleData)) {
          let changeMade = false;
          const t: UberToggleState = this.toggleData[key].getValue();
          const deselectedVals: string[] =
            filterSettings.deselectedChoices[key];
          if (deselectedVals) {
            const choices = t.choices.slice(0);
            for (const deselectedVal of deselectedVals) {
              const choice = t.choices.find(
                (x) => x.matchValue === deselectedVal
              );
              if (choice) {
                choice.checked = false;
                changeMade = true;
              }
            }
            if (changeMade) {
              this.toggleData[key].next(generateUberState(t.config, choices));
            }
          }
        }
      }
      this.toggleDataInit = true;
    }
  }

  private buildInitialPursuitRow(i: InventoryItem): PursuitRow {
    return {
      id: i.hash,
      type: 'pursuit',
      title: i,
      searchText: i.searchText,
      characterEntries: {},
    };
  }

  private handleRewardItem(val: PrivRewardDesc, rewards: NameQuantity[]) {
    if (val.itemHash === 0) {
      return;
    }
    const valDesc: any =
      this.destinyCacheService.cache.InventoryItem[val.itemHash];
    if (valDesc != null) {
      rewards.push({
        hash: val.itemHash + '',
        icon: valDesc.displayProperties.icon,
        name: valDesc.displayProperties.name,
        quantity: val.quantity,
      });
    }
  }

  private buildInitialMilestoneRow(msn: MileStoneName): MilestoneRow {
    let desc = this.destinyCacheService.cache.Milestone[msn.key];
    if (
      desc?.displayProperties?.icon == null
    ) {
      const vendorHash = ICON_FIXES[msn.key];
      if (desc == null) {
        desc = {
          displayProperties: {}
        };
      }
      if (vendorHash) {
        desc.displayProperties.icon =
          this.destinyCacheService.cache.Vendor[
            vendorHash
          ].displayProperties?.smallTransparentIcon;
      }
    } else if (!desc?.displayProperties) {
      console.dir(msn);
    }
    const rewards: NameQuantity[] = [];
    // try quest rewards approach, this works for things like Shady Schemes 3802603984
    if (desc?.quests) {
      for (const key of Object.keys(desc.quests)) {
        const q = desc.quests[key];
        if (q.questItemHash) {
          const qDesc =
            this.destinyCacheService.cache.InventoryItem[q.questItemHash];
          if (qDesc.value != null && qDesc.value.itemValue != null) {
            for (const val of qDesc.value.itemValue) {
              this.handleRewardItem(val, rewards);
            }
          }
        }
      }
    }
    if (desc?.rewards) {
      for (const key of Object.keys(desc.rewards)) {
        const reward = desc.rewards[key];
        if (reward.rewardEntries) {
          for (const key2 of Object.keys(reward.rewardEntries)) {
            const rewardEntry = reward.rewardEntries[key2];
            if (rewardEntry.items) {
              for (const val of rewardEntry.items) {
                this.handleRewardItem(val, rewards);
              }
            }
          }
        }
      }
    }
    // Raids tend to be missing rewards, luckily we already did the work in ParseService to get the string reward value, so we'll just parse out an icon on it
    if (rewards.length == 0 && msn.rewards != null) {
      if ('Pinnacle Gear' == msn.rewards) {
        this.handleRewardItem({ itemHash: 73143230, quantity: 0 }, rewards);
      }
      if ('Legendary Gear' == msn.rewards) {
        this.handleRewardItem({ itemHash: 2127149322, quantity: 0 }, rewards);
      }
    }

    const searchText = (JSON.stringify(msn) + JSON.stringify(desc)).toLowerCase();
    return {
      id: msn.key,
      type: 'milestone',
      title: msn,
      rewards,
      desc: desc,
      searchText,
      characterEntries: {},
    };
  }

  public init() {
    this.signedOnUserService.loadVendorsIfNotLoaded();
  }

  public refresh() {
    this.signedOnUserService.refreshPlayerAndVendors();
  }

  public resetFilters() {
    this.visibleFilterText = null;
    this.orMode = false;
    this.filterTags$.next([]);
    // todo reset actuall wildcard filter
    for (const toggle$ of this.toggleDataArray) {
      const val = toggle$.getValue();
      const choices = val.choices.slice(0);
      choices.forEach((x) => (x.checked = true));
      toggle$.next(generateUberState(val.config, choices));
    }
  }

  public parseWildcardFilter() {
    console.log('Parsing filter');
    const val: string = this.visibleFilterText;
    if (val == null || val.trim().length === 0) {
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
    }
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private buildInitToggles(): UberToggleData {
    const activityTypeConfig: UberToggleConfig = {
      title: 'Activity',
      debugKey: 'Activity',
      icon: this.iconService.fasFlag,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        // assuming we have choices that are unchecked, filter on them
        const choice = state.choices.find((c) => c.matchValue === x.type);
        if (!choice) {
          return true;
        }
        return choice.checked;
      },
    };
    const cadenceConfig: UberToggleConfig = {
      title: 'Cadence',
      debugKey: 'Cadence',
      icon: this.iconService.fasCalendarAlt,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const choice = state.choices.find((c) => c.matchValue === x.type);
        if (!choice) {
          return true;
        }
        return choice.checked;
      },
    };
    const rewardTierConfig: UberToggleConfig = {
      title: 'Reward Tier',
      debugKey: 'Reward Tier',
      iconClass: 'icon-engram',
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        let rewards: NameQuantity[] = [];

        if (x.type == 'pursuit') {
          const p = x as PursuitRow;
          rewards = p.title.values;
        } else if (x.type == 'milestone') {
          const m = x as MilestoneRow;
          rewards = m.rewards;
        }
        const rewardText = rewards.map( r => r.name.toLowerCase());
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        for (const val of selectedVals) {
          if (val == 'other') {
            const hasOther = rewardText.filter(x => {
              if (x.indexOf('pinnacle') >= 0) {
                return false;
              } else if (x.indexOf('powerful') >= 0) {
                return false;
              } else if (x.indexOf('legendary') >= 0) {
                return false;
              }
              return true;
            }).length > 0;
            if (hasOther) {
              return true;
            }
          }
          // is the reward in the list of selected values?
          if (rewardText.filter(r => r.indexOf(val) >= 0).length > 0) {
            return true;
          }
        }
        return false;
      },
    };
    const rewardConfig: UberToggleConfig = {
      title: 'Rewards',
      debugKey: 'Rewards',
      icon: this.iconService.fasGift,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const choice = state.choices.find((c) => c.matchValue === x.type);
        if (!choice) {
          return true;
        }
        return choice.checked;
      },
    };
    const ownerConfig: UberToggleConfig = {
      title: 'Owner',
      debugKey: 'Owner',
      icon: this.iconService.fasUsers,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        if (x.type == 'pursuit') {
          const p = x as PursuitRow;
          // is this item avail from a vendor?
          const hasVendor = Object.values(p.characterEntries).some(tuple => tuple.vendorItem != null);
          // if the item is from a vendor and Vendor is chosen, we're good
          if (hasVendor && selectedVals.find(v => v === 'vendor')) {
            return true;
          }
          for (const key of Object.keys(p.characterEntries)) {
            const val = p.characterEntries[key];
            // if it's not held, skip it
            if (val.characterItem == null) {
              continue;
            }
            // if the character id is selected, include it
            if (selectedVals.find(v => v === key) != null) {
              return true;
            }
          }
          return false;
        } else if (x.type == 'milestone') {
          const m = x as MilestoneRow;

          for (const key of Object.keys(m.characterEntries)) {
            const val = m.characterEntries[key];
            if (val == null) {
              continue;
            }
            // if a character is selected and the milestone entry is present and not fully complete, include it
            if (selectedVals.find(v => v === key) != null && !val.complete) {
              return true;
            }
          }
        }
        return false;
      },
    };
    // x Activity Type: Milestone / Bounty / Other (edited)
    // x Cadence: Weekly / Daily / Other (edited)
    // x Reward Tier: Pinnacle / Powerful / Legendary / Other
    // Rewards: XP / Bright Dust / Etc / Other
    // Owner: For sale Char 1/2/3  / Held Char 1/2/3
    return {
      activityType$: new BehaviorSubject(
        generateUberState(activityTypeConfig, [
          new UberChoice('pursuit', 'Pursuit'),
          new UberChoice('milestone', 'Milestone'),
        ])
      ),
      rewardTier$: new BehaviorSubject(
        generateUberState(rewardTierConfig, [
          new UberChoice('pinnacle', 'Pinnacle'),
          new UberChoice('powerful', 'Powerful'),
          new UberChoice('legendary', 'Legendary'),
          new UberChoice('other', 'Other'),
        ])
      ),
      cadence$: new BehaviorSubject(
        generateUberState(cadenceConfig, [
          new UberChoice('a', 'A'),
          new UberChoice('b', 'B'),
        ])
      ),
      reward$: new BehaviorSubject(
        generateUberState(rewardConfig, [
          new UberChoice('a', 'A'),
          new UberChoice('b', 'B'),
        ])
      ),
      owner$: new BehaviorSubject(
        generateUberState(ownerConfig, [])
      ),
    };
  }

  private generateDynamicChoices(player: Player, rows: (MilestoneRow | PursuitRow)[]) {
    // do something here
    const tempOwners: UberChoice[] = [];
    for (const char of player.characters) {
      tempOwners.push(new UberChoice(char.id, char.label));
    }
    tempOwners.push(new UberChoice('vendor', 'Vendor'));
    this.toggleData.owner$.next({
      ...this.toggleData.owner$.getValue(),
      choices: tempOwners
    });
  }
}

interface PrivRewardDesc {
  itemHash: number;
  quantity: number;
}

export interface MilestoneRow {
  id: string;
  type: 'milestone';
  title: MileStoneName;
  desc: any;
  searchText: string;
  rewards: NameQuantity[];
  characterEntries: { [key: string]: MilestoneStatus };
}

export interface PursuitRow {
  id: string;
  type: 'pursuit';
  title: InventoryItem;
  searchText: string;
  characterEntries: { [key: string]: PursuitTuple };
}


const ICON_FIXES = {
  '2594202463': '3603221665', // CRUCIBLE_WEEKLY_BOUNTIES
  '3899487295': '672118013', // GUNSMITH_WEEKLY_BOUNTIES
  '2709491520': '69482069', // VANGUARD_WEEKLY_BOUNTIES
  '3802603984': '248695599', // GAMBIT_WEEKLY_BOUNTIES
  'PSUEDO_MASTER_EMPIRE': '2531198101', // MASTER_EMPIRE_HUNTS
};

interface UberFilterSettings {
  filterText: string;
  deselectedChoices: { [key: string]: string[] }; // toggle key, and matched values that are deslected
}

interface UberToggleData {
  activityType$: BehaviorSubject<UberToggleState>;
  rewardTier$: BehaviorSubject<UberToggleState>;
  cadence$: BehaviorSubject<UberToggleState>;
  reward$: BehaviorSubject<UberToggleState>;
  owner$: BehaviorSubject<UberToggleState>;
}


function processFilterTag(f: string, i: (MilestoneRow | PursuitRow)): boolean {
  if (f.startsWith('!')) {
    const actual = f.substr(1);
    return !_processFilterTag(actual, i);
  } else {
    return _processFilterTag(f, i);
  }
}

function _processFilterTag(actual: string, i: (MilestoneRow | PursuitRow)): boolean {
  if (i.searchText.indexOf(actual) >= 0) {
    return true;
  }
}
