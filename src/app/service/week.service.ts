import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { ItemDisplay, NameDesc, PublicMilestonesAndActivities } from './model';

@Injectable({
  providedIn: 'root'
})
export class WeekService {


  readonly CURSE_STRENGTH_ROTATION = [
    'Strong',
    'Weak',
    'Medium'
  ];


  readonly ASCENDENT_CHALLENGE_ROTATION = [
    'Ouroborea',
    'Forfeit Shrine',
    'Shattered Ruins',
    'Keep of Honed Edges',
    'Agonarch Abyss',
    'Cimmerian Garrison'
  ];


  readonly ASCENDANT_VIDEOS = [
    'https://www.youtube.com/watch?v=dUGLYlS7K7w',
    'https://www.youtube.com/watch?v=r2tKPUZQkFo',
    'https://www.youtube.com/watch?v=7T7I7qbusIo',
    'https://www.youtube.com/watch?v=vV6oWIgSsgU',
    'https://www.youtube.com/watch?v=ogcNP8CzT0g',
    'https://www.youtube.com/watch?v=l2O9_2Vkgik'
  ];


  readonly ASCENDENT_LOCATION_ROTATION = [
    'Aphelion\'s Rest',
    'Gardens of Esila',
    'Spine of Keres',
    'Harbinger\'s Seclude',
    'Bay of Drowned Wishes',
    'Chamber of Starlight'
  ];

  constructor(private bungieService: BungieService, private destinyCacheService: DestinyCacheService) {
  }

  private static getRotation(cntr: number, list: string[]) {
    const index = cntr % list.length;
    return list[index];
  }

  private getCurrWeek(publicMilestones: PublicMilestonesAndActivities): Week {
    let currWeek: Week;
    if (publicMilestones && publicMilestones.weekStart) {      
      const weekEpoch = moment.utc([2019, 3, 2, 17, 0]); //4/2/2019
      const thisWeek: moment.Moment = publicMilestones.weekStart;
      const numWeeks = Math.floor(moment.duration(thisWeek.diff(weekEpoch)).asWeeks());

      currWeek = {
        ascendantChallenge: WeekService.getRotation(numWeeks, this.ASCENDENT_CHALLENGE_ROTATION),
        ascendantVideo: WeekService.getRotation(numWeeks, this.ASCENDANT_VIDEOS),
        location: WeekService.getRotation(numWeeks, this.ASCENDENT_LOCATION_ROTATION),
        curseStrength: WeekService.getRotation(numWeeks, this.CURSE_STRENGTH_ROTATION),
      };


    }
    return currWeek;
  }

  public async  getToday(): Promise<Today> {

    const altarEpoch = moment.utc([2019, 10, 9, 17, 0]); // nov 9 2019
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
    const currWeek = await this.getCurrWeek(publicMilestones);

    return {
      week: currWeek,
      publicMilestones: publicMilestones,
      altarOfSorrowsWeapon: this.destinyCacheService.cache.InventoryItem[altarWeaponKey]
    };
  }
}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestonesAndActivities;
  altarOfSorrowsWeapon: ItemDisplay;
}


interface WeekData {
  weeks: Week[];
  videos: any;
  epvideos: any;
}

interface Week {
  ascendantChallenge: string;
  ascendantVideo?: string;
  location: string;
  curseStrength: string;
}
