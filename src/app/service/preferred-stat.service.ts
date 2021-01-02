import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClassAllowed, VendorInventoryItem, InventoryItem, InventoryStat, ItemType, Player, SaleItem } from './model';

const PREF_STATS_KEY = 'preferred-armor-stats';
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
    const s = localStorage.getItem(PREF_STATS_KEY);
    let pref = this.buildDefault();
    try {
      if (s != null) {
        pref = JSON.parse(s);
      }
    } catch (exc) {
      localStorage.removeItem(PREF_STATS_KEY);
    }
    this.stats = new BehaviorSubject<PreferredStats>(pref);
  }

  private buildDefault(empty?: boolean): PreferredStats {
    const stats: { [key: string]: { [key: string]: boolean } } = {};
    stats.Hunter = {
      Mobility: true,
      Resilience: false,
      Recovery: true,
      Discipline: false,
      Intellect: true,
      Strength: false
    };
    stats.Titan = {
      Mobility: false,
      Resilience: true,
      Recovery: true,
      Discipline: false,
      Intellect: true,
      Strength: false
    };
    stats.Warlock = {
      Mobility: false,
      Resilience: false,
      Recovery: true,
      Discipline: true,
      Intellect: true,
      Strength: false
    };
    return {
      stats: stats,
      showAllStats: false
    };
  }

  public update(pref: PreferredStats) {
    const s = JSON.stringify(pref);
    localStorage.setItem(PREF_STATS_KEY, s);
    this.stats.next(pref);
  }

  public reset() {
    localStorage.removeItem(PREF_STATS_KEY);
    this.stats.next(this.buildDefault());
  }

  public isPreferred(destinyClass: string, stat: InventoryStat, showAllOverride: boolean): boolean {
    if (!destinyClass) {
      return false;
    }
    const cur = this.stats.getValue();
    if (!cur) { return false; }

    if (showAllOverride && cur.showAllStats) {
      return true;
    }
    if (cur.stats[destinyClass][stat.name]) {
      return cur.stats[destinyClass][stat.name];
    }
    return false;
  }


  public processSaleItems(items: SaleItem[]) {
    for (const i of items) {
      if (i.type !== ItemType.Armor) {
        continue;
      }
      let prefPts = 0;
      let totalPts = 0;
      for (const stat of i.stats) {
        if (this.isPreferred(ClassAllowed[i.classAllowed], stat, false)) {
          prefPts += stat.value;
        }
        totalPts += stat.value;
      }
      i.preferredStatPoints = prefPts;
      i.totalStatPoints = totalPts;
    }
  }

  public processVendorSaleItems(vendorItems: VendorInventoryItem[]) {
    const items = [];
    for (const i of vendorItems) {
      if (i.data) {
        items.push(i.data);
      }
    }
    this.processItems(items);
  }

  private processItems(items: InventoryItem[]) {
    for (const i of items) {
      if (i.type !== ItemType.Armor) {
        continue;
      }
      let prefPts = 0;
      for (const stat of i.stats) {
        if (this.isPreferred(ClassAllowed[i.classAllowed], stat, false)) {
          prefPts += stat.value;
        }
      }
      i.preferredStatPoints = prefPts;
    }
  }

  public processGear(player: Player) {
    const items = player.gear;
    this.processItems(items);
    
  }
}

export interface PreferredStats {
  // class, stat name, true/false
  stats: { [key: string]: { [key: string]: boolean } };
  showAllStats: boolean;
}



