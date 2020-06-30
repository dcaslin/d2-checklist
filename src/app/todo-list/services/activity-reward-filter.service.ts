import { Injectable } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { Destroyable } from '@app/util/destroyable';
import { ReplaySubject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { ActivityRow, CookedReward } from '../interfaces/activity.interface';
import {
  BRIGHT_DUST,
  GLIMMER,
  INFAMY_POINTS,
  LEGENDARY_GEAR,
  PINNACLE_GEAR,
  PINNACLE_GEAR_WEAK,
  POWERFUL_GEAR_1,
  POWERFUL_GEAR_2,
  POWERFUL_GEAR_3,
  RUNES,
  VALOR_POINTS,
  XP,
} from '../interfaces/constants.interface';
import { TogglableItem } from '../interfaces/filter.interface';
import { InventoryItem } from '../interfaces/vendor.interface';
import { ActivityCatalogService } from './activity-catalog.service';
import { ActivityFilterService } from './activity-filter.service';
import { DictionaryService } from './dictionary.service';


/**
 * Responsible for building the filters and then
 * providing those filters as external filters for ag-grid
 */
@Injectable()
export class ActivityRewardFilterService extends Destroyable {

  /**
   * Represents all the possible reward items that are in the table
   */
  public rewards: ReplaySubject<TogglableItem[]> = new ReplaySubject(1);

  // TODO: refactor this so we don't have as many maps. It started small, then blew up
  // and I don't have the concentration to fix it right now.
  // this is part of the refactor effort for this service.
  // the amount of maps here is a nightmare
  // the organization of this service makes me want to poke my eyes out

  /**
   * the key is the hash of the inventory item (which is also the reward)
   * for example, glimmer is just an inventoryItem
   */
  private rewardsMap: { [key: string]: InventoryItem } = {};
  /**
   * keyed by hash, lets us look up what name is in the table
   * since the rewards in the table don't necessarily have names that match
   * their manifest item (milestone rewards like pinnacle gear (weak))
   */
  private tableRewardNameMap: { [key: string]: string } = {};
  /**
   * This map should hold the current reward filter state.
   * This is to help us parse through the updated filters faster.
   * Being able to check filter pass state is extremely important to optimize.
   * Slow table filtering is a bad experience.
   */
  private mapRewardByName: { [key: string]: TogglableItem } = {};

  constructor(
    private actvityCatalog: ActivityCatalogService,
    private storage: StorageService,
    private filterService: ActivityFilterService,
    private dictionary: DictionaryService
  ) {
    super();
    this.actvityCatalog.activityRows.pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    ).subscribe((rows: ActivityRow[]) => {
      // I originally started chaining methods like this, but I actually ended up hating it
      // I prefer the approach taken in the activity-type-filter.service
      // If I do more work in this file, I'll look into re-working this flow.
      this.extractRewards(rows);
      let inventoryItems = this.sortRewards(Object.values(this.rewardsMap));
      inventoryItems = this.filterDuplicates(inventoryItems);
      let togglableItems = this.applyFilterSettings(inventoryItems);
      this.buildRewardNameMap(togglableItems);
      this.rewards.next(togglableItems);
      this.pushUpdatesToTable(); // apply filters initially when loaded
      console.log('rewardsMap', this.rewardsMap);
      console.log('togglable items (sent to filter component)', togglableItems);
      console.log('tableRewardNameMap', this.tableRewardNameMap);
      console.log('mapRewardByName', this.mapRewardByName);
    });

    // register filter method with the main filter service
    this.filterService.filterFunctions.push((row) => this.doesRowPassRewardFilters(row));
    this.filterService.saveSettingsFunctions.push(() => this.saveRewardFilters());
  }

  /**
   * Apply updates to the table.
   * Call this when you want the filters to take effect.
   */
  public pushUpdatesToTable() {
    const filtering = Object.values(this.mapRewardByName)
      .some(reward => reward.d2cActive === false);
    this.filterService.updateFilterStatus(filtering);
    this.filterService.pushUpdatesToTable();
  }

  /**
   * Does the row pass the active rewards filters?
   */
  private doesRowPassRewardFilters(row: ActivityRow): boolean {
    for (const reward of row.rewards) {
      if (!this.mapRewardByName[reward.name]) {
        console.log('couldn\'t find filter for', reward.name)
      }
      if (this.mapRewardByName[reward.name].d2cActive) {
        return true;
      }
    }
    return false;
  }

  /**
   * Populate the list of unique rewards offered by all the activities
   */
  private extractRewards(rows: ActivityRow[]) {
    this.rewardsMap = {};
    this.tableRewardNameMap = {};
    rows.forEach((row: ActivityRow) => {
      row.rewards.forEach((reward: CookedReward) => {
        const manifestItem = this.dictionary.findItem(reward.hash);
        this.tableRewardNameMap[reward.hash] = reward.name;
        if (manifestItem) {
          // Do this to make sure that the name we show in the table
          // matches the name described in the filter tooltip
          manifestItem.displayProperties.name = reward.name;
          this.rewardsMap[reward.hash] = manifestItem;
        }
      });
    });
  }

  /**
   * Sort the rewards so they aren't in a random order.
   * Want gear to be first, but after that order doesn't matter as much.
   */
  private sortRewards(rewards: InventoryItem[]): InventoryItem[] {
    return rewards.sort((a, b) => {
      // it really annoyed me that the transparent-background icons were not all grouped
      // and there doesn't seem to be any better sort than itemTypeAndTierDisplayName
      // so, manually place the icons we know about after the armor rewards (which are also clear)
      const transparentIcons = {
        [PINNACLE_GEAR]:      1,
        [PINNACLE_GEAR_WEAK]: 2,
        [POWERFUL_GEAR_3]:    3,
        [POWERFUL_GEAR_2]:    4,
        [POWERFUL_GEAR_1]:    5,
        [LEGENDARY_GEAR]:     6,
        [RUNES]:              7,
        [BRIGHT_DUST]:        8,
        [XP]:                 9,
        [GLIMMER]:            10,
        [INFAMY_POINTS]:      11,
        [VALOR_POINTS]:       12,
      };
      const aTier = transparentIcons[a.hash];
      const bTier = transparentIcons[b.hash];
      if (aTier) {
        if (bTier) { return aTier - bTier; } else { return -1; }
      }
      return a.itemTypeAndTierDisplayName.localeCompare(b.itemTypeAndTierDisplayName);
    });
  }

  /**
   * Some rewards have different hashes but look-up to the same type of reward.
   * (whack, I know, thanks bungie)
   * We could technically do this programmatically, but in the case of legendary gear,
   * there's a legendary engram icon (looks good) and a weird purple helmet icon that
   * both represent legendary gear. We prefer the engram.
   * We want to alway pick which one we want to keep, so as duplicates surface, we can add them
   * to the ignore array.
   */
  private filterDuplicates(rewards: InventoryItem[]): InventoryItem[] {
    const ignore = [
      3407672161, // ugly legendary gear icon
      3085039018, // a duplicate hash for glimmer (no icon difference)
    ];
    return rewards.filter(reward => !ignore.includes(reward.hash))
  }

  /**
   * If the user has stored settings, we want to remember their filters and apply them
   */
  private applyFilterSettings(rewards: InventoryItem[]): TogglableItem[] {
    const output: TogglableItem[] = [];
    let settings: RewardSettings = this.storage.getItem(REWARD_KEY);
    if (!!settings && Object.keys(settings).length === 0) {
      // filter object saved, but there were no active filters. Assume it was a bug
      settings = undefined;
    }
    rewards.forEach((reward: InventoryItem) => {
      output.push({
        ...reward,
        d2cActive: settings ? !!settings[reward.displayProperties.name] : true
      });
    });
    return output;
  }

  private buildRewardNameMap(rewards: TogglableItem[]) {
    rewards.forEach((reward: TogglableItem) => {
      const name = this.tableRewardNameMap[reward.hash];
      // it's important that this map has objects so we can take advantage
      // of mutability. (bad I know, but it's got great performance benefits)
      // if this service starts to blow up in size, maybe we can re-think this approach
      this.mapRewardByName[name] = reward;
    });
  }

  /**
   * Only store active reward filters. Saves a little space.
   * We will store filters by { [rewardName]: true }[]
   * So it would like
   * [
   *  { 'legendary gear': true},
   *  { 'glimmer': true}
   *  ...
   * ]
   */
  private saveRewardFilters() {
    const compressedMap = {};
    Object.values(this.mapRewardByName).forEach(item => {
      if (item.d2cActive) {
        compressedMap[item.displayProperties.name] = true;
      };
    })
    this.storage.setItem(REWARD_KEY, compressedMap);
  }
}

/**
 * keyed by reward name
 */
interface RewardSettings {
  [key: string]: boolean;
}

const REWARD_KEY = 'FILTERS-rewards'
