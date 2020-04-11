import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Player, ItemType, InventoryStat } from './model';

@Injectable({
  providedIn: 'root'
})
export class PreferredStatService {
  public readonly stats: BehaviorSubject<PreferredStats>;
  public readonly choices: string[];

  constructor() {
    const choices = [];
    choices.push('Mobility');
    choices.push('Resilience');
    choices.push('Recovery');

    choices.push('Discipline');
    choices.push('Intellect');
    choices.push('Strength');
    this.choices = choices;


    const s = localStorage.getItem('preferred-stats');
    let pref = this.buildDefault();
    try {
      if (s != null) {
        pref = JSON.parse(s);
        if (!pref.stats) {
          // handle old settings
          const anyPref = {...pref} as any ;
          pref.stats = this.buildDefault(true).stats;
          let found = false;
          if (anyPref.stat1 && pref.stats[anyPref.stat1] != null) {
            pref.stats[anyPref.stat1] = true;
            found = true;
          }
          if (anyPref.stat2 && pref.stats[anyPref.stat2] != null) {
            pref.stats[anyPref.stat2] = true;
            found = true;
          }
          if (anyPref.stat3 && pref.stats[anyPref.stat3] != null) {
            pref.stats[anyPref.stat3] = true;
            found = true;
          }

          delete (pref as any).stat1;
          delete (pref as any).stat2;
          delete (pref as any).stat3;
          if (!found) {
            pref = this.buildDefault();
          }
          localStorage.setItem('preferred-stats', JSON.stringify(pref));
        }

      }
    } catch (exc) {
      localStorage.removeItem('preferred-stats');
    }
    this.stats = new BehaviorSubject<PreferredStats>(pref);
  }

  private buildDefault(empty?: boolean): PreferredStats {
    const defaults = ['Intellect', 'Recovery', 'Discipline'];
    const stats: { [key: string]: boolean } = {};
    for (const c of this.choices) {
      stats[c] = empty ? false : defaults.indexOf(c) >= 0;
    }
    return {
      stats: stats,
      showAllStats: false
    };
  }

  public update(pref: PreferredStats) {
    const s = JSON.stringify(pref);
    localStorage.setItem('preferred-stats', s);
    this.stats.next(pref);
  }

  public isPreferred(stat: InventoryStat, showAllOverride: boolean): boolean {
    const cur = this.stats.getValue();
    if (!cur) { return false; }

    if (showAllOverride && cur.showAllStats) {
      return true;
    }
    if (cur.stats[stat.name]) {
      return cur.stats[stat.name];
    }
    return false;
  }

  public processGear(player: Player) {
    const items = player.gear;
    for (const i of items) {
      if (i.type !== ItemType.Armor) {
        continue;
      }
      let prefPts = 0;
      for (const stat of i.stats) {
        if (this.isPreferred(stat, false)) {
          prefPts += stat.value;
        }
      }
      i.preferredStatPoints = prefPts;
    }
  }
}

export interface PreferredStats {
  stats: { [key: string]: boolean };
  showAllStats: boolean;
}
