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

    const altarEpoch = moment.utc([2019, 10, 9, 17, 0]); // nov 9 2019
    console.dir(altarEpoch);
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

    const forgeIndex = numDays % 4;
    // Sat, 11/09: Volundr
    let forgeDay;
    if (forgeIndex == 0) { // 1506080581 4185095559
      forgeDay = {
        name: 'Volundur',
        icon: this.destinyCacheService.cache.InventoryItem[4185095559].displayProperties.icon
      };
    } else if (forgeIndex == 1) { // 957727787 4185095558
      forgeDay = {
        name: 'Gofannon',
        icon: this.destinyCacheService.cache.InventoryItem[4185095558].displayProperties.icon
      };
    } else if (forgeIndex == 2) { // 2656947700 4185095557
      forgeDay = {
        name: 'Izanami',
        icon: this.destinyCacheService.cache.InventoryItem[4185095557].displayProperties.icon
      };
    } else if (forgeIndex == 3) { // 1434072700 4185095556
      forgeDay = {
        name: 'Bergusia',
        icon: this.destinyCacheService.cache.InventoryItem[4185095556].displayProperties.icon
      };
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
      altarOfSorrowsWeapon:  this.destinyCacheService.cache.InventoryItem[altarWeaponKey],
      forge: forgeDay
    };
  }
}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestonesAndActivities;
  altarOfSorrowsWeapon: ItemDisplay;
  forge: ForgeDay;
}

export interface ForgeDay {
  name: string;
  icon: string;
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
