import { Injectable } from '@angular/core';
import { PlayerStateService } from '@app/player/player-state.service';
import { Character, Const, MileStoneName, MilestoneStatus, Player, SelectedUser } from '@app/service/model';
import { from, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
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
import {
  LEGENDARY_GEAR,
  PINNACLE_GEAR,
  PINNACLE_GEAR_WEAK,
  POWERFUL_GEAR_1,
  POWERFUL_GEAR_2,
  POWERFUL_GEAR_3,
} from '../interfaces/constants.interface';
import {
  BANSHEE_ICON,
  CHALICE_ICON,
  CRUCIBLE_WEEKLY_BOUNTIES,
  DRIFTER_ICON,
  GAMBIT_WEEKLY_BOUNTIES,
  GUNSMITH_WEEKLY_BOUNTIES,
  LEGENDARY_GEAR_ICON,
  ManifestMilestone,
  MENAGERIE_HASH,
  Milestone,
  PINNACLE_GEAR_ICON,
  POWERFUL_GEAR_ICON,
  SHAXX_ICON,
  VANGUARD_WEEKLY_BOUNTIES,
  ZAVALA_ICON,
} from '../interfaces/milestone.interface';
import { ContextService } from './context-service';
import { DictionaryService } from './dictionary.service';

var isEqual = require('lodash.isequal');

/**
 * Provides a catalog of bounties
 */
@Injectable()
export class MilestoneCatalogService extends Destroyable {

  /**
   * This pulls the milestonelist off of the player object form the player state service
   */
  public milestoneCatalog: ReplaySubject<ActivityRow[]> = new ReplaySubject(1);

  constructor(
    private context: ContextService,
    private dictionary: DictionaryService,
    private playerService: PlayerStateService
  ) {
    super();
    this.initPlayerMilestones();
    // this.fetchMilestonesForChars();
  }

  private initPlayerMilestones() {
    this.context.user.pipe(
      filter(x => !!x),
      switchMap((user: SelectedUser) => {
        return from(this.playerService.loadPlayer(
          Const.PLATFORMS_DICT[user.userInfo.membershipType],
          user.userInfo.membershipId,
          false));
      }),
      takeUntil(this.destroy$)
    ).subscribe();
    this.playerService.player.pipe(
      filter(x => !!x),
      // distinctUntilChanged((a, b) =>
      //   // we really only care about updates to the milestones.
      //   // The characters also have milestone data, but that _should_
      //   // be applied at the same time (I'm going to regret this assumption, aren't I)
      //   isEqual(a.milestoneList, b.milestoneList)
      // ),
      takeUntil(this.destroy$)
    ).subscribe((player) => {
      this.extractMilestones(player);
    });
  }

  private extractMilestones(player: Player) {
    const output = [];
    player.milestoneList.forEach((m: MileStoneName, i) => {
      const milestone = this.transformMilestone(m, player, i);
      if (milestone) { output.push(milestone); }
    });
    this.milestoneCatalog.next(output);
  }

  /**
   * turns a `MileStoneName` (rest of app) into the `Milestone`.
   * The key difference is that `Milestone` has some more display
   * data in it than `MileStoneName`, and also has character progressions
   * as part of the milestone.
   */
  private transformMilestone(m: MileStoneName, p: Player, index: number): ActivityRow {
    let manifest = this.dictionary.findMilestone(m.key) as any;
    if (!manifest) {
      // this should cover quest steps that are "milestones"
      manifest = this.dictionary.findItem(m.key);
    }
    const mergedMilestone: ActivityRow = {
      icon: this.milestoneIcon(manifest, m),
      iconSort: `_${this.milestoneIcon(manifest, m)}`, // _ in front of the icon gives it top priority. Icon URL is a rough sort
      iconTooltip: manifest?.displayProperties?.name || m.name,
      timespan: Timespan.WEEKLY,
      detailTitle: m.name,
      // detailSubText: `${m.key} [${index}]`, // For debug purposes
      detailSubText: '',
      detailTooltip: m.desc,
      rewards: [this.rewardFromMilestone(m)],
      rewardSort: `${m.boost.sortVal}`,
      charInfo: this.extractCharInfo(m, p, manifest),
      type: ActivityType.MILESTONE,
      subType: '', // TODO we might be able to remove this property.
      hash: `${m.key}`,
      originalItem: m
    }
    return mergedMilestone;
  }

  private milestoneIcon(manifest: Milestone, m: MileStoneName): string {
    return manifest?.displayProperties?.icon || MORE_INFO[m.key]?.icon || ZAVALA_ICON
  }

  private rewardFromMilestone(m: MileStoneName): CookedReward {
    return {
      name: m.rewards,
      ...REWARD_EXTRAS[m.rewards]
    }
  }

  private extractCharInfo(m: MileStoneName, p: Player, manifest: ManifestMilestone): { [key: string]: ActivityCharInfo } {
    const output = {};
    p.characters.forEach((c: Character) => {
      const info: MilestoneStatus = c?.milestones[m.key];
      let progress, completionValue;
      if (info?.suppInfo?.length == 1 && info.suppInfo[0]) {
        [progress, completionValue] = info.suppInfo[0].split('/')?.map(str => str?.trim());
      }
      const charInfo: ActivityCharInfo = {
        progress: {
          progress: Number(progress),
          completionValue: Number(completionValue),
          complete: info?.complete,
          progressType: ProgressType.CHECKBOX,
          style: ProgressStyle.SINGLE_BOX,
          status: this.getStatus(info, m, progress)
        },
        subText: '',
        isMilestone: true,
        originalInfo: info
      }
      output[c.characterId] = charInfo;
    });
    return output;
  }

  private getStatus(charInfo: MilestoneStatus, m: MileStoneName, progress: string): ActivityStatus {
    if (!charInfo || charInfo.locked || charInfo.tooLowPower) {
      return ActivityStatus.NOT_AVAILABLE;
    } else if (charInfo.complete) {
      return ActivityStatus.COMPLETE;
    } else if (Number(progress) > 0) {
      return ActivityStatus.IN_PROGRESS;
    }
    return ActivityStatus.NOT_STARTED;
  }
}

/**
 * Extra information to fill in the gaps or help
 * transform milestone data from the MileStoneName interface
 * to the ActivityRow interface
 */
const MORE_INFO: { [key: string]: Partial<ActivityRow> } = {
  [CRUCIBLE_WEEKLY_BOUNTIES]: { icon: SHAXX_ICON },
  [GUNSMITH_WEEKLY_BOUNTIES]: { icon: BANSHEE_ICON },
  [VANGUARD_WEEKLY_BOUNTIES]: { icon: ZAVALA_ICON },
  [GAMBIT_WEEKLY_BOUNTIES]: { icon: DRIFTER_ICON },
  [MENAGERIE_HASH]: { icon: CHALICE_ICON }
}

const LEGENDARY_INFO: Partial<CookedReward> = {
  icon: LEGENDARY_GEAR_ICON,
  description: 'An engram with complex markers. A Cryptarch should be able to decode this into a piece of powerful equipment.',
  subText: 'Legendary',
  hash: LEGENDARY_GEAR
}

const POWERFUL_INFO: Partial<CookedReward> = {
  icon: POWERFUL_GEAR_ICON,
}

const PINNACLE_INFO: Partial<CookedReward> = {
  icon: PINNACLE_GEAR_ICON,
  hash: PINNACLE_GEAR
}

// the +X info comes from destiny2utils.com
const REWARD_EXTRAS = {
  'Legendary Gear': LEGENDARY_INFO,
  'Powerful Gear (Tier 1)': { ...POWERFUL_INFO, subText: 'Powerful (Tier 1)', hash: POWERFUL_GEAR_1 },
  'Powerful Gear (Tier 2)': { ...POWERFUL_INFO, subText: 'Powerful (Tier 2)', hash: POWERFUL_GEAR_2 },
  'Powerful Gear (Tier 3)': { ...POWERFUL_INFO, subText: 'Powerful (Tier 3)', hash: POWERFUL_GEAR_3 },
  'Pinnacle Gear (Weak)': { ...PINNACLE_INFO, subText: 'Pinnacle (Weak)', hash: PINNACLE_GEAR_WEAK },
  'Pinnacle Gear': { ...PINNACLE_INFO, subText: 'Pinnacle' },
}
