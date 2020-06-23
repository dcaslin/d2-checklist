import { Injectable } from '@angular/core';
import { Destroyable } from '@app/util/destroyable';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import {
  ActivityCharInfo,
  ActivityRow,
  ActivityStatus,
  ActivityType,
  ProgressStyle,
  ProgressType,
} from '../interfaces/activity.interface';
import {
  BANSHEE_ICON,
  CRUCIBLE_WEEKLY_BOUNTIES,
  DRIFTER_ICON,
  GAMBIT_WEEKLY_BOUNTIES,
  GUNSMITH_WEEKLY_BOUNTIES,
  Milestone,
  RewardEntriesKeyed,
  SHAXX_ICON,
  VANGUARD_WEEKLY_BOUNTIES,
  ZAVALA_ICON,
} from '../interfaces/milestone.interface';
import { Character } from '../interfaces/player.interface';
import { Bounty, BountyCharInfo, CostReward, SaleStatus } from '../interfaces/vendor.interface';
import { BountyCatalogService } from './bounty-catalog.service';
import { ContextService } from './context-service';
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

  public activityRows: BehaviorSubject<ActivityRow[]> = new BehaviorSubject(null);

  constructor(
    private bountyService: BountyCatalogService,
    private milestoneService: MilestoneCatalogService,
    // private playerService: PlayerStateService,
    private context: ContextService
  ) {
    super();
    this.initRows();
    // this.playerService.player.subscribe((player) => {
    //   console.log('got player', player); // got player null (output)
    // });
  }

  private initRows() {
    combineLatest([
      this.bountyService.bountyCatalog,
      this.milestoneService.milestoneCatalog
    ]).pipe(
      filter(([bounties, milestones]) => !!bounties && !!milestones),
      takeUntil(this.destroy$)
    ).subscribe(([bounties, milestones]) => {
      const genericRows = this.convertToRowModel(bounties, milestones);
      console.log('Generic Rows:', genericRows);
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
  private convertToRowModel(b: Bounty[], m: Milestone[]): ActivityRow[] {
    const output: ActivityRow[] = [];
    
    m.forEach((milestone: Milestone, index) => {
      output.push(this.convertMilestone(milestone, index));
    });
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
      detailTitle: b.displayProperties.name,
      detailSubText: b.itemTypeDisplayName,
      detailTooltip: b.displayProperties.description,
      rewards: b.value.itemValue,
      rewardSort: this.bountyRewardSortText(b),
      charInfo: { },
      type: ActivityType.BOUNTY,
      subType: b.itemTypeDisplayName,
      hash: b.hash
    };
    chars.forEach(char => {
      row.charInfo[char.characterId] = this.extractBountyCharInfo(b, char);
    });
    return row;
  }

  private bountyRewardSortText(b: Bounty): string {
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
        status: BOUNTY_STATUSES[bci.saleStatus]
      },
      expirationDate: bci.expirationDate || '',
      subText: BOUNTY_STATUSES[bci.saleStatus] === ActivityStatus.NOT_AVAILABLE ? 'Not Available' : ''
    };
    return charInfo;
  }

  /**
   * MILESTONE FUNCTIONS
   * ===================
   */

   // TODO remove index
   private convertMilestone(m: Milestone, index: number) {
    // If we're parsing milestones, it's safe to assume that the characters
    // will be initialized
    const chars = this.context.currentCharacters;
    const row: ActivityRow = {
      icon: this.milestoneIcon(m),
      detailTitle: m.displayProperties.name,
      detailSubText: `${m.hash} [${index}]`, // TODO put something meaningful here
      detailTooltip: m.displayProperties.description,
      rewards: this.milestoneReward(m),
      rewardSort: this.milestoneRewardSortText(m),
      charInfo: { },
      type: ActivityType.BOUNTY,
      subType: '',
      hash: m.hash
    };
    chars.forEach(char => {
      row.charInfo[char.characterId] = this.extractMilestoneCharInfo(m, char);
    });
    return row;
  }

  private milestoneReward(m: Milestone): CostReward[] {
    const output: CostReward[] = [];
    if (m.rewards) {
      const rewards = m.rewards;

      Object.keys(m.rewards).forEach(categoryHash => {
        const keyedRewards: RewardEntriesKeyed = rewards[categoryHash].rewardEntries;

        Object.keys(keyedRewards).forEach(rewardEntryHash => {
          output.push(...keyedRewards[rewardEntryHash].items);
        });
      });
    }
    return output;
  }

  private milestoneRewardSortText(m: Milestone): string {
    return '';
    // return m.inventory.stackUniqueLabel.split('.weekly')[0].split('.daily')[0];
  }

  private milestoneIcon(m: Milestone): string {
    return m.displayProperties.icon || MILESTONE_ICON[m.hash];
  }

  private extractMilestoneCharInfo(m: Milestone, c: Character): any {
    const mci = m.chars[c.characterId] || {} as BountyCharInfo; // bounty char info
    // clean up data if a character doesn't have any info for the bounty
    // if (mci.saleStatus === undefined) { mci.saleStatus = SaleStatus.NOT_AVAILABLE }
    // const charInfo: ActivityCharInfo = {
    //   progress: {
    //     complete: mci.saleStatus === SaleStatus.COMPLETED,
    //     progressType: ProgressType.PARTIAL_CHECK,
    //     style: ProgressStyle.SINGLE_BOX,
    //     status: BOUNTY_STATUSES[mci.saleStatus]
    //   },
    //   expirationDate: mci.expirationDate || '',
    //   subText: BOUNTY_STATUSES[mci.saleStatus] === ActivityStatus.NOT_AVAILABLE ? 'Not Available' : ''
    // };
    // return charInfo;
    return { progress: {} };
  }

}

/**
 * Use this to get an icon if there isn't usually an icon associated with the milestone
 * Keys are the milestone hash
 */
const MILESTONE_ICON = {
  [CRUCIBLE_WEEKLY_BOUNTIES]: SHAXX_ICON,
  [GUNSMITH_WEEKLY_BOUNTIES]: BANSHEE_ICON,
  [VANGUARD_WEEKLY_BOUNTIES]: ZAVALA_ICON,
  [GAMBIT_WEEKLY_BOUNTIES]: DRIFTER_ICON
}

const BOUNTY_STATUSES = {
  [SaleStatus.AVAILABLE]: ActivityStatus.NOT_STARTED,
  [SaleStatus.COMPLETED]: ActivityStatus.COMPLETE,
  [SaleStatus.NOT_FOR_SALE]: ActivityStatus.NOT_AVAILABLE,
  [SaleStatus.NOT_AVAILABLE]: ActivityStatus.NOT_AVAILABLE,
  [SaleStatus.ALREADY_HELD]: ActivityStatus.IN_PROGRESS
}
