import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { ItemDisplay, NameDesc, PublicMilestonesAndActivities, MilestoneActivity } from './model';
import { ParseService } from './parse.service';

@Injectable({
  providedIn: 'root'
})
export class WeekService {

  // perdition->exodus->veles->concealed->bunker->Perdition - legend
  // bunker->Perdition->exodus->veles->concealed  ->bunker - master  (+4 offset)
  // arms->chest->head->boots->arms     - legend
  // boots->arms->chest->head->boots   - master (+3 offset)


  // ls: legend, master
  // perdition,  1070981430     1070981425
  // exodus, 2936791996  2936791995
  // veles, 3094493720, 3094493727
  // concealed, 912873277  912873274
  // bunker, 1648125541    1648125538


  readonly LS_LEGEND_ROTATION = [
    '1070981430',
    '2936791996',
    '3094493720',
    '912873277',
    '1648125541'
  ];

  readonly LS_LEGEND_LOOT = [
    'Arms',
    'Chest',
    'Head',
    'Legs'
  ];

  readonly LS_MASTER_ROTATION = [
    '1648125538',
    '1070981425',
    '2936791995',
    '3094493727',
    '912873274'
  ];

  readonly LS_MASTER_LOOT = [
    'Legs',
    'Arms',
    'Chest',
    'Head'
  ];

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

  constructor(private bungieService: BungieService,
    private destinyCacheService: DestinyCacheService,
    private parseService: ParseService) {
  }

  private static getRotation(cntr: number, list: string[]) {
    const index = cntr % list.length;
    return list[index];
  }

  private getCurrWeek(publicMilestones: PublicMilestonesAndActivities): Week {
    let currWeek: Week;
    if (publicMilestones && publicMilestones.weekStart) {
      const weekEpoch = moment.utc([2019, 3, 2, 17, 0]); // 4/2/2019
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

  private buildLostSectorActivity(activityHash: string, ll: number): MilestoneActivity {
    const desc: any = this.destinyCacheService.cache.Activity[activityHash];
    if (!desc || !desc.displayProperties || !desc.displayProperties.name) {
        return null;
    }
    const modifiers: NameDesc[] = [];
    for (const mod of desc.modifiers) {
      const pushMe: NameDesc = this.parseService.parseModifier(mod.activityModifierHash);
      modifiers.push(pushMe);
    }
    const msa: MilestoneActivity = {
        hash: activityHash,
        name: desc.displayProperties.name,
        desc: '',
        ll,
        tier: 0,
        icon: desc.displayProperties.icon,
        modifiers: modifiers
    };
    return msa;
}

  public async  getToday(): Promise<Today> {

    const altarEpoch = moment.utc([2019, 10, 9, 17, 0]); // nov 9 2019
    const today = moment(moment.now());
    const altarDays = Math.floor(moment.duration(today.diff(altarEpoch)).asDays());
    const alterIndex = altarDays % 3;



    let altarWeaponKey = null;
    if (alterIndex == 0) {
      altarWeaponKey = '3067821200'; // heretic
    } else if (alterIndex == 1) {
      altarWeaponKey = '2782847179'; // blasphemer
    } else if (alterIndex == 2) {
      altarWeaponKey = '2164448701'; // apostate
    }
    const lsEpoch = moment.utc([2020, 11, 15, 17, 0]); // Dev 15 2019
    const lsDays = Math.floor(moment.duration(today.diff(lsEpoch)).asDays());
    const lsIndex = lsDays % 5;
    const lsLootIndex = lsDays % 4;
    const legendLoot = this.LS_LEGEND_LOOT[lsLootIndex];
    const masterLoot = this.LS_MASTER_LOOT[lsLootIndex];
    const publicMilestones = await this.bungieService.getPublicMilestones();
    const currWeek = await this.getCurrWeek(publicMilestones);

    const legendActivity = this.buildLostSectorActivity(this.LS_LEGEND_ROTATION[lsIndex], 1250);
    const masterActivity = this.buildLostSectorActivity(this.LS_MASTER_ROTATION[lsIndex], 1280);

    const recordDescForIcon: any = this.destinyCacheService.cache.Record[3838089785];
    return {
      week: currWeek,
      publicMilestones: publicMilestones,
      altarOfSorrowsWeapon: this.destinyCacheService.cache.InventoryItem[altarWeaponKey],
      legendaryLostSector: {
        icon: recordDescForIcon.displayProperties.icon,
        activity: legendActivity,
        soloReward: legendLoot,
        special: legendLoot == 'Head' || legendLoot == 'Arms'
      },
      masterLostSector: {
        icon: recordDescForIcon.displayProperties.icon,
        activity: masterActivity,
        soloReward: masterLoot,
        special: masterLoot == 'Head' || masterLoot == 'Arms'
      },
    };
  }
}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestonesAndActivities;
  altarOfSorrowsWeapon: ItemDisplay;
  legendaryLostSector: LostSector;
  masterLostSector: LostSector;

}

interface LostSector {
  activity: MilestoneActivity;
  icon: string;
  soloReward: string;
  special: boolean;
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
