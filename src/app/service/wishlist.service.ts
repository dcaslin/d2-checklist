import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { DestinyCacheService } from './destiny-cache.service';
import { InventoryItem } from './model';
import { NotificationService } from './notification.service';

@Injectable()
export class WishlistService implements OnDestroy {
  private data: { [hash: string]: CuratedRoll[]; };
  static WildcardItemId = -69420; // nice
  
  // public static DEFAULT_PVE_URL = 'https://gist.githubusercontent.com/dcaslin/e614cf030f14c41e07c87f6f7f08d465/raw/64b3a65506e4ab814684d7f293e0e0b19cad7784/panda_pve.txt';
  public static DEFAULT_PVE_URL = 'https://gitcdn.link/repo/dcaslin/e614cf030f14c41e07c87f6f7f08d465/raw/64b3a65506e4ab814684d7f293e0e0b19cad7784/panda_pve.txt';

  // public static DEFAULT_PVP_URL = 'https://gist.githubusercontent.com/dcaslin/ef71ca7aac1e563653cf4a541c11baee/raw/e291d19a89ecc1f9d8bb88961e1e4fa6fd82a3c2/panda_pvp.txt';
  public static DEFAULT_PVP_URL = 'https://gitcdn.link/repo/dcaslin/ef71ca7aac1e563653cf4a541c11baee/raw/e291d19a89ecc1f9d8bb88961e1e4fa6fd82a3c2/panda_pvp.txt';

  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(private httpClient: HttpClient, private notificationService: NotificationService,
    private destinyCacheService: DestinyCacheService) {

  }

  public async init(overridePveUrl: string, overridePvpUrl: string): Promise<void> {
    if (this.data != null) { return; } else {
      const temp = await this.load(overridePveUrl, overridePvpUrl);
      const data: { [hash: string]: CuratedRoll[]; } = {};
      for (const c of temp) {
        if (data[c.itemHash] == null) {
          data[c.itemHash] = [];
        }
        data[c.itemHash].push(c);
      }
      this.data = data;
      console.log('Loaded ' + temp.length + ' wish list items');
    }
  }

  public async loadSingle(type: string, url: string, defaultUrl: string): Promise<CuratedRoll[]> {
    if (url == null) {
      url = defaultUrl;
    }
    try {
      const urls: string[] = url.split('|');
      if (urls.length > 1) {
        console.log('Loading multiple URLS. Total: ' + urls.length);
        let returnMe = [];
        for (const u of urls) {
          const bansheeText = await this.httpClient.get(u, { responseType: 'text' }).toPromise();
          const oneSet = this.toCuratedRolls(type, bansheeText);
          returnMe = returnMe.concat(oneSet);
          console.log('Multi urls: Loading ' + oneSet.length + ' items from ' + u);
        }
        return returnMe;
      } else {
        const bansheeText = await this.httpClient.get(url, { responseType: 'text' }).toPromise();
        return this.toCuratedRolls(type, bansheeText);
      }
    } catch (e) {
      this.notificationService.info('Error loading ' + type + ' wishlist from ' + url);
      console.error(e);
      return [];
    }
  }

  public async load(overridePveUrl: string, overridePvpUrl: string): Promise<CuratedRoll[]> {
    const pveRolls = await this.loadSingle('pve', overridePveUrl, WishlistService.DEFAULT_PVE_URL);
    const pvpRolls = await this.loadSingle('pvp', overridePvpUrl, WishlistService.DEFAULT_PVP_URL);
    return pveRolls.concat(pvpRolls);
  }

