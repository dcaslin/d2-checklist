/**
 * Interfaces that mostly make sense of the API response
 */
import { Progress } from './activity.interface';
import { DisplayProperties } from './api.interface';
import { CostReward } from './vendor.interface';


export interface MilestoneResponse {
  characterProgressions: CharacterProgressionsSet;
}

export interface CharacterProgressionsSet {
  data: { [key: string]: CharacterProgressions }; // the key is a characterId
}

export interface CharacterProgressions {
  checklists: any; // lost sector/adventure/region chest copmpletions
  factions: any;
  milestones: MilestoneSet;
}

export interface MilestoneSet {
  [key: string]: MilestoneApiData;
}

export interface MilestoneApiData {
  startDate: string; // when the milestone started (UTC ISO String)
  order: number;
  milestoneHash: number; // what type of milestone is it?
  endDate: string; // when the milestone expires (UTC ISO String)
  availableQuests?: AvailableQuests; // present on flashpoint
  activities?: Activity[];
  rewards?: any; // seems broken?
}

export interface Activity {
  activityHash: number; // looks up to Scourge of the Past (Activity)
  booleanActivityOptions?: { [key: string]: boolean };
  challenges?: { objective: Objective }[]; // for weekly playlists, this is where progress is
  phases?: Phase[]; // might relate to raid progress?
  modifierHashes?: number[];
}

export interface Phase {
  complete: boolean;
  phaseHash: number;
}

export interface AvailableQuests {
  status: QuestStatus;
  questItemHash: number;
}

export interface QuestStatus {
  completed: boolean;
  questHash: number; // same as the questItemHash above
  redeemed: boolean; // if the reward has been collected??
  started: boolean; // if any progress has been made??
  stepObjectives: Objective[]
}

export interface Objective extends Progress {
  complete: boolean;
  completionValue: number; // 100 represents the total # required to complete
  progress: number; // represents progress towards the total
  visible: boolean;
  activityHash?: number;
  destinationHash?: number; // the name of the location on the planet
}

/**
 * Making sense of manifest data related to milestones
 */

export interface ManifestMilestone {
  displayProperties: DisplayProperties;
  milestoneType: MilestoneType; // <enum "Weekly" 3>
  friendlyName: string; // "MILESTONE_WEEKLY_STRIKES" (name is better (in displayproperties))
  showInMilestones: boolean; // true
  hasPredictableDates: boolean; // true
  activities?: Activity[];
  hash: number;
  redacted: boolean;
  rewards?: { [key: string]: { rewardEntries: RewardEntriesKeyed } }
}

export interface RewardEntriesKeyed {
  [key: string]: RewardEntries
}

export interface RewardEntries {
  displayProperties: DisplayProperties; // this is like objective info
  earnedUnlockHash: number; // 0
  items: CostReward[]; // [{…}]
  redeemedUnlockHash: number; // 0
  rewardEntryHash: number; // 326786556 (same as the key directly under the rewards property)
  rewardEntryIdentifier: string; // "ChallengeSourcedReward"
}

/**
 * Straight from the Bungie API. We pretty much only care about `WEEKLY` (3) milestones
 */
export enum MilestoneType {
  UNKNOWN = 0,
  /**
   * One-time milestones that are specifically oriented toward teaching players about new mechanics and gameplay modes.
   */
  TUTORIAL = 1,
  /**
   * Milestones that, once completed a single time, can never be repeated.
   */
  ONE_TIME = 2,
  /**
   * Milestones that repeat/reset on a weekly basis. They need not all reset on the same day or time, but do need to reset weekly to qualify for this type.
   */
  WEEKLY = 3,
  /**
   * Milestones that repeat or reset on a daily basis.
   */
  DAILY = 4,
  /**
   * Special indicates that the event is not on a daily/weekly cadence, but does occur more than once. For instance, Iron Banner in Destiny 1 or the Dawning were examples of what could be termed "Special" events.
   */
  SPECIAL = 5
}

/**
 * This is how we want to represent a milestone in the app
 */
export interface Milestone extends ManifestMilestone {
  startDate: string; // when the milestone started (UTC ISO String)
  endDate: string; // when the milestone expires (UTC ISO String)
  availableQuests?: AvailableQuests; // present on flashpoint
  activities?: Activity[];
  chars: { [key: string]: MilestoneCharInfo; }
}

export interface MilestoneCharInfo {
  available?: boolean;
  progress?: Progress; // TODO: track progress and define a better interface
}

// hopefully hashes don't change
export const CRUCIBLE_WEEKLY_BOUNTIES = 2594202463;
export const GUNSMITH_WEEKLY_BOUNTIES = 3899487295;
export const VANGUARD_WEEKLY_BOUNTIES = 2709491520;
export const GAMBIT_WEEKLY_BOUNTIES = 3802603984;

// these are large transparent icons to match the other milestone icon styles
export const SHAXX_ICON = '/common/destiny2_content/icons/8a7eb56950435db546a4d9422a959391.png';
export const BANSHEE_ICON = '/common/destiny2_content/icons/9b50d3abf88970e3ceb54e508b84c911.png';
export const ZAVALA_ICON = '/common/destiny2_content/icons/8969c17c353d8ea402f7418093569ba2.png';
export const DRIFTER_ICON = '/common/destiny2_content/icons/877b2424e8a52751e5b36fcf80b80f6c.png';
