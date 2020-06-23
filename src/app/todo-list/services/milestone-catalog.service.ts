import { Injectable } from '@angular/core';
import { SelectedUser } from '@app/service/model';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
import { API_ROOT } from '../constants/constants';
import { ApiResponse } from '../interfaces/api.interface';
import {
  CharacterProgressions,
  ManifestMilestone,
  Milestone,
  MilestoneApiData,
  MilestoneCharInfo,
  MilestoneResponse,
  MilestoneSet,
  MilestoneType,
} from '../interfaces/milestone.interface';
import { ContextService } from './context-service';
import { DictionaryService } from './dictionary.service';
import { HttpService } from './http.service';


/**
 * Provides a catalog of bounties
 */
@Injectable()
export class MilestoneCatalogService extends Destroyable {

  public milestoneCatalog: BehaviorSubject<Milestone[]> = new BehaviorSubject(null);

  private uniqueMilestones: { [key: string]: Milestone } = {};

  constructor(
    private http: HttpService,
    private context: ContextService,
    private dictionary: DictionaryService
  ) {
    super();
    this.fetchMilestonesForChars();
  }

  private fetchMilestonesForChars() {
    this.context.user.pipe(
      filter((x) => !!x),
      switchMap((user) => this.fetchMilestones(user)),
      takeUntil(this.destroy$)
    ).subscribe((resp: ApiResponse<MilestoneResponse>) => {
      const charProgressions = resp.Response.characterProgressions.data;
      Object.keys(resp.Response.characterProgressions.data).forEach(charId => {
        this.extractMilestones(charProgressions[charId], charId);
      });
      this.milestoneCatalog.next(Object.values(this.uniqueMilestones));
    });
  }

  private fetchMilestones(user: SelectedUser): Observable<ApiResponse<MilestoneResponse>> {
    const options = { params: { components: 'characterProgressions' } };
    const url = `${API_ROOT}/${this.context.userUrlSegment(user)}/`;
    return this.http.get(url, options);
  }

  private extractMilestones(progressions: CharacterProgressions, charId: string) {
    if (!progressions || !charId) { return; }
    // get the sale items map
    const milestones: MilestoneSet = progressions.milestones;

    Object.keys(milestones).forEach((milestoneHash) => { // keyed by milestone hash
      const manifestMilestone: ManifestMilestone = this.dictionary.findMilestone(milestoneHash);
      const charMilestone: MilestoneApiData = milestones[milestoneHash];
      if (manifestMilestone.milestoneType === MilestoneType.WEEKLY) {
        this.addToMilestones(charMilestone, manifestMilestone, charId);
      }
    });
  }

  private addToMilestones(
    charMS: MilestoneApiData,
    manifestMS: ManifestMilestone,
    charId: string,
  ): void {
    let milestone: Milestone = this.uniqueMilestones[manifestMS.hash]
    if (!milestone) {
      // if the milestone doesn't exist, create that bitch
      milestone = {
        ...manifestMS,
        startDate: charMS.startDate,
        endDate: charMS.endDate,
        chars: {}
      }
      this.uniqueMilestones[manifestMS.hash] = milestone;
    }
    // then add the character specific data to the milestone
    milestone.chars[charId] = this.getMilestoneCharInfo(charMS, manifestMS);
  }

  private getMilestoneCharInfo(
    charMS: MilestoneApiData,
    manifestMS: ManifestMilestone
  ): MilestoneCharInfo {
    return null;
  }
}
