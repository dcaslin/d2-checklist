import { Injectable } from '@angular/core';
import { NameDesc, PublicMilestone } from './model';
import { BungieService } from './bungie.service';
import * as moment from 'moment';

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
    const burns = await this.bungieService.getBurns();
    const reckBurns = await this.bungieService.getReckBurns();
    const missions: Mission[] = [];
    const nightfalls: Mission[] = [];
    let flashpoint: string = null;
    let start: string = null;
    if (publicMilestones != null) {
      for (const m of publicMilestones) {
        // daily heroic
        if ('3082135827' === m.hash) {
          for (const a of m.aggActivities) {
            let name = a.activity.name;
            name = name.replace('Daily Heroic Story Mission: ', '');
            const time = this.getMissionLength(a.activity.hash);
            missions.push({
              name: name,
              icon: a.activity.icon,
              hash: a.activity.hash,
              time: time
            });
          }
          missions.sort((a: any, b: any): number => {
            const aV = a.time;
            const bV = b.time;
            if (aV < bV) { return -1; } else if (aV > bV) { return 1; } else { return 0; }
          });
        } else if ('463010297' === m.hash) {
          let name = m.summary;
          name = name.replace('FLASHPOINT: ', '');
          name = name.replace(/\w\S*/g, function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
          flashpoint = name;
          start = m.start;
        } else if ('2853331463' === m.hash) {
          for (const a of m.aggActivities) {
            let name = a.activity.name;
            name = name.replace('Nightfall: ', '');
            nightfalls.push({
              name: name,
              icon: a.activity.icon,
              hash: a.activity.hash,
              time: -1
            });
          }
        }

      }
    }
    let currWeek: Week;
    if (start != null) {
      const mStart = moment(start);
      const target = mStart.format('M/D/YYYY');
      for (const week of this.weeks.weeks) {
        if (week.reset == target) {
          currWeek = week;
        }
      }

    }

    return {
      week: currWeek,
      publicMilestones: publicMilestones,
      burns: burns,
      reckBurns: reckBurns,
      missions: missions,
      nightfalls: nightfalls,
      flashpoint: flashpoint
    };
  }


  private getMissionLength(hash: string): number {
    // Combustion 280 [3271773240], 7
    if (hash == '3271773240') {
      return 7;
    } else if (hash == '129918239') {
      return 7;
    } else if (hash == '1872813880') {
      return 6;
    } else if (hash == '2660895412') {
      return 5;
    } else if (hash == '2962137994') {
      return 15;
    } else if (hash == '271962655') {
      return 6;
    } else if (hash == '1882259272') {
      return 5;
    } else if (hash == '1132291813') {
      return 9;
    } else if (hash == '1906514856') {
      return 9;
    } else if (hash == '4244464899') {
      return 6;
    } else if (hash == '3008658049') {
      return 7;
    } else if (hash == '3205547455') {
      return 5;
    } else if (hash == '1023966646') {
      return 7;
    } else if (hash == '1259766043') {
      return 11;
    } else if (hash == '2146977720') {
      return 13;
    } else if (hash == '1534123682') {
      return 5;
    } else if (hash == '4237009519') {
      return 11;
    } else if (hash == '1513386090') {
      return 15;
    } else if (hash == '589157009') {
      return 12;
    } else if (hash == '1313648352') {
      return 6;
    } else if (hash == '4009655461') {
      return 12;
    } else if (hash == '2772894447') {
      return 7;
    } else if (hash == '4234327344') {
      return 5;
    } else if (hash == '2000185095') {
      return 9;
    } else if (hash == '2568845238') {
      return 6;
    } else if (hash == '1602328239') {
      return 8;
    }
    return 100;
  }
}

export interface Today {
  week: Week;
  publicMilestones: PublicMilestone[];
  burns: NameDesc[];
  reckBurns: NameDesc[];
  missions: Mission[];
  nightfalls: Mission[];
  flashpoint: string;

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

interface Mission {
  name: string;
  icon: string;
  hash: string;
  time: number;
}