  public processItems(items: InventoryItem[]): void {
    if (this.data == null) { return; }
    for (const i of items) {
      if (this.data[i.hash] != null) {
        // for each curated roll
        for (const c of this.data[i.hash]) {
          let rollMatches = true;
          const isPvp = c.label == 'pvp';
          const isPve = c.label == 'pve';
          // is every.single.perk found in the sockets
          for (const desiredPerk of c.recommendedPerks) {
            let perkFound = false;
            for (const s of i.sockets) {
              for (const p of s.plugs) {
                if (+p.hash == desiredPerk) {
                  perkFound = true;
                  p.godRoll = true;
                  if (isPvp) {
                    p.godRollPvp = true;
                  }
                  if (isPve) {
                    p.godRollPve = true;
                  }
                  break;
                }
              }
              for (const p of s.possiblePlugs) {
                if (+p.hash == desiredPerk) {
                  p.godRoll = true;
                  if (isPvp) {
                    p.godRollPvp = true;
                  }
                  if (isPve) {
                    p.godRollPve = true;
                  }
                  break;
                }
              }
              if (perkFound == true) { break; }
            }
            if (!perkFound) {
              rollMatches = false;
            }
          }

          if (rollMatches) {
            i.godRoll = true;
            i.searchText = i.searchText + ' godroll is:wishlist';
            if (isPve) {
              i.searchText = i.searchText + ' godrollpve is:wishlistpve';
              i.godRollPve = true;

            }
            if (isPvp) {
              i.searchText = i.searchText + ' godrollpvp is:wishlistpvp';
              i.godRollPvp = true;
            }
          }
        }

        // check if the right stuff is selected and handle tooltips
        for (const s of i.sockets) {
          let godPerkFound = false;
          let godPerkSelected = false;
          for (const p of s.plugs) {
            if (p.godRoll) {
              godPerkFound = true;
              if (p.active) {
                godPerkSelected = true;
              }
              if (p.godRollPvp && p.godRollPve) {
                p.desc = 'RECOMMENDED PVE & PVP\n' + p.desc;
              } else if (p.godRollPvp) {
                p.desc = 'RECOMMENDED PVP\n' + p.desc;
              } else if (p.godRollPve) {
                p.desc = 'RECOMMENDED PVE\n' + p.desc;
              }
            }
          }
          if (godPerkFound && !godPerkSelected) {
            i.searchText = i.searchText + ' fixme';
          }
        }
      } else {
        i.noGodRollInfo = true;
        if (i.isRandomRoll && i.tier == 'Legendary') {
          i.searchText = i.searchText + ' nodata';
        }
      }
    }
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private bansheeToCuratedRoll(bansheeTextLine: string): CuratedRoll | null {
    if (!bansheeTextLine || bansheeTextLine.length === 0) {
      return null;
    }

    const matchResults = bansheeTextLine.match(
      /https:\/\/banshee-44\.com\/\?weapon=(\d.+)&socketEntries=(.*)/
    );

    if (!matchResults || matchResults.length !== 3) {
      return null;
    }

    const itemHash = Number(matchResults[1]);
    const recommendedPerks = matchResults[2]
      .split(',')
      .map(Number)
      .filter((perkHash) => {
        if (perkHash <= 0) { return false; }
        if (perkHash == 3876796314) { return false; } // base radiance
        const desc: any = this.destinyCacheService.cache.InventoryItem[perkHash];
        if (desc == null) { return false; }
        if (desc.itemCategoryHashes == null) { return false; }
        if (desc.itemCategoryHashes.includes(41)) { return false; } // shaders
        if (desc.itemCategoryHashes.includes(945330047)) { return false; } // gameplay weapon mods
        if (desc.itemCategoryHashes.includes(2237038328)) { return false; } // intrinsics
        if (desc.plug != null && desc.plug.plugCategoryIdentifier.indexOf('masterworks.stat.') > 0) { return false; } // masterwork stuff
        return true;
      });

    return {
      label: '',
      itemHash: itemHash,
      recommendedPerks: recommendedPerks
    };
  }

  private static toDimWishListCuratedRoll(textLine: string): CuratedRoll | null {
    if (!textLine || textLine.length === 0) {
      return null;
    }
    const matchResults = textLine.match(/dimwishlist:item=(-?\d.+)&perks=([\d|,]*).*/);
    if (!matchResults || matchResults.length !== 3) {
      return null;
    }

    const itemHash = Number(matchResults[1]);
    if (itemHash < 0 && itemHash !== WishlistService.WildcardItemId) {
      return null;
    }
    const recommendedPerks = matchResults[2]
      .split(',')
      .map(Number)
      .filter((perkHash) => perkHash > 0);
    return {
      label: '',
      itemHash: itemHash,
      recommendedPerks: recommendedPerks
    };
  }

  /** Newline-separated banshee-44.com text -> CuratedRolls. */
  toCuratedRolls(type, bansheeText: string): CuratedRoll[] {
    const textArray = bansheeText.split('\n');
    let temp = textArray.map(this.bansheeToCuratedRoll, this)
      .concat(textArray.map(WishlistService.toDimWishListCuratedRoll));
    temp = temp.filter(Boolean);
    temp.every(v => v.label = type);
    return temp;
  }
}



/**
 * From https://github.com/DestinyItemManager/DIM/blob/5719fca8aba513415930a6fb175897e0736d05da/src/app/curated-rolls/curatedRoll.ts
 * Interface for translating lists of curated rolls to a format we can use.
 * Initially, support for translating banshee-44.com -> this has been built,
 * but this is here so that we can plug in support for anyone else that can
 * get us this information.
 */
export interface CuratedRoll {
  label: string; // pvp vs pve
  /** Item hash for the recommended item. */
  itemHash: number;
  /**
   * All of the perks (perk hashes) that need to be present for an item roll to
   * be recognized as curated.
   * Note that we'll discard some (intrinsics, shaders, masterworks) by default.
   * Also note that fuzzy matching isn't present, but can be faked by removing
   * perks that are thought to have marginal bearing on an item.
   */
  recommendedPerks: number[];
}
