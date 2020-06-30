import { Injectable } from '@angular/core';
import { Destroyable } from '@app/util/destroyable';
import { combineLatest, ReplaySubject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import {
  ActivityCharInfo,
  ActivityRow,
  ActivityStatus,
  ActivityType,
  CookedReward,
  ProgressStyle,
  ProgressType,
  Timespan,
} from '../interfaces/activity.interface';
import { Character } from '../interfaces/player.interface';
import { Bounty, BountyCharInfo, CostReward, InventoryItem, SaleStatus } from '../interfaces/vendor.interface';
import { BountyCatalogService } from './bounty-catalog.service';
import { ContextService } from './context-service';
import { DictionaryService } from './dictionary.service';
import { MilestoneCatalogService } from './milestone-catalog.service';



/**
 * The service that drives the todo-list page.
 * The rows shown in the todo table will ultimately be drawn from this service.
 *
 * This service serves as the last step for cleaning any row data.
 * It's preferable to clean the data earlier rather than later, so in the future
 * I might want to come back to the bountyCatalog and milestoneCatalog services
 * and do some more data cleaning there.
 */
@Injectable()
export class ActivityCatalogService extends Destroyable {

  public activityRows: ReplaySubject<ActivityRow[]> = new ReplaySubject(1);

  constructor(
    private bountyService: BountyCatalogService,
    private milestoneService: MilestoneCatalogService,
    private dictionary: DictionaryService,
    private context: ContextService
  ) {
    super();
    this.initRows();
  }

  private initRows() {
    combineLatest([
      this.bountyService.bountyCatalog,
      // of([]), // TODO don't ship
      this.milestoneService.milestoneCatalog
    ]).pipe(
      filter(([bounties, milestones]) => !!bounties && !!milestones),
      takeUntil(this.destroy$)
    ).subscribe(([bounties, milestones]) => {
      // milestones are converted to activityRows in the milestone service.
      let genericRows = this.convertToRowModel(bounties);
      genericRows = [...genericRows, ...milestones];
      console.log('Generic Rows:', genericRows);
      // console.log('milestones:', milestones);
      // this.activityRows.next(milestones);
      this.activityRows.next(genericRows);
    });
  }

  /**
   * As much as possible we want to finish parsing the bounty/milestone
   * objects and put them into generic terms that make sense in the context of the table.
   * It's not important to preserve non-presentational data, with the exception of a few
   * things that helps the table function like sort-strings.
   * 
   * Any column that just displays text should be able to pull the text from the presentational objects
   * that we make here. If a renderer needs to display something more complex like an icon
   * or a progress bar, then the info for that should be included in the ActivityRow object
   */
  private convertToRowModel(b: Bounty[]): ActivityRow[] {
    const output: ActivityRow[] = [];
    b.forEach((bounty: Bounty) => {
      output.push(this.convertBounty(bounty));
    });
    return output;
  }

  /**
   * BOUNTY FUNCTIONS
   * ================
   */

  private convertBounty(b: Bounty): ActivityRow {
    // If we're parsing bounties, it's safe to assume that the characters
    // will be initialized
    const chars = this.context.currentCharacters;
    const row: ActivityRow = {
      icon: b.displayProperties.icon,
      iconSort: this.bountyVendorSortText(b),
      iconTooltip: b.vendorName || NO_VENDOR_TEXT,
      timespan: this.getBountyTimespan(b),
      detailTitle: b.displayProperties.name,
      detailSubText: b.itemTypeDisplayName,
      detailTooltip: b.displayProperties.description,
      rewards: this.cookRewards(b.value.itemValue),
      rewardSort: '',
      charInfo: {},
      type: ActivityType.BOUNTY,
      subType: b.itemTypeDisplayName,
      hash: b.hash,
      originalItem: b,
    };
    chars.forEach(char => {
      row.charInfo[char.characterId] = this.extractBountyCharInfo(b, char);
    });
    return row;
  }

  private cookRewards(rewards: CostReward[]): CookedReward[] {
    const output: CookedReward[] = [];
    rewards.forEach(reward => {
      const item: InventoryItem = this.dictionary.findItem(reward.itemHash);
      if (!!item) {
        output.push({
          name: item.displayProperties.name,
          icon: item.displayProperties.icon,
          quantity: reward.quantity,
          hash: item.hash,
          description: item.displayProperties.description
        });
      }
    });
    return output;
  }

  private getBountyTimespan(b: Bounty): Timespan {
    const label = b.inventory.stackUniqueLabel;
    return label.includes('.weekly') // most vendor's weekly bounties have this keyword
      || label.includes('.outlaws') // spider's weeklies have the outlaws keyword
      || label.includes('.penumbra') // werner only has weeklies
      ? Timespan.WEEKLY : Timespan.DAILY;
  }

  private bountyVendorSortText(b: Bounty): string {
    // by default, the stackUniqueLabel also has daily/weekly identifiers in it
    // so if we want to be able to sort by the rewards col and not have that
    // be weekly/daily dependent, we need to remove those identifiers
    // we also need to remove the specific bounty info e.g. 'kills', because we don't want that
    // to affect our vendor sort. Since that usually comes after the daily/weekly identifier,
    // we can get rid of all the text past the identifiers
    // stackUniqueLabel looks like 'v400.bounties.destinations.edz.daily.kills'
    return b.inventory.stackUniqueLabel.split('.weekly')[0].split('.daily')[0];
  }

  private extractBountyCharInfo(b: Bounty, c: Character): ActivityCharInfo {
    const bci = b.chars[c.characterId] || {} as BountyCharInfo; // bounty char info
    // clean up data if a character doesn't have any info for the bounty
    if (bci.saleStatus === undefined) { bci.saleStatus = SaleStatus.NOT_AVAILABLE }
    const charInfo: ActivityCharInfo = {
      progress: {
        complete: bci.saleStatus === SaleStatus.COMPLETED,
        progressType: ProgressType.PARTIAL_CHECK,
        style: ProgressStyle.SINGLE_BOX,
        status: BOUNTY_STATUSES[bci.saleStatus],
      },
      expirationDate: bci.expirationDate || '',
      subText: BOUNTY_STATUSES[bci.saleStatus] === ActivityStatus.NOT_AVAILABLE ? 'Not Available' : '',
      isMilestone: false
    };
    return charInfo;
  }
}

const BOUNTY_STATUSES = {
  [SaleStatus.AVAILABLE]: ActivityStatus.NOT_STARTED,
  [SaleStatus.COMPLETED]: ActivityStatus.COMPLETE,
  [SaleStatus.NOT_FOR_SALE]: ActivityStatus.NOT_AVAILABLE,
  [SaleStatus.NOT_AVAILABLE]: ActivityStatus.NOT_AVAILABLE,
  [SaleStatus.ALREADY_HELD]: ActivityStatus.IN_PROGRESS
}

const NO_VENDOR_TEXT = 'This bounty is already in your inventory, so it\'s not technically linked to a vendor!'
