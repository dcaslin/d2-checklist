import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BucketService } from './bucket.service';
import { Character, InventoryItem, InventoryPlug, ItemType, PerkCount, Player } from './model';

@Injectable({
  providedIn: 'root'
})
export class TargetPerkService {
  public readonly perks: BehaviorSubject<TargetPerks>;

  private readonly MAPPINGS: {[key: string]: string} = {
    'auto rifle': 'auto rifle|^rifle|unflinching rifle|scatter projectile',
    'combat bow': 'bow|precision weapon|oversize weapon|light arms',
    'fusion rifle': '(?<!linear )fusion rifle|light reactor|^rifle|unflinching rifle|scatter projectile',
    'grenade launcher': 'grenade launcher|oversize weapon|large weapon',
    'hand cannon': 'hand cannon|precision weapon|light arms',
    'linear fusion rifle': 'linear fusion|precision weapon',
    'machine gun': '(?<!sub)machine gun',
    'pulse rifle': 'pulse rifle|^rifle|unflinching rifle|scatter projectile',
    'rocket launcher': 'rocket launcher|oversize weapon|large weapon',
    'scout rifle': 'scout rifle|^rifle|unflinching rifle|precision weapon',
    'shotgun': 'shotgun|pump action|oversize weapon|large weapon',
    'sidearm': 'sidearm|scatter projectile|light arms',
    'sniper rifle': 'sniper|remote connection|^rifle|unflinching rifle',
    'submachine gun': 'submachine gun|scatter projectile|light arms',
    'sword': 'sword',
    'trace rifle': 'trace rifle|^rifle|unflinching rifle|precision weapon',
    'super': 'ashes to assets|heavy lifting|dynamo|hands-on',
    'melee': 'invigoration|momentum transfer|outreach',
    'grenade': 'bomber|fastball|impact induction|innervation',
    'ability': 'insulation|perpetuation'
  };

  private parsedMappings: {[key: string]: RegExp};

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
    const r: RegExp = this.parsedMappings[w];
    if (r == null) {
      console.log('Missing mapping for: ' + w);
      return false;
    }
    return r.test(p);
  }


  private checkWeapon3(w: string, p: string): boolean {
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
      let targetPerkCnt = 0;
      for (const s of i.sockets) {
        let hasSocketTarget = false;
        for (const p of s.plugs) {
          p.targetArmorPerk = this.isTargetPerk(p);
          if (p.targetArmorPerk) {
            hasSocketTarget = true;
            hasTargetPerk = true;
            hasSelectedTargetPerk = hasSelectedTargetPerk || p.active;
            p.alreadyEquipped = this.alreadyEquipped(i, p, equippedPerks);
            if (!p.alreadyEquipped) {
              freshTargetPerk = true;
            }
          }
        }
        if (hasSocketTarget){
          targetPerkCnt++;
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
      if (targetPerkCnt > 1) {
        i.searchText += 'manytargetperks';
      } else if (targetPerkCnt === 1) {
        i.searchText += 'onetargetperk';
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
    this.parsedMappings = {};
    for (const key of Object.keys(this.MAPPINGS)) {
      this.parsedMappings[key] = new RegExp(this.MAPPINGS[key]);
    }
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
