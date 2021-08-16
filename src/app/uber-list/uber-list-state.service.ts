import { Injectable, OnDestroy } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import {
  Character,
  InventoryItem,
  ItemType,
  MileStoneName,
  MilestoneStatus,
  NameQuantity,
  Player,
  PursuitTuple
} from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import {
  generateUberState,
  UberChoice,
  UberToggleConfig,
  UberToggleState
} from './uber-list-toggle/uber-list-toggle.component';

const UBER_FILTER_KEY = 'D2C-UBER-FILTER';
const DEFAULT_SORT_BY = 'name';
const DEFAULT_SORT_DESC = true;

@Injectable({
  providedIn: 'root',
})
export class UberListStateService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();

  public filterKeyUp$: Subject<void> = new Subject();
  public rows$: BehaviorSubject<(MilestoneRow | PursuitRow)[]> = new BehaviorSubject([]);
  public currChar$: BehaviorSubject<Character | null> = new BehaviorSubject(null);
  public filteredRows$: BehaviorSubject<(MilestoneRow | PursuitRow)[]> = new BehaviorSubject([]);
  public allVisibleChecked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public someVisibleChecked$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public checkedRows$: BehaviorSubject<(MilestoneRow | PursuitRow)[]> = new BehaviorSubject([]);
  public checked$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public sort$: BehaviorSubject<UberSort> = new BehaviorSubject({
    by: DEFAULT_SORT_BY,
    desc: DEFAULT_SORT_DESC
  });
  public toggleData: UberToggleData | null = null;
  public toggleDataArray: BehaviorSubject<UberToggleState>[] = [];
  public visibleFilterText = '';
  public filtersDirty$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public filterUpdated$: Subject<void> = new Subject<void>();
  private toggleDataInit = false;
  public orMode = false;
  public filterTags$: BehaviorSubject<string[]> = new BehaviorSubject([]);
  public hideTrials = false;
  public hideComplete = false;
  public hideUnheld = false;

  constructor(
    private signedOnUserService: SignedOnUserService,
    private destinyCacheService: DestinyCacheService,

    private iconService: IconService
  ) {
    this.toggleData = this.buildInitToggles();
    const a: BehaviorSubject<UberToggleState>[] = [];
    const thingsToListenTo$ = [this.rows$, this.filterTags$, this.sort$, this.checked$];
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
        this.currChar$.next(player.characters[0]);
        const rowData: { [key: string]: MilestoneRow | PursuitRow } = {};
        for (const char of player.characters) {
          const vendors = charVendors.find((x) => x?.char?.id == char.id);
          if (vendors) {
            for (const vi of vendors.data) {
              if (vi.type == ItemType.Bounty) {
                // create empty pursuit row
                if (!rowData[vi.hash]) {
                  rowData[vi.hash] = this.buildInitialPursuitRow(vi, 'bounty');
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
              rowData[b.hash] = this.buildInitialPursuitRow(b, 'bounty');
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
          const quests = player.quests.filter(
            (x) => x.owner.getValue().id == char.id
          );
          for (const b of quests) {
            if (!rowData[b.hash]) {
              rowData[b.hash] = this.buildInitialPursuitRow(b, 'quest');
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
          classify(rowData[key]);
          setRewardTier(rowData[key]);
          rows.push(rowData[key]);
        }
        this.rows$.next(rows);
        this.initWithPlayer(player, rows);

        // TODO finish click on item modal
        // fix deadly venatics
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
          const sort = this.sort$.getValue();
          const saveMe = dirty || this.hideTrials || this.hideComplete || this.hideUnheld || sort.by != DEFAULT_SORT_BY || sort.desc != DEFAULT_SORT_DESC || this.checked$.getValue().length > 0;
          // we have no filters, so clear everything in localstorage
          if (!saveMe) {
            localStorage.removeItem(UBER_FILTER_KEY);
          } else {
            const filterSettings: UberFilterSettings = {
              filterText: this.visibleFilterText,
              deselectedChoices: {},
              hideTrials: this.hideTrials,
              hideComplete: this.hideComplete,
              hideUnheld: this.hideUnheld,
              sort: this.sort$.getValue(),
              checked: this.checked$.getValue()
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

  private sortRows(rows: (MilestoneRow | PursuitRow)[]): void {
    const sort = this.sort$.getValue();
    if (sort.by == 'name') {
      rows.sort(sortByActivityName);
    } else if (sort.by == 'icon') {
      rows.sort(sortByIcon);
    } else if (sort.by == 'classification') {
      rows.sort(sortByClassification);
    } else if (sort.by == 'rewards') {
      rows.sort(sortByRewards);
    } else if (sort.by.startsWith('char-')) {
      const characterId = sort.by.substring(5);
      rows.sort(charProgressCompGenerator(characterId));
    }
    if (!sort.desc) {
      rows.reverse();
    }
  }

  private filterAndSortRows() {
    console.log(`Filtering and sorting rows...`);
    let filterMe = this.rows$.getValue().slice(0);
    if (this.hideTrials) {
      filterMe = filterMe.filter(x => x.searchText.indexOf('trials') == -1);
    }
    filterMe = this.wildcardFilter(filterMe);
    filterMe = this.toggleFilter(filterMe);
    this.sortRows(filterMe);
    this.filteredRows$.next(filterMe);
    const checked = this.checked$.getValue();

    const allVisibleChecked = filterMe.every(x => checked.indexOf(x.id) >= 0);
    const someVisibleChecked = filterMe.some(x => checked.indexOf(x.id) >= 0);
    this.allVisibleChecked$.next(allVisibleChecked);
    this.someVisibleChecked$.next(someVisibleChecked && !allVisibleChecked);



    let checkMe = this.rows$.getValue().slice(0);
    checkMe = checkMe.filter(x => checked.indexOf(x.id) >= 0);
    if (this.hideComplete) {
      const currChar = this.currChar$.getValue();
      checkMe = checkMe.filter(x => getProgress(x, currChar.characterId) !== -.2);
    }
    if (this.hideUnheld) {
      const currChar = this.currChar$.getValue();
      // remove missing entries
      checkMe = checkMe.filter(x => x.characterEntries[currChar.characterId] != null);
      // remove vendor only bounties
      checkMe = checkMe.filter(x => !(x.type == 'bounty' && !(x as PursuitRow).characterEntries[currChar.characterId]?.characterItem));
      // remove locked milestones
      checkMe = checkMe.filter(x => !((x.type == 'milestone') && (x as MilestoneRow).characterEntries[currChar.characterId]?.locked));
    }
    this.sortRows(checkMe);
    this.checkedRows$.next(checkMe);
  }

  public bulkCheck(input: boolean) {
    const checked = this.checked$.getValue().slice(0);
    for (const r of this.filteredRows$.getValue()) {
      const present = checked.indexOf(r.id) >= 0;
      if (!input) {
        if (present) {
          checked.splice(checked.indexOf(r.id), 1);
        }
      } else {
        if (!present) {
          checked.push(r.id);
        }
      }
    }
    this.checked$.next(checked);
  }

  public trackUberRow(index, item: (MilestoneRow | PursuitRow)): string {
    return item ? item.id : undefined;
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

  private loadSettings() {
    const sSettings = localStorage.getItem(UBER_FILTER_KEY);
    if (sSettings) {
      const filterSettings: UberFilterSettings = JSON.parse(sSettings);
      this.visibleFilterText = filterSettings.filterText;
      this.hideTrials = filterSettings.hideTrials == true;
      this.hideComplete = filterSettings.hideComplete == true;
      this.hideUnheld = filterSettings.hideUnheld == true;
      if (filterSettings.sort != null && filterSettings.sort.by != null && filterSettings.sort.desc != null) {
        this.sort$.next(filterSettings.sort);
      }
      if (filterSettings.checked != null) {
        this.checked$.next(filterSettings.checked);
      }
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
  }

  private initWithPlayer(player: Player, rows: (MilestoneRow | PursuitRow)[]) {
    if (!this.toggleDataInit && !this.signedOnUserService.playerLoading$.getValue() && !this.signedOnUserService.vendorsLoading$.getValue()) {
      this.generateDynamicChoices(player, rows);
      this.loadSettings();
      this.toggleDataInit = true;
    } else {
      this.loadSettings();
    }
  }

  sort(val: string) {
    const sort = this.sort$.getValue();
    const newSort = {
      ...sort
    };
    if (val == sort.by) {
      newSort.desc = !newSort.desc;
    } else {
      newSort.by = val;
      newSort.desc = true;
    }
    this.sort$.next(newSort);
  }


  private buildInitialPursuitRow(i: InventoryItem, type: 'bounty' | 'quest'): PursuitRow {
    const desc = this.destinyCacheService.cache.InventoryItem[i.hash];
    const label = desc.inventory.stackUniqueLabel as string;
    return {
      id: i.hash,
      type,
      title: i,
      searchText: i.searchText,
      label: label,
      classification: null,
      vendor: null,
      rewardTier: 0,
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
      label: 'milestone',
      classification: null,
      vendor: null,
      desc: desc,
      searchText,
      rewardTier: 0,
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
    for (const toggle$ of this.toggleDataArray) {
      const val = toggle$.getValue();
      const choices = val.choices.slice(0);
      choices.forEach((x) => (x.checked = true));
      toggle$.next(generateUberState(val.config, choices));
    }
  }

  public checkChange(id: string) {
    const checked = this.checked$.getValue().slice(0);
    if (checked.indexOf(id) >= 0) {
      // remove checked from array
      checked.splice(checked.indexOf(id), 1);
    } else {
      checked.push(id);
    }
    this.checked$.next(checked);
  }

  private parseWildcardFilter() {
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
    const typeConfig: UberToggleConfig = {
      title: 'Type',
      debugKey: 'Type',
      icon: this.iconService.fasFlag,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        return state.choices.filter(c => c.checked).map(c => c.matchValue).filter(c => c == x.type).length > 0;
      },
    };
    const checkedConfig: UberToggleConfig = {
      title: 'Checked',
      debugKey: 'Checked',
      icon: this.iconService.fasCheckSquare,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        const isChecked = this.checked$.getValue().indexOf(x.id) >= 0;
        if (selectedVals.indexOf('checked') < 0) {
          if (isChecked) {
            return false;
          }
        }
        if (selectedVals.indexOf('unchecked') < 0) {
          if (!isChecked) {
            return false;
          }
        }
        return true;
      },
    };
    const activityConfig: UberToggleConfig = {
      title: 'Activity',
      debugKey: 'Activity',
      icon: this.iconService.fasHiking,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        if (selectedVals.filter(c => c == x.classification).length > 0) {
          return true;
        }
        return selectedVals.filter(c => x.searchText.indexOf(c.toLowerCase()) >= 0).length > 0;

      },
    };
    const cadenceConfig: UberToggleConfig = {
      title: 'Cadence',
      debugKey: 'Cadence',
      icon: this.iconService.fasCalendarAlt,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        const hasWeekly = selectedVals.includes('weekly');
        // milestones are always weekly
        if (x.type == 'milestone') {
          return hasWeekly;
        }
        const desc = this.destinyCacheService.cache.InventoryItem[x.title.hash];
        const label = desc.inventory.stackUniqueLabel as string;
        if (label.includes('.weekly') // most vendor's weekly bounties have this keyword
          || label.includes('.outlaws')) { // spider's weeklies have the outlaws keyword
          return hasWeekly;
        }
        // it's a daily bounty
        return selectedVals.includes('daily');
      },
    };
    const rewardTierConfig: UberToggleConfig = {
      title: 'Reward Tier',
      debugKey: 'Reward Tier',
      iconClass: 'icon-engram',
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const rewardText = getRewardText(x);
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
        const rewardText = getRewardText(x);
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        return rewardText.filter(reward => selectedVals.includes(reward)).length > 0;
      },
    };
    const ownerConfig: UberToggleConfig = {
      title: 'Owner',
      debugKey: 'Owner',
      icon: this.iconService.fasUsers,
      includeValue: (x: MilestoneRow | PursuitRow, state: UberToggleState) => {
        const selectedVals = state.choices.filter(c => c.checked).map(c => c.matchValue);
        // only bounties have vendors
        if (x.type == 'bounty' || x.type == 'quest') {
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
    const activityChoices = CLASSIFICATIONS.map(x => new UberChoice(x.name, x.name));
    return {
      type$: new BehaviorSubject(
        generateUberState(typeConfig, [
          new UberChoice('bounty', 'Bounty'),
          new UberChoice('milestone', 'Milestone'),
          new UberChoice('quest', 'Quest'),
        ])
      ),
      activity$: new BehaviorSubject(
        generateUberState(activityConfig, activityChoices)
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
          new UberChoice('daily', 'Daily'),
          new UberChoice('weekly', 'Weekly'),
        ])
      ),
      reward$: new BehaviorSubject(
        generateUberState(rewardConfig, [])
      ),
      owner$: new BehaviorSubject(
        generateUberState(ownerConfig, [])
      ),
      checked$: new BehaviorSubject(
        generateUberState(checkedConfig, [
          new UberChoice('checked', 'Checked'),
          new UberChoice('unchecked', 'Unchecked')
        ])
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
    const rewards: Set<string> = new Set();
    for (const x of rows) {
      if (x.type == 'milestone') {
        const m = x as MilestoneRow;
        m.rewards.map(mr => mr.name).forEach(r => rewards.add(r));
      } else if (x.type == 'bounty' || x.type == 'quest') {
        const p = x as PursuitRow;
        p.title.values.map(mr => mr.name).forEach(r => rewards.add(r));
      }
    }
    const aRewards: string[] = [];
    rewards.forEach(r => aRewards.push(r));
    aRewards.sort();
    const customRewards: UberChoice[] = [];
    for (const reward of aRewards) {
      const lowerCase = reward.toLowerCase();
      // if (lowerCase.indexOf('pinnacle') < 0 && lowerCase.indexOf('legendary') < 0 && lowerCase.indexOf('powerful') < 0) {
      customRewards.push(new UberChoice(lowerCase, reward));
      // }
    }

    this.toggleData.reward$.next({
      ...this.toggleData.reward$.getValue(),
      choices: customRewards
    });
  }
}

export interface UberSort {
  by: string;
  desc: boolean;
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
  label: string | null;
  vendor: string | null;
  classification: string | null;
  rewards: NameQuantity[];
  rewardTier: number;
  characterEntries: { [key: string]: MilestoneStatus };
}

export interface PursuitRow {
  id: string;
  type: 'bounty' | 'quest';
  title: InventoryItem;
  searchText: string;
  label: string | null;
  vendor: string | null;
  classification: string | null;
  rewardTier: number;
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
  hideTrials: boolean;
  hideUnheld: boolean;
  hideComplete: boolean;
  sort: UberSort;
  checked: string[];
}

interface UberToggleData {
  type$: BehaviorSubject<UberToggleState>;
  activity$: BehaviorSubject<UberToggleState>;
  rewardTier$: BehaviorSubject<UberToggleState>;
  cadence$: BehaviorSubject<UberToggleState>;
  reward$: BehaviorSubject<UberToggleState>;
  owner$: BehaviorSubject<UberToggleState>;
  checked$: BehaviorSubject<UberToggleState>;
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

function getRewardText(x: (MilestoneRow | PursuitRow)): string[] {
  let rewards: NameQuantity[] = [];
  if (x.type == 'bounty' || x.type == 'quest') {
    const p = x as PursuitRow;
    rewards = p.title.values;
  } else if (x.type == 'milestone') {
    const m = x as MilestoneRow;
    rewards = m.rewards;
  }
  const rewardText = rewards.map(r => r.name.toLowerCase());
  return rewardText;
}

function sortByActivityName(x: (MilestoneRow | PursuitRow), y: (MilestoneRow | PursuitRow)): number {
  const xName = x.title.name.toLowerCase();
  const yName = y.title.name.toLowerCase();
  if (xName < yName) {
    return -1;
  } else if (xName > yName) {
    return 1;
  } else {
    return 0;
  }
}

function sortByIcon(x: (MilestoneRow | PursuitRow), y: (MilestoneRow | PursuitRow)): number {
  const xName = (x as MilestoneRow).desc?.displayProperties?.icon ? (x as MilestoneRow).desc?.displayProperties?.icon : (x as PursuitRow)?.title?.icon;
  const yName = (y as MilestoneRow).desc?.displayProperties?.icon ? (y as MilestoneRow).desc?.displayProperties?.icon : (y as PursuitRow)?.title?.icon;
  if (xName < yName) {
    return -1;
  } else if (xName > yName) {
    return 1;
  } else {
    return 0;
  }
}

function sortByClassification(x: (MilestoneRow | PursuitRow), y: (MilestoneRow | PursuitRow)): number {
  const xName = x.classification ? x.classification : '';
  const yName = y.classification ? y.classification : '';
  if (xName < yName) {
    return -1;
  } else if (xName > yName) {
    return 1;
  } else {
    return 0;
  }
}


function getRewards(x: (MilestoneRow | PursuitRow)): NameQuantity[] {
  let rewards: NameQuantity[] = [];
  if (x.type == 'bounty' || x.type == 'quest') {
    const p = x as PursuitRow;
    rewards = p.title.values;
  } else if (x.type == 'milestone') {
    const m = x as MilestoneRow;
    rewards = m.rewards;
  }
  return rewards;
}

function getRewardTier(x: (MilestoneRow | PursuitRow)): number {
  const rewards = getRewards(x);
  const rewardNames = rewards.map(y => y.name.toLowerCase());
  if (rewardNames.filter(y => y.indexOf('pinnacle') >= 0).length > 0) {
    return -100;
  }
  if (rewardNames.filter(y => y.indexOf('powerful') >= 0).length > 0) {
    return -50;
  }
  if (rewardNames.filter(y => y.indexOf('legendary') >= 0).length > 0) {
    return -10;
  }
  if (rewardNames.length > 0) {
    return -1;
  }
  return 0;
}

function getProgress(x: (MilestoneRow | PursuitRow), characterId: string): number {
  if (x.type == 'bounty' || x.type == 'quest') {
    const p = x as PursuitRow;
    const charEntry = p.characterEntries[characterId];
    if (!charEntry || !charEntry.characterItem) {
      if (charEntry?.vendorItem) {
        return -0.1;
      }
      return -200;
    }
    return charEntry.characterItem.aggProgress;
  } else if (x.type == 'milestone') {
    const m = x as MilestoneRow;
    const charEntry = m.characterEntries[characterId];
    if (!charEntry) {
      return -200;
    }
    if (charEntry.readyToCollect) {
      return 101;
    }
    if (charEntry.locked) {
      return -1000;
    }
    if (charEntry.complete && !charEntry.readyToCollect) {
      return -.2;
    }
    return charEntry.pct * 100;
  }
  return 0;
}

function charProgressCompGenerator(characterId: string) {
  return function (x: (MilestoneRow | PursuitRow), y: (MilestoneRow | PursuitRow)): number {
    const xP = getProgress(x, characterId);
    const yP = getProgress(y, characterId);
    if (xP < yP) {
      return 1;
    } else if (xP > yP) {
      return -1;
    } else {
      return 0;
    }
  };
}

function sortByRewards(x: (MilestoneRow | PursuitRow), y: (MilestoneRow | PursuitRow)): number {
  const xR = x.rewardTier;
  const yR = y.rewardTier;
  if (xR < yR) {
    return -1;
  } else if (xR > yR) {
    return 1;
  } else {
    return sortByActivityName(x, y);
  }
}


interface Classification {
  name: string;
  vendor: string | null;
  milestoneNames: string[];
  bountyLabels: string[];
}

const CLASSIFICATIONS: Classification[] = [
  {
    name: 'Crucible',
    vendor: 'Shaxx',
    milestoneNames: ['crucible', 'live-fire'],
    bountyLabels: ['bounties.crucible']
  },
  {
    name: 'Strikes',
    vendor: 'Zavala',
    milestoneNames: ['vanguard', 'nightfall'],
    bountyLabels: ['bounties.strikes']
  },
  {
    name: 'Gambit',
    vendor: 'Drifter',
    milestoneNames: ['gambit', 'shady schemes'],
    bountyLabels: ['bounties.gambit']
  },
  {
    name: 'Gunsmith',
    vendor: 'Banshee',
    milestoneNames: ['spare parts'],
    bountyLabels: ['bounties.gunsmith']
  },
  {
    name: 'Europa',
    vendor: 'Variks',
    milestoneNames: ['europa'],
    bountyLabels: ['europa.bounties']
  },
  {
    name: 'Splicer',
    vendor: 'Splicer Servitor',
    milestoneNames: ['rewiring', 'digital', 'net crasher'],
    bountyLabels: ['seasons.season14.ritual.bounties']
  },
  {
    name: 'Trials',
    vendor: 'Saint',
    milestoneNames: ['trials'],
    bountyLabels: ['trials.bounties']
  },
  {
    name: 'Unclassified',
    vendor: null,
    milestoneNames: [],
    bountyLabels: []
  }
];

function setRewardTier(x: (MilestoneRow | PursuitRow)): void {
  x.rewardTier = getRewardTier(x);
}

function classify(x: (MilestoneRow | PursuitRow)): void {
  let classified = false;
  x.classification = 'Unclassified';
  x.vendor = null;
  if (x.type == 'bounty') {
    const p = x as PursuitRow;
    if (!p.label) {
      p.classification = null;
      p.vendor = null;
    }
    for (const c of CLASSIFICATIONS) {
      for (const bl of c.bountyLabels) {
        if (p.label.indexOf(bl) >= 0) {
          x.classification = c.name;
          x.vendor = c.vendor;
          classified = true;
          break;
        }
      }
      if (classified) {
        break;
      }
    }
  } else if (x.type == 'quest') {
    const p = x as PursuitRow;
  } else if (x.type == 'milestone') {
    const m = x as MilestoneRow;
    const t = m.title.name.toLowerCase();
    for (const c of CLASSIFICATIONS) {
      for (const mn of c.milestoneNames) {
        if (t.indexOf(mn) >= 0) {
          x.classification = c.name;
          x.vendor = c.vendor;
          classified = true;
          break;
        }
      }
      if (classified) {
        break;
      }
    }
  }
  if (!classified) {
    for (const c of CLASSIFICATIONS) {
      if (x.searchText.indexOf(c.name.toLowerCase()) >= 0) {
        x.classification = c.name;
        x.vendor = c.vendor;
        classified = true;
        break;
      }
    }
  }
  x.searchText += ' ' + x.classification?.toLowerCase() + ' ' + x.vendor?.toLowerCase();
}
