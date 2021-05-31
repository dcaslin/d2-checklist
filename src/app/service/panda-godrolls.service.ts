import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Const, InventoryItem, ItemType, SelectedUser } from './model';
import { NotificationService } from './notification.service';
import { del, get, keys, set } from 'idb-keyval';
import { environment as env } from '@env/environment';
import { ParseService } from './parse.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { SignedOnUserService } from './signed-on-user.service';
import { filter, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PandaGodrollsService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();
  public loaded$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private data: { [name: string]: GunInfo };
  public isController = true;
  public matchLastTwoSockets = false;
  constructor(
    private httpClient: HttpClient
  ) {
  }

  public async updateUser(selectedUser: SelectedUser) {
    const controllerPref = localStorage.getItem('mnk-vs-controller');
    const godRollLastTwoOnly = localStorage.getItem('god-roll-last-two-only') == 'true';
    let controller = false;
    if (controllerPref != null) {
      controller = 'true' == controllerPref;
    } else {
      // if no explicit prep, assume MnK on steam, controller otherwise
      if (selectedUser != null && selectedUser.userInfo.membershipType == Const.STEAM_PLATFORM.type) {
        controller = false;
      } else {
        controller = true;
      }
    }
    await this.update(controller, godRollLastTwoOnly);
  }

  public async saveSettingsAndRefreshWishlist(
    controller: boolean,
    godRollLastTwoOnly: boolean
  ) {
    localStorage.setItem('mnk-vs-controller', controller ? 'true' : 'false');
    localStorage.setItem('god-roll-last-two-only', godRollLastTwoOnly ? 'true' : 'false'
    );
    await this.update(controller, godRollLastTwoOnly);
  }

  public async update(
    isController: boolean,
    matchLastTwoSockets: boolean
  ): Promise<void> {
    this.isController = isController;
    this.matchLastTwoSockets = matchLastTwoSockets;
    if (this.data != null) {
      // no need to reload
    } else {
      const temp = await this.load();
      const data: { [name: string]: GunInfo } = {};
      for (const c of temp) {
        const key = c.name + c.version;
        if (data[key] == null) {
          data[key] = {
            mnk: null,
            controller: null,
          };
        }
        if (c.mnk) {
          data[key].mnk = c;
        }
        if (c.controller) {
          data[key].controller = c;
        }
      }
      this.data = data;
      console.log('Loaded ' + temp.length + ' panda guns.');
    }
    this.loaded$.next(true);
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
      // skip fixed rolls
      if (!i.isRandomRoll) {
        continue;
      }
      let name = i.name.toLowerCase();
      const suffix = ' (Adept)'.toLowerCase();
      if (name.endsWith(suffix)) {
        name = name.substring(0, name.length - suffix.length);
      }
      let key = name + i.versionNumber;
      let info = this.data[key];
      if (i.versionNumber > 0 && info == null) {
        key = i.name.toLowerCase() + '0';
        info = this.data[key];
      }
      if (info == null) {
        i.noGodRollInfo = true;
        if (i.tier == 'Legendary') {
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
        continue;
      }
      this.processGunRolls(i, rolls);
    }
  }

  private processGunRolls(i: InventoryItem, rolls: GunRolls) {
    i.pandaPve = this.processGunRoll(i, rolls.pve, true);
    i.pandaPvp = this.processGunRoll(i, rolls.pvp, false);
    i.godRollInfo = '';
    if (i.pandaPvp > 1) {
      i.searchText = i.searchText + ' is:godrollpvp  is:goodrollpvp';
      i.godRollInfo = i.godRollInfo + ' is:godrollpvp  is:goodrollpvp';
    } else if (i.pandaPvp > 0) {
      i.searchText = i.searchText + ' is:goodrollpvp';
      i.godRollInfo = i.godRollInfo + ' is:goodrollpvp';
    }
    if (i.pandaPve > 1) {
      i.searchText = i.searchText + ' is:godrollpve is:goodrollpve';
      i.godRollInfo = i.godRollInfo + ' is:godrollpve is:goodrollpve';
    } else if (i.pandaPve > 0) {
      i.searchText = i.searchText + ' is:goodrollpve';
      i.godRollInfo = i.godRollInfo + ' is:goodrollpve';
    }
    if (i.pandaPve < 1 && i.pandaPvp < 1) {
      i.searchText = i.searchText + ' is:notgoodroll';
      i.godRollInfo = i.godRollInfo + ' is:notgoodroll';
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
        if (
          p.active &&
          (p.pandaPve > bestPerkSelected || p.pandaPvp > bestPerkSelected)
        ) {
          bestPerkSelected = Math.max(p.pandaPve, p.pandaPvp);
        }
      }
      if (bestPerkSelected == 0 && bestPerkHad > 0) {
        needsFixing = true;
      }
    }
    if (needsFixing) {
      i.searchText = i.searchText + ' is:fixme';
      i.godRollInfo = i.godRollInfo + ' is:fixme';
    }
  }

  private static toTitleCase(phrase: string) {
    return phrase
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private processGunRoll(
    i: InventoryItem,
    roll: GunRoll,
    pve: boolean
  ): number {
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
    let cntr = 0;
    // 2021-05-31 if this is a great roll that only missed by one socket, mark it as a good roll
    let greatCount = 0;
    for (const s of i.sockets) {
      cntr++;
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
      }
      if (greatPerkFound) {
        greatCount++;
      }
      // if we're only matching on the last 2 sockets, downgrade roll on last two sockets
      if (!this.matchLastTwoSockets || cntr >= i.sockets.length - 1) {
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
    // if we're doing normal processing and we don't have a good or great roll, double check to see if we only missed by one on a god roll
    // if so, count it as a good roll
    if (!this.matchLastTwoSockets && !(greatRollFound || goodRollFound)) {      
      // we have one throwaway socket for frame, after that if we're off by only one on great rolls let's call it good
      if (greatCount >= (i.sockets.length-2)) {
        goodRollFound = true;
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
      rolls = await this.httpClient
        .get<GunRolls[]>(
          `/assets/panda-godrolls.min.json?v=${env.versions.app}`
        )
        .toPromise();
      set(key, rolls);
      console.log(`    ${prefix} downloaded, parsed and saved.`);
    } else {
      console.log(`    Using cached ${prefix}: ${key}`);
    }
    const t1 = performance.now();
    console.log(`${t1 - t0}ms to load wishlists`);
    return rolls;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
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
  version: number;
}

interface GunRoll {
  masterwork: string[];
  greatPerks: string[];
  goodPerks: string[];
}
