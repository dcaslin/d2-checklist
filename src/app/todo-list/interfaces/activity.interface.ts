import { CostReward } from "./vendor.interface";

export interface ActivityRow {
  icon: string;
  detailTitle: string; // ususally the name
  detailSubText: string;
  detailTooltip?: string;
  rewards: CostReward[]; // CostReward might be bounty-specific
  rewardSort: string; // used to sort the rewards column
  charInfo: { [key: string]: ActivityCharInfo }; // key is character ID
  type: ActivityType;
  subType: string; // information like 'Daily' vs 'Weekly' Potentially will be used for filtering/sorting
  hash: number; // this is for debug purposes only
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

// Progress is by character, so that's why it's in this file.
// It's a stretch, I know.
export interface Progress {
  progress?: number; // not really needed if doing single box progress style
  completionValue?: number;
  complete: boolean;
  progressType?: ProgressType;
  style?: ProgressStyle;
  status: ActivityStatus;
}

export enum ProgressType {
  AUTOMATIC = 0, // idk what this even means, from the API
  FRACTION = 1, // 1/3
  CHECKBOX = 2, // boolean, it's either done or it's not
  PERCENTAGE = 3, // 33%
  INTEGER = 6, // 
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
