import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { ItemDisplay, NameDesc, PublicMilestonesAndActivities } from './model';

@Injectable({
  providedIn: 'root'
})
export class WeekService {
  weeks: WeekData = require('../../assets/weeks.json');

  constructor(private bungieService: BungieService, private destinyCacheService: DestinyCacheService) {
    for (const week of this.weeks.weeks) {
      week.ascendantVideo = this.weeks.videos[week.ascendantChallenge];
      week.epVideo = this.weeks.epvideos[week.escalationProtocolBoss];
    }
  }

  public async  getToday(): Promise<Today> {

    const altarEpoch = moment.utc([2019, 10, 9, 17, 0]);
    const today = moment(moment.now());
    const numDays = Math.floor(moment.duration(today.diff(altarEpoch)).asDays());
    const index = numDays % 3;
    let altarWeaponKey = null;
    if (index == 0) {
      altarWeaponKey = '3067821200'; // heretic
    } else if (index == 1) {
      altarWeaponKey = '2782847179'; // blasphemer
    } else if (index == 2) {
      altarWeaponKey = '2164448701'; // apostate
    }

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
      altarOfSorrowsWeapon:  this.destinyCacheService.cache.InventoryItem[altarWeaponKey]
    };
  }
}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestonesAndActivities;
  altarOfSorrowsWeapon: ItemDisplay;
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
