import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClassAllowed, InventoryItem, InventoryStat, ItemType, Player } from './model';

export const OLD_PREF_STATS_KEY = 'preferred-armor-stats';
const PREF_STATS_KEY = 'd2c-preferred-armor-stats';

@Injectable({
  providedIn: 'root'
})
export class PreferredStatService {
  public readonly stats$: BehaviorSubject<DetailedPreferredStats>;
  public readonly choices: string[];

  constructor(
  ) {
    const choices = [];
    choices.push('Weapons');
    choices.push('Health');
    choices.push('Class');

    choices.push('Grenade');
    choices.push('Super');
    choices.push('Melee');
    this.choices = choices;
    const s = localStorage.getItem(PREF_STATS_KEY);
    let pref = this.buildDefault();
    try {
      if (s != null) {
        const rawPref = JSON.parse(s);
        if (rawPref) {
          pref.showAllStats = rawPref.showAllStats;
          pref = rawPref;
          if (rawPref.stats) {
            this.mapStats(rawPref.stats.Hunter, pref.stats.Hunter)
            this.mapStats(rawPref.stats.Warlock, pref.stats.Warlock)
            this.mapStats(rawPref.stats.Titan, pref.stats.Titan)
          }
        }
      }
    } catch (exc) {
      localStorage.removeItem(PREF_STATS_KEY);
    }
    this.stats$ = new BehaviorSubject<DetailedPreferredStats>(pref);
  }

  private mapStats(rawClassStats: any, targetStats: ClassStatPref) {
    if (!rawClassStats) {
      return
    }
    targetStats.Weapons = this.getNormalizedValue(rawClassStats.Weapons, rawClassStats.Mobility)
    targetStats.Health = this.getNormalizedValue(rawClassStats.Health, rawClassStats.Resilience)
    targetStats.Class = this.getNormalizedValue(rawClassStats.Class, rawClassStats.Recovery)
    targetStats.Grenade = this.getNormalizedValue(rawClassStats.Grenade, rawClassStats.Grenade)
    targetStats.Super = this.getNormalizedValue(rawClassStats.Super, rawClassStats.Intellect)
    targetStats.Melee = this.getNormalizedValue(rawClassStats.Melee, rawClassStats.Strength)

  }
  
  private getNormalizedValue(proper: any, legacy: any): number {
    if (proper!=null) {
      return +proper;
    }
    if (legacy!=null) {
      return +legacy;
    }
    return 0;
  }


  private buildDefault(empty?: boolean): DetailedPreferredStats {
    const defaultStats: ClassStatPrefs = {
      Hunter: {
        Weapons: 100,
        Health: 100,
        Class: 50,
        Grenade: 0,
        Super: 0,
        Melee: 0
      },
      Titan: {
        Weapons: 0,
        Health: 100,
        Class: 100,
        Grenade: 50,
        Super: 0,
        Melee: 0
      },
      Warlock: {
        Weapons: 0,
        Health: 100,
        Class: 100,
        Grenade: 50,
        Super: 0,
        Melee: 0
      },
    };
    return {
      stats: defaultStats,
      showAllStats: false
    };
  }

  public update(pref: DetailedPreferredStats) {
    const s = JSON.stringify(pref);
    localStorage.setItem(PREF_STATS_KEY, s);
    this.stats$.next(pref);
  }

  public reset() {
    localStorage.removeItem(PREF_STATS_KEY);
    this.stats$.next(this.buildDefault());
  }

  public getMultiplierForDisplay(stats: DetailedPreferredStats, destinyClass: string, stat: InventoryStat): number {
    if (!destinyClass) {
      return 0;
    }
    if (!stats) {
      return 0;
    }

    // halloween masks
    
    if (!stats.stats[destinyClass]) { 
      return 0;
    }
    if (stats.stats[destinyClass][stat.name] > 0) {
      return stats.stats[destinyClass][stat.name];
    }
    return -1;
  }

  public isPreferred(destinyClass: string, stat: InventoryStat, showAllOverride: boolean): number {
    if (!destinyClass) {
      return 0;
    }
    const cur = this.stats$.getValue();
    if (!cur) { return 0; }
    // halloween masks
    if (!cur.stats[destinyClass]) { return 0;}
    if (cur.stats[destinyClass][stat.name] > 0) {
      return cur.stats[destinyClass][stat.name];
    }
    if (showAllOverride && cur.showAllStats) {
      return -1;
    }
    return 0;
  }

  public processItems(items: InventoryItem[]) {
    for (const i of items) {
      if (i.type !== ItemType.Armor) {
        continue;
      }
      let prefPts = 0;
      for (const stat of i.stats) {
        const prefMult = this.isPreferred(ClassAllowed[i.classAllowed], stat, false);
        if (prefMult > 0) {
          prefPts += (stat.value * prefMult);
        }
      }
      i.preferredStatPoints = prefPts / 100;
    }
  }

  public processGear(player: Player) {
    const items = player.gear;
    this.processItems(items);
  }
}

export interface DetailedPreferredStats {
  // class, stat name, true/false
  stats: ClassStatPrefs;
  showAllStats: boolean;
}

interface ClassStatPrefs {
  Hunter: ClassStatPref;
  Warlock: ClassStatPref;
  Titan: ClassStatPref;
}

interface ClassStatPref {
      Weapons: number;
      Health: number;
      Class: number;
      Grenade: number;
      Super: number;
      Melee: number;
}

