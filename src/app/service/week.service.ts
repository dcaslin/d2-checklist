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

  readonly EP_WEAPON_ROTATION = [
    'Sniper Rifle',
    'All weapons',
    'All weapons',
    'Shotgun',
    'SMG'
  ];

  readonly EP_BOSS = [
    'Damkath: The Mask',
    'Naksud: The Famine',
    'Bok Litur: Hunger of Xol',
    'Nur Abath: Crest of Xol',
    'Kathok: Roar of Xol'
  ];

  readonly MENAGERIE_BOSS_ROTATION = [
    'Hasapiko - Minotaur',
    'Arunak - Ogre (Truth quest)',
    'Pagouri - Hydra'
  ];


  readonly EP_VIDEOS = [
    'https://www.youtube.com/watch?v=1DGzF9Z_s9w',
    'https://www.youtube.com/watch?v=7g4So51h1mk',
    'https://www.youtube.com/watch?v=ONRve7CUnAE',
    'https://www.youtube.com/watch?v=0tjlwp3n0BE',
    'https://www.youtube.com/watch?v=nz57z9jgrYU'
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
        escalationProtocolWeapon: WeekService.getRotation(numWeeks, this.EP_WEAPON_ROTATION),
        escalationProtocolBoss: WeekService.getRotation(numWeeks, this.EP_BOSS),
        menagerieBoss: WeekService.getRotation(numWeeks, this.MENAGERIE_BOSS_ROTATION),
        epVideo: WeekService.getRotation(numWeeks, this.EP_VIDEOS)
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
    const currWeek = await this.getCurrWeek(publicMilestones);

    return {
      week: currWeek,
      publicMilestones: publicMilestones,
      altarOfSorrowsWeapon: this.destinyCacheService.cache.InventoryItem[altarWeaponKey],
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
  ascendantChallenge: string;
  ascendantVideo?: string;
  location: string;
  curseStrength: string;
  escalationProtocolWeapon: string;
  escalationProtocolBoss: string;
  menagerieBoss: string;
  epVideo?: string;
}
