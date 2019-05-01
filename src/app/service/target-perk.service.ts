import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BucketService, Bucket } from './bucket.service';
import { Character, InventoryItem, InventoryPlug, ItemType, Player, PerkCount, Target } from './model';

@Injectable({
  providedIn: 'root'
})
export class TargetPerkService {
  public readonly perks: BehaviorSubject<TargetPerks>;

  private alreadyEquipped(itm: InventoryItem, p: InventoryPlug, equippedPerks: { [key: string]: string[] }): boolean {
    // this is actively equipped it doesn't count
    if (itm.equipped == true) {
      return false;
    } 
    const currPerks = equippedPerks[itm.classAllowed];
    if (currPerks != null) {
      return currPerks.indexOf(p.hash) >= 0;
    }
    return false;
  }

  private checkWeapon(w: string, p: string): boolean {
    if (w == null || w === 'none') {
      return false;
    }
    if (w === 'combat bow') {
      return p.indexOf('bow') >= 0;
    } else if (w === 'fusion rifle') {
      return p.indexOf('linear') < 0 && p.indexOf('fusion rifle') >= 0;
    } else if (w === 'machine gun') {
      return p.indexOf('submachine') < 0 && p.indexOf('machine gun') >= 0;
    } else {
      return p.indexOf(w) >= 0;
    }
  }

  private isTargetPerk(p: InventoryPlug): boolean {
    const t = this.perks.value;
    const n = p.name.toLowerCase();
    if (t.traction && n.indexOf('traction') >= 0) {
      return true;
    }
    if (t.specialAmmoFinder && n.indexOf('special ammo finder') >= 0) {
      return true;
    }
     if (t.heavyAmmoFinder && n.indexOf('heavy ammo finder') >= 0) {
      return true;
    }
    if (this.checkWeapon(t.weapon1, n)) {
      return true;
    }
    if (this.checkWeapon(t.weapon2, n)) {
      return true;
    }
    if (this.checkWeapon(t.weapon3, n)) {
      return true;
    }
    return false;
  }

  public processGear(player: Player) {
    // const t0 = performance.now();
    const items = player.gear;
    const equippedPerks: { [key: string]: string[] } = {};
    for (const char of player.characters) {
      const perks = [];
      const perkCounts = this.getEquippedPerks(char, items);

      for (const pc of perkCounts) {
        perks.push(pc.perk.hash);
      }
      equippedPerks[char.classType] = perks;
    }

    for (const i of items) {
      if (i.type !== ItemType.Armor) {
        continue;
      }
      let hasTargetPerk = false;
      let freshTargetPerk = false;
      let hasSelectedTargetPerk = false;
      for (const s of i.sockets) {
        for (const p of s.plugs) {
          p.targetArmorPerk = this.isTargetPerk(p);
          if (p.targetArmorPerk) {
            hasTargetPerk = true;
            hasSelectedTargetPerk = hasSelectedTargetPerk || p.active;
            p.alreadyEquipped = this.alreadyEquipped(i, p, equippedPerks);
            if (!p.alreadyEquipped) {
              freshTargetPerk = true;
            }
          }
        }
      }
      const hasFixMeText = i.searchText.indexOf('fixme') >= 0;
      const needsFixing = hasTargetPerk && !hasSelectedTargetPerk;
      if (hasFixMeText && !needsFixing) {
        i.searchText.replace('fixme', '');
      } else if (!hasFixMeText && needsFixing) {
        i.searchText += 'fixme';
      }

      const hasTargetText = i.searchText.indexOf('targetperk') >= 0;
      if (hasTargetText && !hasTargetPerk) {
        i.searchText.replace('targetperk', '');
      } else if (!hasTargetText && hasTargetPerk) {
        i.searchText += 'targetperk';
      }

      const freshTargetText = i.searchText.indexOf('freshtarget') >= 0;
      if (freshTargetText && !freshTargetPerk) {
        i.searchText.replace('freshtarget', '');
      } else if (!freshTargetText && freshTargetPerk) {
        i.searchText += 'freshtarget';
      }

    }
    // const t1 = performance.now();
    // console.log('Filter target perks: ' + (t1 - t0) + ' ms.');
  }

  public update(target: TargetPerks) {
    const s = JSON.stringify(target);
    localStorage.setItem('target-perks', s);
    this.perks.next(target);
  }

  constructor(
    private bucketService: BucketService
  ) {
    const s = localStorage.getItem('target-perks');
    let target = TargetPerkService.buildDefault();
    try {
      if (s != null) {
        target = JSON.parse(s);
      }
    } catch (exc) {
      localStorage.removeItem('target-perks');
    }
    this.perks = new BehaviorSubject<TargetPerks>(target);
  }

  static buildDefault() {
    return {
      weapon1: 'none',
      weapon2: 'none',
      weapon3: 'none',
      specialAmmoFinder: true,
      heavyAmmoFinder: true,
      traction: true,
      fastball: true
    };
  }

  public getEquippedPerks(char: Character, gear: InventoryItem[]): PerkCount[] {
    const activePerks: InventoryPlug[] = [];
    for (const g of gear) {
      if (g.type != ItemType.Armor) { continue; }
      if (!g.equipped) { continue; }
      if (g.owner.id != char.id) { continue; }
      for (const s of g.sockets) {
        for (const p of s.plugs) {
          if (!p.active) { continue; }
          if (p.name.endsWith('Armor')) { continue; }
          if (p.name.endsWith('Mod')) { continue; }
          activePerks.push(p);
        }
      }
    }
    const perkSet = {};
    for (const p of activePerks) {
      if (perkSet[p.name] == null) {
        perkSet[p.name] = {
          perk: p,
          count: 0
        };
      }
      perkSet[p.name].count = perkSet[p.name].count + 1;
    }
    const returnMe = [];
    for (const key of Object.keys(perkSet)) {
      returnMe.push(perkSet[key]);
    }
    returnMe.sort(function (a, b) {
      if (a.perk.name < b.perk.name) {
        return -1;
      }
      if (a.perk.name > b.perk.name) {
        return 1;
      }
      return 0;
    });
    return returnMe;
  }
}

export interface TargetPerks {
  // Linear Fusion
  // Sword
  weapon1: string;
  weapon2: string;
  weapon3: string;
  specialAmmoFinder: boolean;
  heavyAmmoFinder: boolean; // 2867719094
  traction: boolean; // 1818103563
  fastball: boolean; // 3030206832
}
