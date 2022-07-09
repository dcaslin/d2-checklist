import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { environment as env } from '@env/environment';
import { del, get, keys, set } from 'idb-keyval';
import { BehaviorSubject, Subject } from 'rxjs';
import { isUndefined } from 'util';
import { Const, InventoryItem, InventorySocket, ItemType, SelectedUser } from './model';
import { NotificationService } from './notification.service';

const LOG_CSS = `color: mediumpurple`;
export const CUSTOM_GOD_ROLLS = 'custom-god-rolls';
export const RYKER_GOD_ROLLS_URL = 'https://docs.google.com/spreadsheets/d/1bHsAqGldtzvQnq2kIhNArr_15taYDkHEhCq7jjhSqF0/edit#gid=1523804770';

@Injectable({
  providedIn: 'root',
})
export class PandaGodrollsService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();
  public loaded$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public meta$: BehaviorSubject<RollMeta | null> = new BehaviorSubject(null);

  private data: { [name: string]: GunInfo };
  public isController = true;
  public matchLastTwoSockets = false;
  constructor(
    private notificationService: NotificationService,
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

  public async reload() {
    this.data = null;
    await this.update(this.isController, this.matchLastTwoSockets);
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
      const allRolls = await this.load();
      const temp = allRolls.rolls;
      const meta: RollMeta = {
        title: allRolls.title,
        date: allRolls.date,
        manifestVersion: allRolls.manifestVersion
      };
      this.meta$.next(meta);

      const data: { [name: string]: GunInfo } = {};
      for (const c of temp) {
        const key = c.name;
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
      console.log('%cLoaded ' + temp.length + ' panda guns.', LOG_CSS);
    }
    this.loaded$.next(true);
  }

  public processItems(items: InventoryItem[]): void {
    if (this.data == null) {
      console.log('%cNo panda data present.', LOG_CSS);
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
      const vogsuffix = ' (Timelost)'.toLowerCase();
      if (name.endsWith(vogsuffix)) {
        name = name.substring(0, name.length - vogsuffix.length);
      }
      const key = name;
      const info = this.data[key];
      if (info == null) {
        i.noGodRollInfo = true;
        if (i.tier == 'Legendary') {
          i.searchText = i.searchText + ' is:nodata';
          console.log('%cNo panda for: ' + i.name, LOG_CSS);
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

  public static isFixNeeded(s: InventorySocket): boolean {
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
      return true;
    }
    return false;
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
      if (!i.crafted && !i.deepsight) {
        i.searchText = i.searchText + ' is:notinteresting';
      }
    }
    let needsFixing = false;
    const perkSockets = i.sockets.filter(s => s.isWeaponPerk);
    for (const s of perkSockets) {
      const socketNeedsFixing = PandaGodrollsService.isFixNeeded(s);
      needsFixing = needsFixing || socketNeedsFixing;
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

    let cntr = 0;    
    // 2021-05-31 if this is a great roll that only missed by one socket, mark it as a good roll
    let greatCount = 0;
    const perkSockets = i.sockets.filter(s => s.isWeaponPerk && !s.isOriginTraitSocket() && s.plugs?.length > 0);
    for (const s of perkSockets) {
      cntr++;
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
      if (!this.matchLastTwoSockets || cntr >= perkSockets.length - 1) {
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
      // if we're off by only one on great rolls let's call it good
      if (greatCount >= (perkSockets.length - 1)) {
        goodRollFound = true;
      }
    }
    return greatRollFound ? 2 : goodRollFound ? 1 : 0;
  }

  public static isValid(completeRolls: CompleteGodRolls): boolean {
    if (!completeRolls || !completeRolls.rolls) {
      return false;
    }
    if (!completeRolls.rolls?.length || !completeRolls.date || !completeRolls.manifestVersion) {
      return false;
    }
    const loaded = {};
    // check for dupes
    for (const roll of completeRolls.rolls) {
      if(roll.pvp) {
        if (roll.mnk) {
          const key = `${roll.name}-pvp-mnk`;
          if (loaded[key]) {
            console.log(`%c    Duplicate for ${key}`, LOG_CSS);
          }
          loaded[key] = true;
        }
        if (roll.controller) {

          const key = `${roll.name}-pvp-controller`;
          if (loaded[key]) {
            console.log(`%c    Duplicate for ${key}`, LOG_CSS);
          }
          loaded[key] = true;
        }
      }
      if (roll.pve) {
        if (roll.mnk) {
          const key = `${roll.name}-pve-mnk`;
          if (loaded[key]) {
            console.log(`%c    Duplicate for ${key}`, LOG_CSS);
          }
          loaded[key] = true;

        }
        if (roll.controller) {
          const key = `${roll.name}-pve-controller`;
          if (loaded[key]) {
            console.log(`%c    Duplicate for ${key}`, LOG_CSS);
          }
          loaded[key] = true;
          
        }
      } 
    }
    return true;
  }

  public static async getCustomGodRolls(): Promise<CompleteGodRolls | null> {
    const custom: CompleteGodRolls = await get(CUSTOM_GOD_ROLLS);
    if (PandaGodrollsService.isValid(custom)) {
      return custom;
    }
    return null;
  }

  private async load(): Promise<CompleteGodRolls> {
    const prefix = 'panda-rolls';
    const t0 = performance.now();

    const key = `${prefix}-${env.versions.app}`;
    let completeGodRolls: CompleteGodRolls = await PandaGodrollsService.getCustomGodRolls();
    let customGodRolls = false;
    if (!completeGodRolls) {
      completeGodRolls = await get(key);
    } else {
      console.log(`'%c    USING CUSTOM GOD ROLLS: ${completeGodRolls.title}`, LOG_CSS);
      customGodRolls = true;
    }
    if (completeGodRolls == null || completeGodRolls.rolls?.length == 0) {
      console.log(`'%c    No cached ${prefix}: ${key}`, LOG_CSS);

      // clear cache
      const ks = await keys();
      for (const k of ks) {
        if (k.toString().startsWith(prefix)) {
          del(k);
        }
      }
      completeGodRolls = await this.httpClient
        .get<CompleteGodRolls>(
          `/assets/panda-godrolls.min.json?v=${env.versions.app}`
        )
        .toPromise();
      set(key, completeGodRolls);
      console.log(`'%c    ${prefix} downloaded, parsed and saved.`, LOG_CSS);
    } else {
      console.log(`'%c    Using cached ${prefix}: ${key}`, LOG_CSS);
    }
    const t1 = performance.now();
    console.log(`'%c    ${t1 - t0}ms to load wishlists`, LOG_CSS);
    const loadDate = new Date(completeGodRolls.date);
    if (customGodRolls) {
      this.notificationService.success(`CUSTOM GOD ROLLS: Loaded '${completeGodRolls.title}' from ${loadDate.toLocaleDateString()}. You can use /perkbench to undo this override`);
    } else {
      // this.notificationService.success(`God rolls: Loaded '${completeGodRolls.title}' from ${loadDate.toLocaleDateString()}`);
    }

    return completeGodRolls;
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

export interface GunRolls {
  name: string;
  sheet: string;
  pve: GunRoll;
  pvp: GunRoll;
  mnk: boolean;
  controller: boolean;
} // todo remove sheet and version, replace with note and URL?

export interface GunRoll {
  masterwork: string[];
  greatPerks: string[];
  goodPerks: string[];
}

export interface CompleteGodRolls {
  title: string;
  date: string; // iso date format
  manifestVersion: string;
  rolls: GunRolls[];
}

export interface RollMeta {
  title: string;
  date: string; // iso date format
  manifestVersion: string;
}
