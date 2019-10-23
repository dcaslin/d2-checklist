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

    const s = localStorage.getItem('preferred-stats');
    let pref = PreferredStatService.buildDefault();
    try {
      if (s != null) {
        pref = JSON.parse(s);
      }
    } catch (exc) {
      localStorage.removeItem('preferred-stats');
    }
    this.stats = new BehaviorSubject<PreferredStats>(pref);
    const choices = [];
    choices.push('None');
    choices.push('Discipline');
    choices.push('Intellect');
    choices.push('Strength');
    choices.push('Mobility');
    choices.push('Recovery');
    choices.push('Resilience');
    this.choices = choices;
  }

  static buildDefault(): PreferredStats {
    return {
      stat1: 'Intellect',
      stat2: 'Recovery',
      stat3: 'Discipline',
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
    if (cur.stat1 && cur.stat1 === stat.name) {
      return true;
    }
    if (cur.stat2 && cur.stat2 === stat.name) {
      return true;
    }
    if (cur.stat3 && cur.stat3 === stat.name) {
      return true;
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
  stat1: string;
  stat2: string;
  stat3: string;
  // hide modified value?
  showAllStats: boolean;
}
