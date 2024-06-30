import { Injectable } from '@angular/core';
import { add, differenceInDays, differenceInHours, differenceInWeeks, parseISO, subHours } from 'date-fns';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { LS_ROTATION } from './lost-sector-reference';
import { ItemDisplay, LegendLostSectorActivity, LostSector, LostSectorInstance, NameDesc, PublicMilestonesAndActivities } from './model';
import { ParseService } from './parse.service';

@Injectable({
  providedIn: 'root'
})
export class WeekService {


  // https://docs.google.com/spreadsheets/d/1f_t8xy_uTT1hYZgGLDpfvW7NEhAuVb6rRV8ooScVh6Y/edit#gid=0

  readonly VOG_CHALLENGES: { [key: string]: RaidChallengeData } = {
    3178242090: {
      hash: 3178242090,
      topic: 'Confluxes',
      desc: 'Don\'t  defeat the Wyverns until they begin sacrificing.',
      video: 'https://www.youtube.com/watch?v=WZR0a2WsjoU&t=79s'
    },
    711293738: {
      hash: 711293738,
      topic: 'Oracles',
      desc: 'Each Guardian can destroy the same Oracle only once.',
      video: 'https://www.youtube.com/watch?v=WZR0a2WsjoU&t=210s'
    },
    435557544: {
      hash: 435557544,
      topic: 'Templar',
      desc: 'Don\'t let the Templar teleport during DPS',
      video: 'https://www.youtube.com/watch?v=WZR0a2WsjoU&t=379s'
    },
    4189771983: {
      hash: 4189771983,
      topic: 'Gatekeepers',
      desc: 'Kill Wyvern and Minotaur simultaneously',
      video: 'https://www.youtube.com/watch?v=WZR0a2WsjoU&t=434s'
    },
    678808956: {
      hash: 678808956,
      topic: 'Atheon',
      desc: '1 Oracle per person during teleport',
      video: 'https://www.youtube.com/watch?v=WZR0a2WsjoU&t=585s'
    }
  };

  readonly VOD_CHALLENGES: { [key: string]: RaidChallengeData } = {
    3374971632: {
      hash: 3374971632,
      topic: 'Acqusition',
      desc: 'Kill all 3 Unstoppables at the same time.',
      video: 'https://www.youtube.com/watch?v=hSAbRouUnE0'
    },
    2009562460: {
      hash: 2009562460,
      topic: 'Caretaker',
      desc: 'TBD',
      video: null
    },
    3434393250: {
      hash: 3434393250,
      topic: 'Exhibition',
      desc: 'TBD',
      video: null
    },
    1988156672: {
      hash: 1988156672,
      topic: 'Rhulk, Disciple of the Witness',
      desc: 'TBD',
      video: null
    }
  };



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
  public static getSeasonWeek(): number {
    const seasonEpoch = parseISO('2024-06-04T17:00:00Z'); // #UPDATEME parseISO('2023-02-28T17:00:00Z'); 
    const numWeeks = differenceInWeeks(new Date(), seasonEpoch);
    return numWeeks + 1;
  }

