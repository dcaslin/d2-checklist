import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, concatAll, map } from 'rxjs/operators';
import { API_ROOT, BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { LowLineService } from './lowline.service';
import {
  Character,
  ItemObjective,
  ClassAllowed,
  ItemType,
  NameQuantity,
  InventoryItem,
  CharacterVendorData,
  Vendor,
  Player,
  ApiInventoryBucket,
  EnergyType
} from './model';
import { NotificationService } from './notification.service';
import { ParseService } from './parse.service';
import { PreferredStatService } from './preferred-stat.service';


@Injectable({
  providedIn: 'root'
})
export class VendorService {

  constructor(
    private httpClient: HttpClient,
    private bungieService: BungieService,
    private notificationService: NotificationService,
    private destinyCacheService: DestinyCacheService,
    private lowlineService: LowLineService,
    private preferredStatService: PreferredStatService,
    private parseService: ParseService) {

  }

  public loadVendors(c: Character): Observable<CharacterVendorData> {
    const url = 'Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' +
      c.characterId + '/Vendors/?components=Vendors,VendorSales,ItemObjectives, ItemInstances, ItemPerks, ItemStats, ItemSockets, ItemPlugStates, ItemTalentGrids, ItemCommonData, ProfileInventories, ItemReusablePlugs, ItemPlugObjectives';
    return this.streamReq('loadVendors', url)
      .pipe(
        map((resp) => {
          return {
            char: c,
            data: this.parseVendorData(c, resp)
          };
        })
      );
  }

  private static sortByStats(a: InventoryItem, b: InventoryItem): number {
    let aN = a.preferredStatPoints;
    let bN = b.preferredStatPoints;
    if (aN < bN) {
      return 1;
    } else if (aN > bN) {
      return -1;
    }
    aN = a.totalStatPoints;
    bN = b.totalStatPoints;
    if (aN < bN) {
      return 1;
    } else if (aN > bN) {
      return -1;
    }
    return 0;
  }

  public getExchangeInfo(player: Player, vendorItems: InventoryItem[]) {
    const stuff = player.gear.concat(vendorItems);
    if (stuff.length > 820) {
      console.log('hi');
    }
  }

  public findExoticArmorDeals(player: Player, vendorArmor: InventoryItem[]): InventoryItem[] {
    const vendorExotics = vendorArmor.filter(i => i.tier == 'Exotic');
    const playerExotics = player.gear.filter(i => i.type == ItemType.Armor).concat(vendorArmor).filter(i => i.tier == 'Exotic');
    const deals = [];
    for (const v of vendorExotics) {
      const copies = playerExotics.filter(i => i.hash == v.hash);
      copies.sort(VendorService.sortByStats);
      if (copies[0].vendorItemInfo) {
        deals.push(copies[0]);
      }
    }
    return deals;
  }

  public findLegendaryArmorDeals(player: Player, vendorArmor: InventoryItem[]) {
    this.preferredStatService.processGear(player);
    const bucketMap: { [key: string]: ClassInventoryBucket; } = {};
    const buckets = this.getBuckets();
    for (const bucket of buckets) {
      bucketMap[bucket.bucket.hash.toString() + bucket.energyType.toString() + bucket.classType.toString()] = bucket;
    }
    const allItems = player.gear.filter(i => i.type == ItemType.Armor).concat(vendorArmor).filter(i => i.tier == 'Legendary');
    for (const i of allItems) {
      const bucket = bucketMap[i.inventoryBucket.hash.toString() + i.energyType.toString() + i.classAllowed.toString()];
      if (!bucket) {
        // console.log(`Skipping ${i.name}`);
        continue;
      }
      bucket.gear.push(i);
    }
    for (const bucket of buckets) {
      bucket.gear.sort(VendorService.sortByStats);
      bucket.hasDeal = bucket.gear.length > 0 && bucket.gear[0].vendorItemInfo != null;
    }
    return buckets;
  }

  private getBuckets(): ClassInventoryBucket[] {
    // one per armor slot, one per class
    const buckets = this.destinyCacheService.cache['InventoryBucket'];
    const returnMe: ClassInventoryBucket[] = [];
    const classTypes = [ClassAllowed.Titan, ClassAllowed.Warlock, ClassAllowed.Hunter];
    const energyTypes = [EnergyType.Arc, EnergyType.Thermal, EnergyType.Void];
    for (const key of Object.keys(buckets)) {
      const val: ApiInventoryBucket = buckets[key];
      if (val.index >= 3 && val.index <= 7) {
        for (const classType of classTypes) {
          for (const energyType of energyTypes) {
            returnMe.push({
              bucket: val,
              classType,
              energyType,
              gear: []
            });
          }
        }
      }
    }
    return returnMe;
  }

  public static getUniqueVendorItems(vendors: CharacterVendorData[]): InventoryItem[] {
    // get a unique list of all vendor items
    const vendorGearMap: { [key: string]: InventoryItem; } = {};
    for (const v of vendors) {
      if (!v) {
        continue;
      }
      for (const g of v.data) {
        if (g.id == null) {
          console.dir(g);
        } else {
          vendorGearMap[g.id] = g;
        }
      }
    }
    const allUniqueVendorItems = [];
    // tslint:disable-next-line: forin
    for (const key of Object.keys(vendorGearMap)) {
      const val = vendorGearMap[key];
      allUniqueVendorItems.push(val);
    }
    return allUniqueVendorItems;
  }


  public parseVendorData(char: Character, resp: any): InventoryItem[] {
    if (resp == null || resp.sales == null) { return null; }
    let returnMe = [];
    for (const key of Object.keys(resp.sales.data)) {
      const vendor = resp.sales.data[key];
      const items = this.parseIndividualVendor(resp, char, key, vendor);
      returnMe = returnMe.concat(items);
    }
    for (const i of returnMe) {
      i.lowLinks = this.lowlineService.buildItemLink(i.hash);

    }
    // returnMe.sort((a, b) => {
    //   if (a.tierType < b.tierType) { return 1; }
    //   if (a.tierType > b.tierType) { return -1; }
    //   if (a.name < b.name) { return -1; }
    //   if (a.name > b.name) { return 1; }
    //   return 0;
    // });
    this.preferredStatService.processItems(returnMe);
    return returnMe;
  }

  private parseIndividualVendor(resp: any, char: Character, vendorKey: string, v: any): InventoryItem[] {
    if (v.saleItems == null) { return []; }
    const vDesc: any = this.destinyCacheService.cache.Vendor[vendorKey];
    if (vDesc == null) { return []; }
    if (resp.vendors.data[vendorKey] == null) {
      // vendor isn't here right now;
      return [];
    }
    const vendor: Vendor = {
      hash: vendorKey,
      name: vDesc.displayProperties.name,
      icon: vDesc.displayProperties.icon,
      displayProperties: vDesc.displayProperties,
      nextRefreshDate: resp.vendors.data[vendorKey].nextRefreshDate
    };
    const items: InventoryItem[] = [];
    for (const key of Object.keys(v.saleItems)) {
      const i = v.saleItems[key];
      const oItem = this.parseSaleItem(vendor, char, resp, i);
      if (oItem != null) {
        items.push(oItem);
      }
    }
    return items;
  }



  private parseSaleItem(vendor: Vendor, char: Character, resp: any, i: any): InventoryItem {
    if (i.itemHash == null && i.itemHash === 0) { return null; }
    const index = i.vendorItemIndex;
    const iDesc: any = this.destinyCacheService.cache.InventoryItem[i.itemHash];
    if (iDesc == null) { return null; }
    const itemStats = resp.itemComponents[vendor.hash]?.stats?.data[index];

    let vendorSearchText = '';

    // calculate costs
    const costs: any[] = [];
    if (i.costs) {
      for (const cost of i.costs) {
        if (cost.itemHash == null || cost.itemHash === 0) { continue; }
        const cDesc: any = this.destinyCacheService.cache.InventoryItem[cost.itemHash];
        if (cDesc == null) { continue; }
        costs.push({
          name: cDesc.displayProperties.name,
          hash: cost.itemHash,
          quantity: cost.quantity
        });
        // don't add glimmer, it's not worth searching on
        if (cDesc.displayProperties.name != 'Glimmer') {
          vendorSearchText += cDesc.displayProperties.name + ' ';
        }
      }
    }

    // calculate objectives
    const objectives = [];
    if (iDesc.objectives != null && iDesc.objectives.objectiveHashes != null) {
      for (const oHash of iDesc.objectives.objectiveHashes) {
        const oDesc: any = this.destinyCacheService.cache.Objective[oHash];
        if (oDesc != null) {
          objectives.push({
            total: oDesc.completionValue,
            units: oDesc.progressDescription
          });

          vendorSearchText += oDesc.progressDescription + ' ';
        }
      }
    }

    // calculate rewards
    const values = [];
    if (iDesc.value != null && iDesc.value.itemValue != null) {
      for (const val of iDesc.value.itemValue) {
        if (val.itemHash === 0) { continue; }
        const valDesc: any = this.destinyCacheService.cache.InventoryItem[val.itemHash];
        if (valDesc != null) {
          values.push({
            hash: val.itemHash,
            name: valDesc.displayProperties.name,
            quantity: val.quantity
          });
          vendorSearchText += valDesc.displayProperties.name + ' ';
        }

      }
    }

    // calc item type, move to general call
    let itemType = iDesc.itemType;
    if (iDesc.itemType === ItemType.Mod && iDesc.itemTypeDisplayName.indexOf('Mod') >= 0) {
      itemType = ItemType.GearMod;
    } else if (iDesc.itemType === ItemType.None && iDesc.itemTypeDisplayName != null && iDesc.itemTypeDisplayName.endsWith('Bounty')) {
      itemType = ItemType.Bounty;
    } else if (iDesc.itemType === ItemType.None && iDesc.itemTypeDisplayName == 'Invitation of the Nine') {
      itemType = ItemType.Bounty;
    }

    vendorSearchText += iDesc.displayProperties.name + ' ';
    vendorSearchText += vendor.name + ' ';
    // hack xur text search
    if (vendor.hash === '2190858386') {
      vendorSearchText += 'Xur ';
    }
    vendorSearchText += iDesc.itemTypeAndTierDisplayName + ' ';
    // vendorIndex acts as psuedo instance id, so just set it ahead of processing
    i.itemInstanceId = i.vendorItemIndex;
    // last arg is item progressions, which will always be empty from a vendor
    const data: InventoryItem = this.parseService.parseInvItem(i, char, resp.itemComponents[vendor.hash], true, [], null);
    i.owner = char;
    // emblems, shader recycles, and all sorts of other random stuff will be null here, ignore them
    if (!data) {
      return null;
    }
    data.vendorItemInfo = {
      vendor: vendor,
      status: this.parseSaleItemStatus(i.saleStatus),
      quantity: i.quantity,
      objectives: objectives,
      values: values,
      costs: costs,
      searchText: vendorSearchText.toLowerCase()
    };
    // make item id unique for use later in finding dupes
    data.id = vendor.hash + data.hash + data.id;
    return data;
  }

  public static checkDupes(gear: InventoryItem[]) {
    for (const g of gear) {
      const matches = gear.filter(x => x !== g && x.hash === g.hash);
      if (matches.length > 0) {
        console.log(g.name + ' has dupes');
        console.dir(g);
        console.dir(matches);
      }
    }
  }


  public static findComparableArmor(i: InventoryItem, gear: InventoryItem[], checkEnergyType: boolean, minPowerCap: number): InventoryItem[] {
    const copies = [i];
    // only exotic or legendary
    if (!(i.tier === 'Exotic' || i.tier === 'Legendary')) {
      return null;
    }
    const preciseMatch = i.tier === 'Exotic';
    for (const g of gear) {
      if (g.id == i.id) {
        continue;
      }
      // for exotics we only want to compare the same type of gear,
      // like Dragon's shadow to Dragon's shadow
      if (preciseMatch) {
        if (i.hash != g.hash) {

        }
      }
      if (g.powerCap < minPowerCap) {
        continue;
      }
      if (i.type != g.type) {
        continue;
      }
      if (i.classAllowed != g.classAllowed) {
        continue;
      }
      if (!i.inventoryBucket || !g.inventoryBucket) {
        continue;
      }
      if (i.inventoryBucket.displayProperties.name != g.inventoryBucket.displayProperties.name) {
        continue;
      }

      // don't worry about matching by season
      if (i.tier != g.tier) {
        continue;
      }
      if (checkEnergyType) {
        if (i.seasonalModSlot != g.seasonalModSlot) {
          continue;
        }
      }


      // do we match by burn?
      if (i.energyType != g.energyType) {
        continue;
      }
      copies.push(g);
    }
    return copies;
  }

  private parseSaleItemStatus(s: number): string {
    if ((s & 8) > 0) {
      return 'Already completed';
    } else if ((s & 32) > 0) {
      return 'Not for sale right now';
    } else if ((s & 64) > 0) {
      return 'Not available';
    } else if ((s & 128) > 0) {
      return 'Already held';
    }
    return null;
  }

  private streamReq(operation: string, uri: string): Observable<any> {
    return from(this.bungieService.buildReqOptions()).pipe(
      map(opt => this.httpClient.get<any>(API_ROOT + uri, opt)),
      concatAll(),
      map(this.bungieService.parseBungieResponse),
      catchError(this.handleError<any>(operation, null)),
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (err: any): Observable<T> => {

      if (err.error != null) {
        const j = err.error;
        if (j.ErrorCode && j.ErrorCode !== 1) {
          if (j.ErrorCode === 1665) {
            // ignore this for now
          }
          if (j.ErrorCode === 5) {
            this.bungieService.apiDown = true;
          }
          this.notificationService.fail(j.Message);
          return;
        }
      }
      console.dir(err);
      if (err.status === 0) {
        this.notificationService.fail('Connection refused? Is your internet connected? ' +
          'Are you using something like Privacy Badger? ' +
          'If so, please whitelist Bungie.net or disable it for this site');
      } else if (err.message != null) {
        this.notificationService.fail(err.message);
      } else if (err.status != null) {
        this.notificationService.fail(err.status + ' ' + err.statusText);
      } else {
        this.notificationService.fail('Unexpected problem: ' + err);
      }
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}


export interface ClassInventoryBucket {
  bucket: ApiInventoryBucket;
  classType: ClassAllowed;
  energyType: EnergyType;
  gear: InventoryItem[];
  hasDeal?: boolean;
}
