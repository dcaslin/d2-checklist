import { Injectable } from '@angular/core';
import { BungieService } from './bungie.service';
import { NameDesc, PublicMilestonesAndActivities } from './model';

@Injectable({
  providedIn: 'root'
})
export class WeekService {
  weeks: WeekData = require('../../assets/weeks.json');

  constructor(private bungieService: BungieService) {
    for (const week of this.weeks.weeks) {
      week.ascendantVideo = this.weeks.videos[week.ascendantChallenge];
      week.epVideo = this.weeks.epvideos[week.escalationProtocolBoss];
    }
  }

  public async  getToday(): Promise<Today> {

    const publicMilestones = await this.bungieService.getPublicMilestones();
    let currWeek: Week;
    if (publicMilestones && publicMilestones.weekStart) {
      const target = publicMilestones.weekStart.format('M/D/YYYY');
      for (const week of this.weeks.weeks) {
        if (week.reset == target) {
          currWeek = week;
        }
      }

    }
    return {
      week: currWeek,
      publicMilestones: publicMilestones,
      reckCal: []
    };
  }



}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestonesAndActivities;
  reckCal: ReckDay[];
}

export interface ReckDay {
  day: Date;
  singe: NameDesc;
  good: NameDesc;
  bad: NameDesc;
}

interface WeekData {
  weeks: Week[];
  videos: any;
  epvideos: any;
}

interface Week {
  reset: string;
  ascendantChallenge: string;
  ascendantVideo?: string;
  location: string;
  curseStrength: string;
  escalationProtocolWeapon: string;
  escalationProtocolBoss: string;
  epVideo?: string;
}
