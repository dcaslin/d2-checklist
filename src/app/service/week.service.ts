import { Injectable } from '@angular/core';
import { add, differenceInDays, differenceInWeeks, parseISO, subHours } from 'date-fns';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { ItemDisplay, LegendLostSectorActivity, LostSector, LostSectorInfo, NameDesc, PublicMilestonesAndActivities } from './model';
import { ParseService } from './parse.service';

@Injectable({
  providedIn: 'root'
})
export class WeekService {


  // https://docs.google.com/spreadsheets/d/1f_t8xy_uTT1hYZgGLDpfvW7NEhAuVb6rRV8ooScVh6Y/edit#gid=0

  readonly LS_MASTER_ROTATION: LostSectorInfo[] = [
    {
      abbrev: 'K1 Revelation',
      hash: '3911969238',
      shields: ['Arc Knight'],
      champions: [
        {
          name: 'Barrier Knight',
          count: 7
        },
        {
          name: 'Unstoppable Ogre',
          count: 3
        },
      ]
    },
    {
      abbrev: 'Concealed Void',
      hash: '912873274',
      shields: ['Solar Shank', 'Void Servitor'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 3
        },
        {
          name: 'Overload Captain',
          count: 5
        }]
    },
    {
      abbrev: 'Bunker',
      hash: '1648125538',
      shields: ['Void Minotaurs'],
      champions: [
        {
          name: 'Barrier Hobgoblin',
          count: 2
        },
        {
          name: 'Overload Captain',
          count: 3
        },
        {
          name: 'Overload Minotaur',
          count: 3
        }
      ]
    },
    {
      abbrev: 'Perdition',
      hash: '1070981425',
      shields: ['Arc Harpies', 'Void Minotaurs'],
      champions: [
        {
          name: 'Barrier Hobgoblin',
          count: 2
        },
        {
          name: 'Overload Minotaur',
          count: 3
        },
      ]
    },
    {
      abbrev: 'Exodus Garden',
      hash: '2936791995',
      shields: ['Void Servitors'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 3
        },
        {
          name: 'Overload Captain',
          count: 1
        }
      ]
    },
    {
      abbrev: 'Veles Labyrinth',
      hash: '3094493727',
      shields: ['Solar Wizards'],
      champions: [
        {
          name: 'Barrier Knight',
          count: 2
        },
        {
          name: 'Unstoppable Ogre',
          count: 4
        }
      ]
    },
    {
      abbrev: 'K1 Log',
      hash: '567131519',
      shields: ['Arc Captain', 'Solar Shank'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 4
        },
        {
          name: 'Overload Captain',
          count: 6
        },
      ]
    },
    {
      abbrev: 'K1 communion',
      hash: '2829206720',
      shields: ['Solar Shanks'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 5
        },
        {
          name: 'Overload Captain',
          count: 6
        },
      ]
    },
    {
      abbrev: 'K1 Crew',
      hash: '184186578',
      shields: ['Solar Shanks'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 4
        },
        {
          name: 'Overload Captain',
          count: 6
        },
      ]
    },
  ];

  readonly LS_LEGEND_ROTATION: LostSectorInfo[] = [
    {
      abbrev: 'Concealed Void',
      hash: '912873277',
      shields: ['Arc Captain', 'Solar Shank', 'Void Servitor'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 2
        },
        {
          name: 'Overload Captain',
          count: 3
        },
      ]
    },
    {
      abbrev: 'Bunker',
      hash: '1648125541',
      shields: ['Void Minotaur'],
      champions: [
        {
          name: 'Barrier Hobgoblin',
          count: 1
        },
        {
          name: 'Overload Captain',
          count: 1
        },
        {
          name: 'Overload Minotaur',
          count: 3
        },
      ]
    },
    {
      abbrev: 'Perdition',
      hash: '1070981430',
      shields: ['Arc Harpies', 'Void Minotaurs'],
      champions: [
        {
          name: 'Barrier Hobgoblin',
          count: 1
        },
        {
          name: 'Overload Minotaur',
          count: 2
        }
      ]
    },
    {
      abbrev: 'Exodus Garden',
      hash: '2936791996',
      shields: ['Void Servitors'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 2
        },
        {
          name: 'Overload Captain',
          count: 2
        },
      ]
    },
    {
      abbrev: 'Veles Labyrinth',
      hash: '3094493720',
      shields: ['Arc Knights', 'Solar Wizards'],
      champions: [
        {
          name: 'Barrier Knight',
          count: 3
        },
        {
          name: 'Unstoppable Ogre',
          count: 1
        }
      ]
    },
    {
      abbrev: 'K1 Log',
      hash: '567131512',
      shields: ['Arc Captain', 'Solar Shanks'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 3
        },
        {
          name: 'Overload Captain',
          count: 3
        },
      ]
    },
    {
      abbrev: 'K1 communion',
      hash: '2829206727',
      shields: ['Void Servitors', 'Solar Shanks'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 3
        },
        {
          name: 'Overload Captain',
          count: 2
        },
      ]
    },
    {
      abbrev: 'K1 Crew',
      hash: '184186581',
      shields: ['Solar Shanks'],
      champions: [
        {
          name: 'Barrier Servitor',
          count: 3
        },
        {
          name: 'Overload Captain',
          count: 2
        },
      ]
    },
    {
      abbrev: 'K1 Revelation',
      hash: '3911969233',
      shields: ['Arc Knights'],
      champions: [
        {
          name: 'Barrier Knight',
          count: 3
        },
        {
          name: 'Unstoppable Ogre',
          count: 3
        },
      ]
    },
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
  public static getSplicerWeek(): number {
    const seasonEpoch = parseISO('2021-05-11T17:00:00Z'); // update me
    const numWeeks = differenceInWeeks(new Date(), seasonEpoch);
    return numWeeks + 1;
  }

  private getCurrWeek(publicMilestones: PublicMilestonesAndActivities): Week {
    let currWeek: Week;
    if (publicMilestones && publicMilestones.weekStart) {
      const weekEpoch = parseISO('2019-04-02T17:00:00.000Z'); // 4/2/2019
      const thisWeek = publicMilestones.weekStart;
      const numWeeks = differenceInWeeks(thisWeek, weekEpoch);
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

  private buildLostSectorActivity(info: LostSectorInfo, ll: number): LegendLostSectorActivity {
    const desc: any = this.destinyCacheService.cache.Activity[info.hash];
    if (!desc || !desc.displayProperties || !desc.displayProperties.name) {
      return null;
    }
    const modifiers: NameDesc[] = [];
    for (const mod of desc.modifiers) {
      const pushMe: NameDesc = this.parseService.parseModifier(mod.activityModifierHash);
      modifiers.push(pushMe);
    }
    let name = desc.displayProperties.name;
    if (name.endsWith(': Legend')) {
      name = name.substring(0, name.length - ': Legend'.length);
    }
    if (name.endsWith(': Master')) {
      name = name.substring(0, name.length - ': Master'.length);
    }
    return {
      hash: info.hash,
      name: name,
      desc: '',
      ll,
      tier: 0,
      icon: desc.displayProperties.icon,
      modifiers: modifiers,
      info: info
    };
  }

  public getLostSectors(delta?: number): LostSectors {
    let referenceDate = new Date();
    if (delta) {
      referenceDate = add(referenceDate, { days: delta});
    }


    // let's pretend this is in UTC, so right now it's 1AM Tuesday UTC
    // in game that means it's "Monday" b/c it's < 5PM on that day
    if (referenceDate.getUTCHours() < 17) {
      // console.log(`Prior to reset ${referenceDate.getHours()}`);
      referenceDate = subHours(referenceDate,  24);
    }
    // set our reference time to 5PM UTC arbitrarily so we're consistent
    referenceDate.setUTCHours(17);
    const lsEpoch = parseISO('2020-12-15T17:00:00.000Z'); // Dec 15 2020
    const lsDays = differenceInDays(referenceDate, lsEpoch);
    const lsIndex = lsDays % this.LS_LEGEND_ROTATION.length;
    const lsLootIndex = lsDays % this.LS_LEGEND_LOOT.length;
    const legendLoot = this.LS_LEGEND_LOOT[lsLootIndex];
    const masterLoot = this.LS_MASTER_LOOT[lsLootIndex];
    const legendActivity = this.buildLostSectorActivity(this.LS_LEGEND_ROTATION[lsIndex], 1300);
    const masterActivity = this.buildLostSectorActivity(this.LS_MASTER_ROTATION[lsIndex], 1330);

    const recordDescForIcon: any = this.destinyCacheService.cache.Record[3838089785];
    return {
      day: referenceDate.toISOString(),
      legendaryLostSector: {
        icon: recordDescForIcon.displayProperties.icon,
        activity: legendActivity,
        soloReward: legendLoot,
        special: legendLoot == 'Head' || legendLoot == 'Arms' || legendLoot == 'Chest'
      },
      masterLostSector: {
        icon: recordDescForIcon.displayProperties.icon,
        activity: masterActivity,
        soloReward: masterLoot,
        special: masterLoot == 'Head' || masterLoot == 'Arms' || masterLoot == 'Chest'
      }
    };
  }

  public async getToday(): Promise<Today> {

    const altarEpoch = parseISO('2019-11-09T17:00:00.000Z'); // nov 9 2019
    const today = new Date();
    const altarDays = differenceInDays(today, altarEpoch);
    const alterIndex = altarDays % 3;

    let altarWeaponKey = null;
    if (alterIndex == 0) {
      altarWeaponKey = '3067821200'; // heretic
    } else if (alterIndex == 1) {
      altarWeaponKey = '2782847179'; // blasphemer
    } else if (alterIndex == 2) {
      altarWeaponKey = '2164448701'; // apostate
    }
    const publicMilestones = await this.bungieService.getPublicMilestones();
    const currWeek = await this.getCurrWeek(publicMilestones);
    const lostSectors = this.getLostSectors();

    return {
      week: currWeek,
      publicMilestones: publicMilestones,
      altarOfSorrowsWeapon: this.destinyCacheService.cache.InventoryItem[altarWeaponKey],
      lostSectors: lostSectors
    };
  }
}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestonesAndActivities;
  altarOfSorrowsWeapon: ItemDisplay;
  lostSectors: LostSectors;
}

export interface LostSectors {
  day: string;
  legendaryLostSector: LostSector;
  masterLostSector: LostSector;
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
