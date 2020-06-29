import { MileStoneName } from '@app/service/model';

import { Bounty, CostReward } from './vendor.interface';

/**
 * Represents "cooked" values for displaying rows in the
 * todo-list table
 */
export interface ActivityRow {
  icon: string;
  iconSort: string; // the icon column will use this to sort
  iconTooltip: string;
  timespan: Timespan;
  detailTitle: string; // ususally the name
  detailSubText: string;
  detailTooltip?: string;
  rewards: CostReward[]; // CostReward might be bounty-specific
  rewardSort: string; // used to sort the rewards column
  charInfo: { [key: string]: ActivityCharInfo }; // key is character ID
  type: ActivityType;
  /**
   * information like 'Daily' vs 'Weekly' Potentially will be used for filtering/sorting
   */
  subType: string;
  hash: number | string; // this is for debug purposes only
  originalItem: Bounty | MileStoneName // debug purposes only
}

export interface ActivityCharInfo {
  progress?: Progress;
  subText?: string; // if this is defined and not '', it will be shown under the progress visual
  expirationDate?: string; // this is the highest priority (over subText)
}

export enum ActivityType {
  MILESTONE = 'Milestone',
  BOUNTY = 'Bounty'
}

export interface Progress {
  /**
   * What is already complete? if the objective is 100 kills and the player has 40,
   * then the progress value is 40.
   * If the objective doesn't have traditional progress i.e. completing a lost sector,
   * then the progress value will be 0 until it is completed, which would then make it 1.
   */
  progress?: number;
  /**
   * Tf the objective is 100 kills and the player has 40,
   * then the completionValue is 100
   */
  completionValue?: number;
  /**
   * true or false. Can help if for some reason progress/completion don't match.
   * This should be the real source of truth for if an activity is done.
   * I might remove this in favor of referring to activityStatus instead
   */
  complete: boolean;
  /**
   * How should progress and/or partial progress be represented in number form
   */
  progressType?: ProgressType;
  /**
   * How visually to represent progress
   */
  style?: ProgressStyle;
  /**
   * a more in-depth value than just yes or no for completion status
   */
  status: ActivityStatus;
}

export enum ProgressType {
  AUTOMATIC = 0, // idk what this even means, from the API
  FRACTION = 1, // 1/3
  CHECKBOX = 2, // boolean, it's either done or it's not
  PERCENTAGE = 3, // 33%
  INTEGER = 6, // this seems like a hack bungie uses to display high scores or totals
  PARTIAL_CHECK = 7 // whether a partial checkbox can be used
}

export enum ProgressStyle {
  SINGLE_BOX = 0, // one checkbox that can show multiple states. unchecked, checked, partial, and disabled
  MULTI_BOX = 1, // will show as many checkboxes as there are `completionValue`'s. No partially checked states.
  BAR = 2 // TODO add support for bar progress (would look like in-game progress bars)
}

/**
 * A more general status than progress towards completion
 * Especially helpful for bounties, which can be `IN_PROGRESS`, but still
 * have a `PROGRESS` value of 0, which would seem like `NOT_STARTED` if you
 * saw that out of context. So in this case `IN_PROGRESS` for a bounty means
 * it has been picked up.
 * 
 * Sorting: Order when sorted
 * in_progress
 * not_started
 * complete
 * not_available
 */
export enum ActivityStatus {
  NOT_STARTED = 2,
  IN_PROGRESS = 1,
  COMPLETE = 3,
  NOT_AVAILABLE = 4,
}

export enum Timespan {
  WEEKLY = 'Weekly',
  DAILY = 'Daily'
}