  private getCurrWeek(publicMilestones: PublicMilestonesAndActivities): Week {
    let currWeek: Week;
    if (publicMilestones && publicMilestones.weekStart) {
      const weekEpoch = parseISO('2021-11-23T17:00:00.000Z'); // 4/2/2019
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

  private async buildLostSectorActivity(info: LostSectorInstance, ll: number): Promise<LegendLostSectorActivity> {
    if (!info) {
      console.log(`No Data for index ${ll}`);
      return null;
    }
    const desc: any = await this.destinyCacheService.getActivity(info.hash);
    if (!desc || !desc.displayProperties || !desc.displayProperties.name) {
      return null;
    }
    const modifiers: NameDesc[] = [];
    for (const mod of desc.modifiers) {
      const pushMe: NameDesc = await this.parseService.parseModifier(mod.activityModifierHash);
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

  public async getLostSectors(delta?: number): Promise<LostSectors> {
    let referenceDate = new Date();
    if (delta) {
      referenceDate = add(referenceDate, { days: delta });
    }
    const magicHour = 17;


    // let's pretend this is in UTC, so right now it's 1AM Tuesday UTC
    // in game that means it's "Monday" b/c it's < 5PM on that day
    if (referenceDate.getUTCHours() < magicHour) {
      // console.log(`Prior to reset ${referenceDate.getHours()}`);
      referenceDate = subHours(referenceDate, 24);
    }
    // set our reference time to 5PM UTC arbitrarily so we're consistent
    referenceDate.setUTCHours(magicHour);
    const lsEpoch = parseISO('2024-06-19T17:00:00.000Z');
    // diff in hours ignores DST
    const lsDays = Math.floor(differenceInHours(referenceDate, lsEpoch) / 24);
    const lsIndex = lsDays % LS_ROTATION.length;
    // const lsLootIndex = lsDays % LS_LOOT.length;
    // const loot = LS_LOOT[lsLootIndex];
    // TODO #UPDATEME
    const legendActivity = await this.buildLostSectorActivity(LS_ROTATION[lsIndex].legend, 1830);
    const masterActivity = await this.buildLostSectorActivity(LS_ROTATION[lsIndex].master, 1840);

    const recordDescForIcon: any = await this.destinyCacheService.getRecord(3838089785);
    return {
      day: referenceDate.toISOString(),
      legendaryLostSector: {
        icon: recordDescForIcon.displayProperties.icon,
        directorLocation: LS_ROTATION[lsIndex].directorLocation,
        activity: legendActivity,
        // soloReward: loot
      },
      masterLostSector: {
        icon: recordDescForIcon.displayProperties.icon,
        directorLocation: LS_ROTATION[lsIndex].directorLocation,
        activity: masterActivity,
        // soloReward: loot
      }
    };
  }

  private getWeeklyDungeon(publicMilestones: PublicMilestonesAndActivities): string {
    const ms = publicMilestones.publicMilestones.find(x => x.weeklyDungeon);
    return ms ? ms.name: null;
  }
  
  private getWeeklyRaid(publicMilestones: PublicMilestonesAndActivities): string {
    const ms = publicMilestones.publicMilestones.find(x => x.weeklyRaid);
    return ms ? ms.name: null;
  }


  private getRaidChallenge(publicMilestones: PublicMilestonesAndActivities): RaidChallenge | null {
    if (publicMilestones?.publicMilestones) {
      // const vogMs = publicMilestones.publicMilestones.find(x => x.hash == '2279677721');
      // if (vogMs?.activities) {
      //   for (const a of vogMs.activities) {
      //     if (a.modifiers) {
      //       for (const mod of a.modifiers) {
      //         const challenge  = this.VOG_CHALLENGES[mod.hash];
      //         if (challenge) {
      //           return {
      //             ...challenge,
      //             name: mod.name
      //           };
      //         }
      //       }
      //     }
      //   }
      // }
      const vodMs = publicMilestones.publicMilestones.find(x => x.hash == '1925223180');
      if (vodMs?.activities) {
        for (const a of vodMs.activities) {
          if (a.modifiers) {
            for (const mod of a.modifiers) {
              const challenge  = this.VOD_CHALLENGES[mod.hash];
              if (challenge) {
                return {
                  ...challenge,
                  name: mod.name
                };
              }
            }
          }
        }
      }
    }
    return null;
  }

  public async getToday(): Promise<Today> {
    const today = new Date();

    const wellEpoch = parseISO('2022-03-06T17:00:00.000Z');
    
    const wellDays = differenceInDays(today, wellEpoch);
    const wellIndex = wellDays % 4;
    let wellWeaponKey = null;
    let wellMode = '';
    if (wellIndex == 0) {
      wellWeaponKey = '927567426'; // Attack AR 927567426
      wellMode = 'Attack';
    } else if (wellIndex == 1) {
      wellWeaponKey = '2721157927'; // Defend, GL
      wellMode = 'Defend';
    } else if (wellIndex == 2) {
      wellWeaponKey = '1399109800'; // Attack Bow
      wellMode = 'Attack';
    } else if (wellIndex == 3) {
      wellWeaponKey = '3865728990'; // Defend SR
      wellMode = 'Defend';
    }

    const altarEpoch = parseISO('2019-11-09T17:00:00.000Z'); 
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
    const lostSectors = await this.getLostSectors();
    const raidChallenge = this.getRaidChallenge(publicMilestones);
    const weeklyDungeon = this.getWeeklyDungeon(publicMilestones);
    const weeklyRaid = this.getWeeklyRaid(publicMilestones);
    return {
      week: currWeek,
      raidChallenge,
      publicMilestones: publicMilestones,
      altarOfSorrowsWeapon: await this.destinyCacheService.getInventoryItem(altarWeaponKey),
      wellMode: `The Wellspring: ${wellMode}`,
      wellWeapon: await this.destinyCacheService.getInventoryItem(wellWeaponKey),
      lostSectors: lostSectors,
      weeklyDungeon, 
      weeklyRaid
    };
  }
}

export interface Today {
  week: Week;
  raidChallenge: RaidChallenge;
  publicMilestones: PublicMilestonesAndActivities;
  altarOfSorrowsWeapon: ItemDisplay;
  lostSectors: LostSectors;
  wellMode: string;
  wellWeapon: ItemDisplay;
  weeklyDungeon: string;
  weeklyRaid: string;
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

interface RaidChallengeData {
  hash: number;
  topic: string;
  desc: string;
  video?: string;
}


interface RaidChallenge {
  hash: number;
  name: string;
  topic: string;
  desc: string;
  video?: string;
}
