import { Injectable } from '@angular/core';
import { PlayerStateService } from '@app/player/player-state.service';
import { Const, MileStoneName, Player, SelectedUser } from '@app/service/model';
import { from, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
import { ActivityRow, ActivityType, Timespan } from '../interfaces/activity.interface';
import { ManifestMilestone } from '../interfaces/milestone.interface';
import { ContextService } from './context-service';
import { DictionaryService } from './dictionary.service';
import { HttpService } from './http.service';

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
    private http: HttpService,
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
      distinctUntilChanged((a, b) =>
        // we really only care about updates to the milestones.
        // The characters also have milestone data, but that _should_
        // be applied at the same time (I'm going to regret this assumption, aren't I)
        isEqual(a.milestoneList, b.milestoneList)
      ),
      takeUntil(this.destroy$)
    ).subscribe((player) => {
      this.extractMilestones(player);
    });
  }

  private extractMilestones(player: Player) {
    const output = [];
    player.milestoneList.forEach((m: MileStoneName) => {
      const milestone = this.transformMilestone(m);
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
  private transformMilestone(m: MileStoneName): any { //TODO don't type this any
    const manifestMilestone = this.dictionary.findMilestone(m.key);
    if (!manifestMilestone) {
      console.log('unknown milestone:', m);
      return;
    }
    const mergedMilestone: ActivityRow = {
      icon: manifestMilestone.displayProperties.icon,
      iconSort: 'temp', // want to make this sortable by activity type?
      iconTooltip: manifestMilestone.displayProperties.name, // TODO make better/less redundant
      timespan: Timespan.WEEKLY,
      detailTitle: manifestMilestone.displayProperties.name,
      detailSubText: m.key, // TODO
      detailTooltip: null, // TODO
      rewards: [], // TODO either change the way rewards are stored (don't store by hash, but store by name) or do a reverse map of string names back to hashes (loses tier data)
      rewardSort: `${m.pl}`,
      charInfo: this.extractCharInfo(m, manifestMilestone),
      type: ActivityType.MILESTONE,
      subType: '', // TODO we might be able to remove this property.
      hash: `${m.key}`,
      originalItem: m
    }
    return mergedMilestone;
  }

  private extractCharInfo(m: MileStoneName, manifest: ManifestMilestone) {
    return {};
  }
}
