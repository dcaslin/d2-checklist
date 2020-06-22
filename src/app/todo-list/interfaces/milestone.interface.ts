/**
 * Interfaces that mostly make sense of the API response
 */

import { DisplayProperties } from "./api.interface"
import { Progress } from "./activity.interface";

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
  milestoneType: number; // <enum "Weekly" 3>
  friendlyName: string; // "MILESTONE_WEEKLY_STRIKES" (name is better (in displayproperties))
  showInMilestones: boolean; // true
  hasPredictableDates: boolean; // true
  activities?: Activity[];
  hash: number;
  redacted: boolean;
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
