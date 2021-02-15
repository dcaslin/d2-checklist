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

  readonly LS_MASTER_ROTATION = [
    '567131519', // K1 Log
    '2829206720', // K1 communion
    '184186578', // K1 Crew
    '3911969238', // K1 Revelation
    '912873274', // concealed
    '1648125538', // bunker
    '1070981425', // Perdition
    '2936791995', // exodus
    '3094493727', // veles

  ];

  readonly LS_LEGEND_ROTATION = [

    '2829206727', // K1 communion
    '184186581', // K1 Crew
    '3911969233', // K1 Revelation
    '912873277', // concealed
    '1648125541', // bunker
    '1070981430', // Perdition
    '2936791996', // exodus
    '3094493720', // veles
    '567131512', // K1 Log
  ];

  readonly LS_LEGEND_LOOT = [
    'Arms',
    'Chest',
    'Head',
    'Legs'
  ];



  readonly LS_MASTER_LOOT = [
    'Legs',
    'Arms',
    'Chest',
    'Head'
  ];

  readonly ASCENDENT_INFO: DreamingCityRow[] = [
    {
      curseStrength: 'Strong',
      challenge: 'Ouroborea',
      location: 'Aphelion\'s Rest',
      video: 'https://www.youtube.com/watch?v=xL2S7rjD-HQ'
    },
    {
      curseStrength: 'Weak',
      challenge: 'Forfeit Shrine',
      location: 'Gardens of Esila',
      video: 'https://www.youtube.com/watch?v=OBgPmi6c0T8'
    },
    {
      curseStrength: 'Medium',
      challenge: 'Shattered Ruins',
      location: 'Spine of Keres',
      video: 'https://www.youtube.com/watch?v=8e8fvtkh8kc'
    },
    {
      curseStrength: 'Strong',
      challenge: 'Keep of Honed Edges',
      location: 'Harbinger\'s Seclude',
      video: 'https://www.youtube.com/watch?v=U32rv7T9-ZI'
    },
    {
      curseStrength: 'Weak',
      challenge: 'Agonarch Abyss',
      location: 'Bay of Drowned Wishes',
      video: 'https://www.youtube.com/watch?v=hUz8fIKEPy8'
    },
    {
      curseStrength: 'Medium',
      challenge: 'Cimmerian Garrison',
      location: 'Chamber of Starlight',
      video: 'https://www.youtube.com/watch?v=8XmfC-H-9rs'
    }
  ];

  constructor(private bungieService: BungieService,
    private destinyCacheService: DestinyCacheService,
    private parseService: ParseService) {
  }

  private static getRotation(cntr: number, list: any[]): any {
    const index = cntr % list.length;
    return list[index];
  }

  // the week of the chosen season, so far
  public static getChosenWeek(): number {
    const seasonStart = '2021-02-09T17:00:00Z';
    const numWeeks = Math.floor(moment.duration(moment(moment.now()).diff(seasonStart)).asWeeks());
    return numWeeks + 1;
  }

  private getCurrWeek(publicMilestones: PublicMilestonesAndActivities): Week {
    let currWeek: Week;
    if (publicMilestones && publicMilestones.weekStart) {
      const weekEpoch = moment.utc([2019, 3, 2, 17, 0]); // 4/2/2019
      const thisWeek: moment.Moment = publicMilestones.weekStart;
      const numWeeks = Math.floor(moment.duration(thisWeek.diff(weekEpoch)).asWeeks());


      const ascInfo = WeekService.getRotation(numWeeks, this.ASCENDENT_INFO) as DreamingCityRow;

      currWeek = {
        ascendantChallenge: ascInfo.challenge,
        ascendantVideo: ascInfo.video,
        location: ascInfo.location,
        curseStrength: ascInfo.curseStrength
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
    let name = desc.displayProperties.name;
    if (ll == 1330 && name.endsWith('Legend')) {
      name = name.substring(0, name.length -'Legend'.length) + 'Master';
    }
    const msa: MilestoneActivity = {
        hash: activityHash,
        name: name,
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

    const legendActivity = this.buildLostSectorActivity(this.LS_LEGEND_ROTATION[lsIndex], 1300);
    const masterActivity = this.buildLostSectorActivity(this.LS_MASTER_ROTATION[lsIndex], 1330);

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

interface DreamingCityRow {
  curseStrength: string;
  challenge: string;
  video: string;
  location: string;
}
