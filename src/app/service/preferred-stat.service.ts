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
    choices.push('Mobility');
    choices.push('Resilience');
    choices.push('Recovery');

    choices.push('Discipline');
    choices.push('Intellect');
    choices.push('Strength');
    this.choices = choices;
    const s = localStorage.getItem(PREF_STATS_KEY);
    let pref = this.buildDefault();
    try {
      if (s != null) {
        pref = JSON.parse(s);
      }
    } catch (exc) {
      localStorage.removeItem(PREF_STATS_KEY);
    }
    this.stats$ = new BehaviorSubject<DetailedPreferredStats>(pref);
  }

  private buildDefault(empty?: boolean): DetailedPreferredStats {
    const defaultStats: ClassStatPrefs = {
      Hunter: {
        Mobility: 100,
        Resilience: 100,
        Recovery: 50,
        Discipline: 0,
        Intellect: 0,
        Strength: 0
      },
      Titan: {
        Mobility: 0,
        Resilience: 100,
        Recovery: 100,
        Discipline: 50,
        Intellect: 0,
        Strength: 0
      },
      Warlock: {
        Mobility: 0,
        Resilience: 100,
        Recovery: 100,
        Discipline: 50,
        Intellect: 0,
        Strength: 0
      },
    };
    return {
      stats: defaultStats,
      showAllStats: false,
      ignoreEnergyOnVendorArmorDeals: false
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
  ignoreEnergyOnVendorArmorDeals: boolean;
}

interface ClassStatPrefs {
  Hunter: ClassStatPref;
  Warlock: ClassStatPref;
  Titan: ClassStatPref;
}

interface ClassStatPref {
  Mobility: number;
      Resilience: number;
      Recovery: number;
      Discipline: number;
      Intellect: number;
      Strength: number;
}

