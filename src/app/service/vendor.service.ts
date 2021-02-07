import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment as env } from '@env/environment';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { concat, from, Observable, of } from 'rxjs';
import { catchError, concatAll, map } from 'rxjs/operators';
import { API_ROOT, BungieService } from './bungie.service';
import { DestinyCacheService, ManifestInventoryItem } from './destiny-cache.service';
import { LowLineService } from './lowline.service';
import {
  ApiInventoryBucket, Character,
  CharacterVendorData, ClassAllowed,
  EnergyType, InventoryItem, ItemType,
  Player, Vendor,
  VendorCost
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

  // this will quickly emit the cached vendor data and then later emit the current data
  // if refresh is true then we won't bother to load from cache
  public loadVendors(c: Character, skipCache: boolean): Observable<CharacterVendorData> {
    const url = 'Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' +
      c.characterId + '/Vendors/?components=Vendors,VendorSales,ItemObjectives, ItemInstances, ItemPerks, ItemStats, ItemSockets, ItemPlugStates, ItemTalentGrids, ItemCommonData, ProfileInventories, ItemReusablePlugs, ItemPlugObjectives';
    const remoteReq =  this.streamReq('loadVendors', url).pipe(
        map((resp) => {
          // parse it
          const returnMe = {
            char: c,
            data: this.parseVendorData(c, resp),
            cached: false
          };
          // if that worked out well, cache it for next time
          this.setCachedVendor(c, resp);
          return returnMe;
        })
      );
    if (skipCache) {
      return remoteReq;
    }
    const cacheReq = from(this.getCachedVendor(c)).pipe(
      map((resp) => {
        if (resp == null) {
          return null;
        }
        return {
          char: c,
          data: this.parseVendorData(c, resp),
          cached: true,
          ts: resp.ts,
          loading: true
        };
      })
    );
    return concat(cacheReq, remoteReq);
  }

  private static getVendorCacheKey(c: Character) {
    const key = 'vendor2-' + env.versions.app + '-' + c.membershipType + '-' + c.membershipId + ' - ' + c.characterId;
    return key;
  }

  private async getCachedVendor(c: Character): Promise<any> {
    const key = VendorService.getVendorCacheKey(c);
    const cachedResponse = await idbGet(key);
    return cachedResponse;
  }

  private async setCachedVendor(c: Character, resp: any): Promise<any> {
    // shallow copy
    const cacheMe = Object.assign({}, resp);
    cacheMe.cached = true;
    cacheMe.ts = Date.now();
    const key = VendorService.getVendorCacheKey(c);
    return await idbSet(key, cacheMe);
  }

  public calcDeals(player: Player, vendors: CharacterVendorData[]): VendorDeals {
    const vendorsLoading = vendors.filter(x => x == null).length;
    if (!player) {
      return {
        playerLoading: true,
        vendorsLoading,
        totalVendors: vendors.length,
        legendary: [],
        exotic: [],
        collection: [],
        exchange: []
      };
    }
    const vendorItems = VendorService.getUniqueVendorItems(vendors);
    const interestingVendorArmor = vendorItems.filter(val => val.type === ItemType.Armor && (val.tier == 'Legendary' || val.tier == 'Exotic') && val.powerCap >= 1310);
    // look just at legendary armor grouped by class and bucket
    const legendaryDeals = this.findLegendaryArmorDeals(player, interestingVendorArmor);
    const goodLegendaryDeals = legendaryDeals.filter(i => i.hasDeal);
    // if any vendor exotic armor (Xur), look exactly by item type
    // TODO any exotics you don't have yet as well
    // TODO give list of that exotic to compare
    const exoticDeals = this.findExoticArmorDeals(player, interestingVendorArmor);
    const collectionItems = this.checkCollections(player, vendorItems);
    const exchange = this.getExchangeInfo(player, vendorItems);
    const returnMe = {
      playerLoading: false,
      vendorsLoading,
      totalVendors: vendors.length,
      legendary: goodLegendaryDeals,
      exotic: exoticDeals,
      collection: collectionItems,
      exchange: exchange
    };
    return returnMe;
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

  private checkCollectionForVendor(player: Player, vendorItems: InventoryItem[], vendorHash: string, checkType: ItemType) {
    const checkMe = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == vendorHash && i.type == checkType);
    const returnMe = [];
    for (const c of checkMe) {
      if (c.collectibleHash) {
        const collectionItem = player.searchableCollection.find(i => i.hash == c.collectibleHash);
        if (!collectionItem || !collectionItem.complete) {
          returnMe.push(c);
        }
      }
    }
    return returnMe;
  }

  private checkCollections(player: Player, vendorItems: InventoryItem[]): VendorCollection[] {
    // type == 99 and seller is banshee (for gun mods), compare to collections? "Rampage Spec Banshee-44 672118013" 1990124610
    // type == 100 and seller is tess, compare to collections "Resilient Laurel Tess Everis 3361454721"
    const returnMe: VendorCollection[] = [];
    const xurArmor = this.checkCollectionForVendor(player, vendorItems, '2190858386', ItemType.Armor);
    if (xurArmor.length > 0) {
      returnMe.push({
        vendor: xurArmor[0].vendorItemInfo.vendor,
        data: xurArmor
      });
    }
    const bansheeMods = this.checkCollectionForVendor(player, vendorItems, '672118013', ItemType.GearMod);
    if (bansheeMods.length > 0) {
      returnMe.push({
        vendor: bansheeMods[0].vendorItemInfo.vendor,
        data: bansheeMods
      });
    }
    const tessShaders = this.checkCollectionForVendor(player, vendorItems, '3361454721', ItemType.Shader);
    if (tessShaders.length > 0) {
      returnMe.push({
        vendor: tessShaders[0].vendorItemInfo.vendor,
        data: tessShaders
      });
    }
    return returnMe;
  }

  private static setCost(costs: { [key: string]: number; }, v: VendorCurrency) {
    let targetCost: VendorCost;
    // if it has one cost, use it
    // otherwise find the redeemable
    if (v.saleItem.vendorItemInfo.costs.length == 1) {
      targetCost = v.saleItem.vendorItemInfo.costs[0];
    } else {
      targetCost = v.saleItem.vendorItemInfo.costs.find(c => c.desc.itemTypeDisplayName == 'Redeemable');
    }
    const count = costs[targetCost.desc.hash];
    v.cost = targetCost;
    v.costCount = count;
  }

  private static getCostHash(name: string): string {
    if (name == 'Purchase Baryon Boughs') { return '592227263'; }
    if (name == 'Purchase Phaseglass') { return '1305274547'; }
    if (name == 'Purchase Simulation Seeds') { return '49145143'; }
    if (name == 'Purchase Glacial Starwort') { return '1485756901'; }
    if (name == 'Purchase Datalattice') { return '3487922223'; }
    if (name == 'Purchase Helium Filaments') { return '3592324052'; }
    if (name == 'Purchase Seraphite') { return '31293053'; }
    if (name == 'Purchase Legendary Shards') { return '1022552290'; }
    if (name == 'Purchase Etheric Spiral') { return '1177810185'; }
    if (name == 'Purchase Glimmer') { return '3159615086'; }
    if (name == 'Purchase Dusklight Shards') { return '950899352'; }
    if (name == 'Purchase Spinmetal Leaves') { return '293622383'; }
    if (name == 'Purchase Alkane Dust') { return '2014411539'; }
    return null;
  }

  private getExchangeInfo(player: Player, vendorItems: InventoryItem[]): VendorCurrencies[] {
    // type == 101 is all spider currency exchange "Purchase Enhancement Prisms Spider 863940356"
    // type == 10 and seller is banshee ("Upgrade Module Banshee-44 672118013") is upgrade modules, prisms, and shards
    const bansheeConsumables = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == '672118013' && i.type == ItemType.ExchangeMaterial);
    const spiderCurrency = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == '863940356' && i.type == ItemType.CurrencyExchange);
    const costs: { [key: string]: number; } = {};
    for (const g of spiderCurrency.concat(bansheeConsumables)) {
      for (const c of g.vendorItemInfo.costs) {
        costs[c.desc.hash] = 0;
      }
    }
    for (const key of Object.keys(costs)) {
      if (key == '1022552290' || key == '3159615086') { // legendary shards or glimmer
        const currency = player.currencies.find(x => x.hash == key);
        if (currency) {
          costs[key] = currency.count;
        }
      } else {
        costs[key] = player.gear.filter(i => i.hash == key).reduce((result, item) => { return result + item.quantity; }, 0);
      }
    }

    const returnMe: VendorCurrencies[] = [];
    const spiderItems: VendorCurrency[] = [];
    for (const g of spiderCurrency) {
      // skip enhancement cores and prisms
      if (g.name.indexOf('Enhancement') >= 0) {
        continue;
      }
      const targetHash = VendorService.getCostHash(g.name);
      const targetDesc: ManifestInventoryItem = this.destinyCacheService.cache.InventoryItem[targetHash];
      let targetCount;
      if (targetHash == '1022552290' || targetHash == '3159615086') { // legendary shards or glimmer
        const currency = player.currencies.find(x => x.hash == targetHash);
        targetCount = currency.count;
      } else {
        targetCount = player.gear.filter(i => i.hash == targetHash).reduce((result, item) => { return result + item.quantity; }, 0);
      }
      const v: VendorCurrency = {
        saleItem: g,
        target: targetDesc,
        targetCount,
        cost: null,
        costCount: null
      };
      VendorService.setCost(costs, v);
      spiderItems.push(v);
    }
    if (spiderItems.length > 0) {
      returnMe.push({
        vendor: spiderItems[0].saleItem.vendorItemInfo.vendor,
        data: spiderItems
      });
    }
    const bansheeItems: VendorCurrency[] = [];
    for (const g of bansheeConsumables) {
      const targetCount = player.gear.filter(i => i.hash == g.hash).reduce((result, item) => { return result + item.quantity; }, 0);
      const targetDesc: ManifestInventoryItem = this.destinyCacheService.cache.InventoryItem[g.hash];
      const v: VendorCurrency = {
        saleItem: g,
        target: targetDesc,
        targetCount,
        cost: null,
        costCount: null
      };
      VendorService.setCost(costs, v);
      bansheeItems.push(v);
    }
    if (bansheeItems.length > 0) {
      returnMe.push({
        vendor: bansheeItems[0].saleItem.vendorItemInfo.vendor,
        data: bansheeItems
      });
    }
    return returnMe;
  }

  private findExoticArmorDeals(player: Player, vendorArmor: InventoryItem[]): ExoticInventoryBucket[] {
    const vendorExotics = vendorArmor.filter(i => i.tier == 'Exotic');
    const playerExotics = player.gear.filter(i => i.type == ItemType.Armor).concat(vendorArmor).filter(i => i.tier == 'Exotic');
    const deals: ExoticInventoryBucket[] = [];
    for (const v of vendorExotics) {
      const copies = playerExotics.filter(i => i.hash == v.hash);
      copies.push(v);
      copies.sort(VendorService.sortByStats);
      if (copies[0].vendorItemInfo != null) {
        deals.push({
          gear: copies
        });
      }
    }
    return deals;
  }

  private findLegendaryArmorDeals(player: Player, vendorArmor: InventoryItem[]) {
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

  private static getUniqueVendorItems(vendors: CharacterVendorData[]): InventoryItem[] {
    // get a unique list of all vendor items
    const vendorGearMap: { [key: string]: InventoryItem; } = {};
    for (const v of vendors) {
      if (!v || !v.data) {
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


  private parseVendorData(char: Character, resp: any): InventoryItem[] {
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
    this.parseService.applyTagsToItem(returnMe);
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
    const iDesc: any = this.destinyCacheService.cache.InventoryItem[i.itemHash];
    if (iDesc == null) { return null; }
    let vendorSearchText = '';
    // calculate costs
    const costs: VendorCost[] = [];
    if (i.costs) {
      for (const cost of i.costs) {
        if (cost.itemHash == null || cost.itemHash === 0) { continue; }
        const cDesc: ManifestInventoryItem = this.destinyCacheService.cache.InventoryItem[cost.itemHash];
        if (cDesc == null) { continue; }
        costs.push({
          desc: cDesc,
          count: cost.quantity as number
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

  private static checkDupes(gear: InventoryItem[]) {
    for (const g of gear) {
      const matches = gear.filter(x => x !== g && x.hash === g.hash);
      if (matches.length > 0) {
        console.log(g.name + ' has dupes');
        console.dir(g);
        console.dir(matches);
      }
    }
  }


  private static findComparableArmor(i: InventoryItem, gear: InventoryItem[], checkEnergyType: boolean, minPowerCap: number): InventoryItem[] {
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

export interface ExoticInventoryBucket {
  gear: InventoryItem[];
}


export interface ClassInventoryBucket {
  bucket: ApiInventoryBucket;
  classType: ClassAllowed;
  energyType: EnergyType;
  gear: InventoryItem[];
  hasDeal?: boolean;
}

export interface VendorCollection {
  vendor: Vendor;
  data: InventoryItem[];
}

export interface VendorCurrencies {
  vendor: Vendor;
  data: VendorCurrency[];
}

export interface VendorCurrency {
  saleItem: InventoryItem;

  target: ManifestInventoryItem;
  targetCount: number;

  cost: VendorCost;
  costCount: number;
}

export interface VendorDeals {
  playerLoading: boolean;
  vendorsLoading: number;
  totalVendors: number;
  legendary: ClassInventoryBucket[];
  exotic: ExoticInventoryBucket[];
  collection: VendorCollection[];
  exchange: VendorCurrencies[];
}
