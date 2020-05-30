import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { InventoryItem, ItemType } from './model';
import { NotificationService } from './notification.service';
import { del, get, keys, set } from 'idb-keyval';
import { environment as env } from '@env/environment';
import { ParseService } from './parse.service';

@Injectable({
  providedIn: 'root'
})
export class PandaGodrollsService {

  private data: { [name: string]: GunInfo; };
  private isController = true;
  constructor(private httpClient: HttpClient, private notificationService: NotificationService) {

  }

  public async init(isController: boolean): Promise<void> {
    this.isController = isController;
    if (this.data != null) { return; } else {
      const temp = await this.load();

      const data: { [name: string]: GunInfo; } = {};
      for (const c of temp) {
        if (data[c.name] == null) {
          data[c.name] = {
            mnk: null,
            controller: null
          };
        }
        if (c.mnk) {
          data[c.name].mnk = c;
        }
        if (c.controller) {
          data[c.name].controller = c;
        }
      }
      this.data = data;
      console.log('Loaded ' + temp.length + ' panda guns.');
    }
  }

  public processItems(items: InventoryItem[]): void {
    if (this.data == null) {
      console.log('No panda data present.');
      return;
    }
    for (const i of items) {
      if (i.type !== ItemType.Weapon) {
        continue;
      }

      const name = i.name.toLowerCase();
      const info = this.data[name];
      if (info == null) {
        i.noGodRollInfo = true;
        if (i.isRandomRoll && i.tier == 'Legendary') {
          i.searchText = i.searchText + ' is:nodata';
          console.log('No panda for: ' + i.name);
        }
        continue;
      }
      let rolls: GunRolls = null;
      if (this.isController) {
        rolls = info.controller;
      } else {
        rolls = info.mnk;
      }
      if (rolls == null) {
        return;
      }
      this.processGunRolls(i, rolls);
    }
  }

  private processGunRolls(i: InventoryItem, rolls: GunRolls) {
    i.pandaPve = this.processGunRoll(i, rolls.pve, true);
    i.pandaPvp = this.processGunRoll(i, rolls.pvp, false);
    if (i.pandaPvp > 1) {
      i.searchText = i.searchText + ' is:godrollpvp';
    } else if (i.pandaPvp > 0) {
      i.searchText = i.searchText + ' is:goodrollpvp';
    }
    if (i.pandaPve > 1) {
      i.searchText = i.searchText + ' is:godrollpve';
    } else if (i.pandaPve > 0) {
      i.searchText = i.searchText + ' is:goodrollpve';
    }
    let needsFixing = false;
    let first = true;
    for (const s of i.sockets) {
      if (first) {
        first = false;
        continue;
      }
      let bestPerkHad = 0;
      let bestPerkSelected = 0;
      for (const p of s.plugs) {
        if (p.pandaPve > bestPerkHad) {
          bestPerkHad = p.pandaPve;
        }
        if (p.pandaPvp > bestPerkHad) {
          bestPerkHad = p.pandaPvp;
        }
        if (p.active && (p.pandaPve > bestPerkSelected || p.pandaPvp > bestPerkSelected)) {
          bestPerkSelected = Math.max(p.pandaPve, p.pandaPvp);
        }
        if (bestPerkSelected < bestPerkHad) {
          needsFixing = true;
        }
      }
    }
    if (needsFixing) {
      i.searchText = i.searchText + ' is:fixme';
    }
  }

  private static toTitleCase(phrase: string) {
    return phrase
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private processGunRoll(i: InventoryItem, roll: GunRoll, pve: boolean): number {
    let goodRollFound = true;
    let greatRollFound = true;
    if (i.masterwork) {
      const target = [];
      for (const pm of roll.masterwork) {
        if (i.masterwork.name.toLowerCase() == pm) {
          if (pve) {
            i.masterwork.godTierPve = true;
          } else {
            i.masterwork.godTierPvp = true;
          }
        }
        target.push(PandaGodrollsService.toTitleCase(pm));

      }
      if (pve) {
        i.masterwork.recommendedPveMws = target;
      } else {
        i.masterwork.recommendedPvpMws = target;
      }
    }

    let first = true;
    for (const s of i.sockets) {
      if (first) {
        first = false;
        continue;
      }
      let goodPerkFound = false;
      let greatPerkFound = false;
      for (const p of s.plugs) {
        const name = p.name.toLowerCase();
        for (const goodPerk of roll.goodPerks) {
          if (goodPerk == name) {
            goodPerkFound = true;
            if (pve) {
              p.pandaPve = 1;
            } else {
              p.pandaPvp = 1;
            }
          }
        }
        for (const greatPerk of roll.greatPerks) {
          if (greatPerk == name) {
            greatPerkFound = true;
            if (pve) {
              p.pandaPve = 2;
            } else {
              p.pandaPvp = 2;
            }
          }
        }
        goodRollFound = (goodPerkFound || greatPerkFound) && goodRollFound;
        greatRollFound = greatPerkFound && greatRollFound;
      }
      for (const p of s.possiblePlugs) {
        const name = p.name.toLowerCase();
        for (const goodPerk of roll.goodPerks) {
          if (goodPerk == name) {
            if (pve) {
              p.pandaPve = 1;
            } else {
              p.pandaPvp = 1;
            }
          }
        }
        for (const greatPerk of roll.greatPerks) {
          if (greatPerk == name) {
            if (pve) {
              p.pandaPve = 2;
            } else {
              p.pandaPvp = 2;
            }
          }
        }
      }
    }
    return greatRollFound ? 2 : goodRollFound ? 1 : 0;
  }

  private async load(): Promise<GunRolls[]> {
    const prefix = 'panda-rolls';
    const t0 = performance.now();

    const key = `${prefix}-${env.versions.app}`;
    let rolls: GunRolls[] = await get(key);
    if (rolls == null || rolls.length == 0) {
      console.log(`    No cached ${prefix}: ${key}`);

      // clear cache
      const ks = await keys();
      for (const k of ks) {
        if (k.toString().startsWith(prefix)) {
          del(k);
        }
      }
      rolls = await this.httpClient.get<GunRolls[]>(`/assets/panda-godrolls.min.json?v=${env.versions.app}`).toPromise();
      set(key, rolls);
      console.log(`    ${prefix} downloaded, parsed and saved.`);
    } else {
      console.log(`    Using cached ${prefix}: ${key}`);
    }
    const t1 = performance.now();
    console.log(`${(t1 - t0)} + ' ms to load wishlists`);
    return rolls;
  }

}

interface GunInfo {
  mnk: GunRolls | null;
  controller: GunRolls | null;
}

interface GunRolls {
  name: string;
  sheet: string;
  pve: GunRoll;
  pvp: GunRoll;
  mnk: boolean;
  controller: boolean;
}

interface GunRoll {
  masterwork: string[];
  greatPerks: string[];
  goodPerks: string[];
}
