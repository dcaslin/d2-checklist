import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { currentXur } from '@d2api/date';
import { environment as env } from '@env/environment';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { forkJoin, from, Observable, of, ReplaySubject, Subject } from 'rxjs';
import { catchError, concatAll, map } from 'rxjs/operators';
import { API_ROOT, BungieService } from './bungie.service';
import { DestinyCacheService, ManifestInventoryItem } from './destiny-cache.service';
import {
  ApiInventoryBucket, Character,
  CharacterVendorData, ClassAllowed, InventoryItem, ItemType,
  Player, Vendor,
  VendorCost,
  VendorDynamicStrings
} from './model';
import { NotificationService } from './notification.service';
import { PandaGodrollsService } from './panda-godrolls.service';
import { INTERPOLATION_PATTERN, ParseService } from './parse.service';
import { PreferredStatService } from './preferred-stat.service';


const SOCKET_VENDORS = [
  '672118013',// Banshee-44
  '3442679730',// Xûr
  '350061650',// Ada-1
  '3751514131',// Strange Gear Offers
];

const BULK_VENDORS_KEY = '123';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private charVendorMap: { [key: string]: ReplaySubject<CharacterVendorData> } = {};

  constructor(
    private httpClient: HttpClient,
    private bungieService: BungieService,
    private notificationService: NotificationService,
    private destinyCacheService: DestinyCacheService,
    private preferredStatService: PreferredStatService,
    private pandaGodRollsService: PandaGodrollsService,
    private parseService: ParseService) {
  }

  public load(c: Character, skipCache: boolean): Observable<CharacterVendorData> {
    if (this.charVendorMap[c.characterId] == null) {
      this.charVendorMap[c.characterId] = new ReplaySubject<CharacterVendorData>(1);
    }
    const target = this.charVendorMap[c.characterId];
    if (!skipCache) {
      this.applyCacheVendor(target, c);
    }
    this.applyRemoteVendor(target, c); // call async function that will insta return
    return target.asObservable();
  }


  private static buildVendorDynamicStrings(resp: any): VendorDynamicStrings {
    const returnMe: VendorDynamicStrings = {
      data: {}
    };
    if (resp.stringVariables?.data?.integerValuesByHash) {
      returnMe.data = resp.stringVariables.data.integerValuesByHash;
    }
    return returnMe;

  }

  private async applyRemoteVendor(target: Subject<CharacterVendorData>, c: Character) {

    const components = [
      'Vendors',
      'VendorSales',
      'ItemObjectives',
      'ItemInstances',
      'ItemPerks',
      'ItemStats',
      'ItemSockets',
      'ItemPlugStates',
      'ItemCommonData',
      'ProfileInventories',
      'ItemReusablePlugs',
      'ItemPlugObjectives',
      'StringVariables'
    ]
    // TODO call vendors* for a select set of vendors (or maybe all?)
    // then also fire off a vendor/id for Banshee, Xur &  Strange Gear Offers, replacing those items in the list?
    const bulkUrl = 'Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' + c.characterId + '/Vendors/?components=' + components.join(',');

    const bulkResp = this.streamReq('loadVendors', bulkUrl);

    let requests = [bulkResp];
    for (const key of SOCKET_VENDORS) {
      const socketVendorUrl = 'Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' + c.characterId + '/Vendors/' + key + '?components=' + components.join(',');
      requests.push(this.streamReq('loadVendors', socketVendorUrl))
    }
    // fork join all the requests
    const resps = await forkJoin(requests).toPromise();
    let cntr = 0;
    const responseHolder: { [key: string]: any } = {};
    for (const r of resps) {
      if (cntr == 0) {
        responseHolder[BULK_VENDORS_KEY] = r;
      } else {
        responseHolder[SOCKET_VENDORS[cntr - 1]] = r;
      }
      cntr++
    }

    const returnMe: CharacterVendorData = {
      char: c,
      data: await this.parseVendorData(c, responseHolder),
      cached: false
    };
    // if that worked out well, cache it for next time
    await this.setCachedVendor(c, responseHolder);
    target.next(returnMe);
  }

  private async applyCacheVendor(target: Subject<CharacterVendorData>, c: Character) {
    const responsesHolder: { [key: string]: any } = {};
    const bulkResp = await this.getCachedVendor(c, BULK_VENDORS_KEY);
    if (bulkResp == null) {
      return;
    }
    responsesHolder[BULK_VENDORS_KEY] = bulkResp;
    for (const key of SOCKET_VENDORS) {
      const vendorData = await this.getCachedVendor(c, key);
      if (vendorData == null) {
        return;
      }
      responsesHolder[key] = vendorData;
    }

    const returnMe: CharacterVendorData = {
      char: c,
      data: await this.parseVendorData(c, responsesHolder),
      cached: true,
      ts: bulkResp.ts,
      loading: true
    };
    target.next(returnMe);
  }

  private static getVendorCacheKey(c: Character, vendorId: string) {
    const key = 'vendor2-' + env.versions.app + '-' + c.membershipType + '-' + c.membershipId + ' - ' + c.characterId + '-' + vendorId;
    return key;
  }

  private async getCachedVendor(c: Character, vendorId: string): Promise<any> {
    const key = VendorService.getVendorCacheKey(c, vendorId);
    const cachedResponse = await idbGet(key);
    return cachedResponse;
  }

  private async setCachedVendor(c: Character, responsesHolder: { [key: string]: any }) {

    for (const key of Object.keys(responsesHolder)) {
      const resp = responsesHolder[key];
      if (resp == null) {
        continue;
      }
      // shallow copy
      const cacheMe = Object.assign({}, resp);
      cacheMe.cached = true;
      cacheMe.ts = Date.now();
      const cacheKey = VendorService.getVendorCacheKey(c, key);
      return await idbSet(cacheKey, cacheMe);
    }
  }

  public async calcDeals(player: Player, vendors: CharacterVendorData[]): Promise<VendorDeals> {
    const vendorsLoading = vendors.filter(x => x == null).length;
    if (!player) {
      return {
        playerLoading: true,
        vendorsLoading,
        totalVendors: vendors.length,
        legendary: [],
        exotic: [],
        collection: [],
        bansheeWeapons: []
      };
    }
    const vendorItems = VendorService.getUniqueVendorItems(vendors);
    const interestingVendorArmor = vendorItems.filter(val => val.type === ItemType.Armor && (val.tier == 'Legendary' || val.tier == 'Exotic') && val.powerCap >= 1310);
    const interestingVendorWeapons = vendorItems.filter(val => val.type === ItemType.Weapon && (val.tier == 'Legendary' || val.tier == 'Exotic') && (val?.vendorItemInfo?.vendor?.name == 'Xûr' || val?.vendorItemInfo?.vendor?.name == 'Banshee-44') && (val.pandaPve > 0 || val.pandaPvp > 0));
    const bansheeWeapons = this.findBansheeDeals(player, interestingVendorWeapons);
    // look just at legendary armor grouped by class and bucket
    const legendaryDeals = await this.findLegendaryArmorDeals(player, interestingVendorArmor);
    const goodLegendaryDeals = legendaryDeals.filter(i => i.hasDeal);
    // if any vendor exotic armor (Xur), look exactly by item type
    const exoticDeals = this.findExoticArmorDeals(player, interestingVendorArmor);
    const collectionItems = this.checkCollections(player, vendorItems);
    // const exchange = await this.getExchangeInfo(player, vendorItems);
    const returnMe = {
      playerLoading: false,
      vendorsLoading,
      totalVendors: vendors.length,
      legendary: goodLegendaryDeals,
      exotic: exoticDeals,
      collection: collectionItems,
      bansheeWeapons: bansheeWeapons
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
    // if they're equal, owned gear wins
    if (a.vendorItemInfo && !b.vendorItemInfo) {
      return 1;
    }
    if (!a.vendorItemInfo && b.vendorItemInfo) {
      return -1;
    }
    return 0;
  }

  private checkCollectionForVendor(player: Player, vendorItems: InventoryItem[], vendorHash: string, checkType: ItemType) {
    const checkMe = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == vendorHash && i.type == checkType);
    const returnMe = [];
    for (const c of checkMe) {

      // this check caused Ada shaders to not show up, hopefully no side-effects
      // if (c.vendorItemInfo?.status !== null) {
      //   continue;
      // }
      if (c.collectibleHash) {
        const collectionItem = player.searchableCollection.find(i => i.hash == c.collectibleHash);
        if (!collectionItem || !collectionItem.complete) {
          returnMe.push(c);
        }
      }
    }
    // filter to be unique by hash
    return returnMe.filter((a, b) => {
      const first = returnMe.find(x => x.hash === a.hash);
      return returnMe.indexOf(first) === b;
    });
  }

  private checkCollections(player: Player, vendorItems: InventoryItem[]): VendorCollection[] {
    // type == 99 and seller is banshee (for gun mods), compare to collections? "Rampage Spec Banshee-44 672118013" 1990124610
    // type == 100 and seller is tess, compare to collections "Resilient Laurel Tess Everis 3361454721"
    const returnMe: VendorCollection[] = [];
    if (vendorItems?.length == 0) {
      return returnMe;
    }


    const shaderVendors = [
      '3361454721', // tess
      '350061650', // ada
    ];
    for (const v of shaderVendors) {
      const shaders = this.checkCollectionForVendor(player, vendorItems, v, ItemType.Shader);
      console.log(`Found ${shaders.length} shaders for ${v}`)
      if (shaders.length > 0) {
        returnMe.push({
          vendor: shaders[0].vendorItemInfo.vendor,
          data: shaders
        });
      }
    }

    const armorVendors = [
      '350061650', // ada
      '2190858386', // xur
    ];
    for (const v of armorVendors) {
      const armor = this.checkCollectionForVendor(player, vendorItems, v, ItemType.Armor);
      if (armor.length > 0) {
        returnMe.push({
          vendor: armor[0].vendorItemInfo.vendor,
          data: armor
        });
      }
    }
    const weaponVendors = [
      '672118013', // banshee
      '2190858386', // xur
      '3751514131', // Strange Gear Offers
    ];
    for (const v of weaponVendors) {
      const weapons = this.checkCollectionForVendor(player, vendorItems, v, ItemType.Weapon);
      if (weapons.length > 0) {
        returnMe.push({
          vendor: weapons[0].vendorItemInfo.vendor,
          data: weapons
        });
      }
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
    if (!targetCost) {
      // these are items that unlock via progression, ignore them
      return;
    }
    const count = costs[targetCost.desc.hash];
    v.cost = targetCost;
    v.costCount = count;
  }

  private static getCostHash(name: string, hash: string): string {
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
    if (name == 'Purchase Enhancement Prisms') { return '4257549984'; }
    if (name == 'Purchase Enhancement Cores') { return '3853748946'; }
    return hash;
  }

  private async getExchangeInfo(player: Player, vendorItems: InventoryItem[]): Promise<VendorCurrencies[]> {
    // type == 101 is all spider currency exchange "Purchase Enhancement Prisms Spider 863940356"
    // type == 10 and seller is banshee ("Upgrade Module Banshee-44 672118013") is upgrade modules, prisms, and shards
    const bansheeConsumables = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == '672118013' && i.type == ItemType.ExchangeMaterial);
    // const adaConsumables  = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == '350061650' && i.type == ItemType.ExchangeMaterial);
    const rahoolCurrency = vendorItems.filter(i => i.vendorItemInfo?.vendor?.hash == '2255782930' && (i.type == ItemType.CurrencyExchange || i.type == ItemType.ExchangeMaterial));

    const costs: { [key: string]: number; } = {};
    for (const g of rahoolCurrency.concat(bansheeConsumables)) {
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
    const rahoolItems: VendorCurrency[] = [];
    for (const g of rahoolCurrency) {
      // skip enhancement cores and prisms
      // if (g.name.indexOf('Enhancement') >= 0) {
      //   continue;
      // }
      const targetHash = VendorService.getCostHash(g.name, g.hash);
      const targetDesc: ManifestInventoryItem = await this.destinyCacheService.getInventoryItem(targetHash);
      let targetCount;
      if (targetHash == '1022552290' || targetHash == '3159615086') { // legendary shards or glimmer
        const currency = player.currencies.find(x => x.hash == targetHash);
        if (currency != null) {
          targetCount = currency.count;
        }
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
      rahoolItems.push(v);
    }
    if (rahoolItems.length > 0) {
      returnMe.push({
        vendor: rahoolItems[0].saleItem.vendorItemInfo.vendor,
        data: rahoolItems
      });
    }
    const bansheeItems: VendorCurrency[] = [];
    for (const g of bansheeConsumables) {
      const targetCount = player.gear.filter(i => i.hash == g.hash).reduce((result, item) => { return result + item.quantity; }, 0);
      const targetDesc: ManifestInventoryItem = await this.destinyCacheService.getInventoryItem(g.hash);
      const v: VendorCurrency = {
        saleItem: g,
        target: targetDesc,
        targetCount,
        cost: null,
        costCount: null
      };
      VendorService.setCost(costs, v);
      if (v.cost != null) {
        bansheeItems.push(v);
      }
    }
    if (bansheeItems.length > 0) {
      returnMe.push({
        vendor: bansheeItems[0].saleItem.vendorItemInfo.vendor,
        data: bansheeItems
      });
    }

    return returnMe;
  }

  private static getMarginalValue(gear: InventoryItem[]): number {
    const dealValue = gear[0].preferredStatPoints;
    let bestHeld = 0;
    for (const g of gear) {
      if (g.vendorItemInfo == null) {
        bestHeld = g.preferredStatPoints;
        break;
      }
    }
    return dealValue - bestHeld;
  }

  private findExoticArmorDeals(player: Player, vendorArmor: InventoryItem[]): ExoticInventoryBucket[] {
    const vendorExotics = vendorArmor.filter(i => i.tier == 'Exotic');
    const playerAndVendorExotics = player.gear.filter(i => i.type == ItemType.Armor).concat(vendorArmor).filter(i => i.tier == 'Exotic');
    const deals: ExoticInventoryBucket[] = [];
    for (const v of vendorExotics) {
      const copies = playerAndVendorExotics.filter(i => i.hash == v.hash);
      copies.sort(VendorService.sortByStats);
      // it's a deal if it's a vendor item and it has any pref pts, pref pts = 0 means they don't want to see this class
      if (copies[0].vendorItemInfo != null && copies[0].preferredStatPoints > 0) {
        deals.push({
          gear: copies,
          marginalValue: VendorService.getMarginalValue(copies)
        });
      }
    }
    return deals;
  }

  private findBansheeDeals(player: Player, vendorWeapons: InventoryItem[]): InventoryItem[][] {

    const playerWeapons = player.gear.filter(i => i.type == ItemType.Weapon).filter(i => (i.tier == 'Legendary' || i.tier == 'Exotic'));
    this.pandaGodRollsService.processItems(playerWeapons);
    const returnMe: InventoryItem[][] = [];
    for (const vi of vendorWeapons) {
      const pw = playerWeapons.filter(i => i.hash == vi.hash);
      const all = [vi].concat(pw);
      returnMe.push(all);
    }
    return returnMe;
  }

  private async findLegendaryArmorDeals(player: Player, vendorArmor: InventoryItem[]) {
    this.preferredStatService.processGear(player);
    const bucketMap: { [key: string]: ClassInventoryBucket; } = {};
    const buckets = await this.getBuckets();
    for (const bucket of buckets) {
      bucketMap[bucket.bucket.hash.toString() + bucket.classType.toString()] = bucket;
    }
    const allItems = player.gear.filter(i => i.type == ItemType.Armor).concat(vendorArmor).filter(i => i.tier == 'Legendary');
    for (const i of allItems) {
      const bucket = bucketMap[i.inventoryBucket.hash.toString() + i.classAllowed.toString()];
      if (!bucket) {
        // console.log(`Skipping ${i.name}`);
        continue;
      }
      bucket.gear.push(i);
    }
    for (const bucket of buckets) {
      bucket.gear.sort(VendorService.sortByStats);
      // it's a deal if it's a vendor item and it has any pref pts, pref pts = 0 means they don't want to see this class
      bucket.hasDeal = bucket.gear.length > 0 && bucket.gear[0].vendorItemInfo != null && bucket.gear[0].preferredStatPoints > 0;
      if (bucket.hasDeal) {
        bucket.marginalValue = VendorService.getMarginalValue(bucket.gear);
      }
    }
    return buckets;
  }

  private async getBuckets(): Promise<ClassInventoryBucket[]> {
    // one per armor slot, one per class
    const buckets = await this.destinyCacheService.getInventoryBucketTable();
    const returnMe: ClassInventoryBucket[] = [];
    const classTypes = [ClassAllowed.Titan, ClassAllowed.Warlock, ClassAllowed.Hunter];
    for (const key of Object.keys(buckets)) {
      const val: ApiInventoryBucket = buckets[key];
      if (val.index >= 3 && val.index <= 7) {
        for (const classType of classTypes) {
          returnMe.push({
            bucket: val,
            classType,
            gear: [],
            marginalValue: 0
          });
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
    for (const key of Object.keys(vendorGearMap)) {
      const val = vendorGearMap[key];
      allUniqueVendorItems.push(val);
    }
    return allUniqueVendorItems;
  }


  private async parseVendorData(char: Character, responses: { [key: string]: any }): Promise<InventoryItem[]> {
    // make sure we have all the data we need
    if (responses == null) { return null; }
    for (const key of Object.keys(responses)) {
      const resp = responses[key];
      if (resp == null) {
        return null;
      }
    }
    let returnMe = [];

    for (let responseKey in responses) {
      const resp = responses[responseKey];
      const dynamicStrings = VendorService.buildVendorDynamicStrings(resp);
      if (responseKey == BULK_VENDORS_KEY) {
        // this is our bulk pile of vendors without sockets
        for (const vendorKey of Object.keys(resp.sales.data)) {
          // if this is in our socket vendors list, skip it, we'll get it directly below
          if (SOCKET_VENDORS.indexOf(vendorKey) >= 0) {
            continue;
          }
          const vendor = resp.sales.data[vendorKey];
          const items: InventoryItem[] = await this.parseIndividualVendor(resp, char, vendorKey, vendor.saleItems, dynamicStrings, resp.vendors.data[vendorKey]);
          returnMe = returnMe.concat(items);
        }


      } else {
        // skip xur if he's not around
        if ((responseKey == '2190858386' || responseKey =='3751514131') && !currentXur()) {
          continue;
        }
        // this is an individual socket vendor
        const respVendorData = resp.vendor.data;
        const items: InventoryItem[] = await this.parseIndividualVendor(resp, char, responseKey, resp.sales.data, dynamicStrings, respVendorData);
        returnMe = returnMe.concat(items);
      }
    }
    this.preferredStatService.processItems(returnMe);
    this.pandaGodRollsService.processItems(returnMe);
    return returnMe;
  }

  private async parseIndividualVendor(resp: any, char: Character, vendorKey: string, saleItems: any, dynamicStrings: VendorDynamicStrings, respVendorData: any): Promise<InventoryItem[]> {
    if (saleItems == null) { return []; }
    const vDesc: any = await this.destinyCacheService.getVendor(vendorKey);
    if (vDesc == null) { return []; }
    if (respVendorData == null) {
      // vendor isn't here right now;
      return [];
    }
    const vendor: Vendor = {
      hash: vendorKey,
      name: vDesc.displayProperties.name,
      icon: vDesc.displayProperties.icon,
      displayProperties: vDesc.displayProperties,
      nextRefreshDate: respVendorData.nextRefreshDate
    };
    const items: InventoryItem[] = [];
    for (const key of Object.keys(saleItems)) {
      const i = saleItems[key];
      const oItem = await this.parseSaleItem(vendor, char, resp, i, dynamicStrings);
      if (oItem != null) {
        items.push(oItem);
      }
    }
    return items;
  }



  private async parseSaleItem(vendor: Vendor, char: Character, resp: any, i: any, dynamicStrings: VendorDynamicStrings): Promise<InventoryItem> {
    if (i.itemHash == null && i.itemHash === 0) { return null; }
    const iDesc: any = await this.destinyCacheService.getInventoryItem(i.itemHash);
    if (iDesc == null) { return null; }
    let vendorSearchText = '';
    // calculate costs
    const costs: VendorCost[] = [];
    if (i.costs) {
      for (const cost of i.costs) {
        if (cost.itemHash == null || cost.itemHash === 0) { continue; }
        const cDesc: ManifestInventoryItem = await this.destinyCacheService.getInventoryItem(cost.itemHash);
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
        const oDesc: any = await this.destinyCacheService.getObjective(oHash);
        let progDescText = VendorService.dynamicVendorStringReplace(oDesc.progressDescription, null, dynamicStrings)
        if (oDesc != null) {
          objectives.push({
            total: oDesc.completionValue,
            units: progDescText
          });

          vendorSearchText += progDescText + ' ';
        }
      }
    }

    // calculate rewards
    const values = [];
    if (iDesc.value != null && iDesc.value.itemValue != null) {
      for (const val of iDesc.value.itemValue) {
        if (val.itemHash === 0) { continue; }
        const valDesc: any = await this.destinyCacheService.getInventoryItem(val.itemHash);
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
    // single vendor will have this directly, all vendors will require a lookup
    let itmComp = resp.itemComponents[vendor.hash] ? resp.itemComponents[vendor.hash] : resp.itemComponents;
    // last arg is item progressions, which will always be empty from a vendor
    const data: InventoryItem = await this.parseService.parseInvItem(i, char, itmComp, true, [], null);
    i.owner = char;
    // emblems, shader recycles, and all sorts of other random stuff will be null here, ignore them
    if (!data) {
      return null;
    }
    // these are unlockable rewards, not things for sale
    if (costs.length === 0) {
      return null;
    }
    vendorSearchText += data.searchText;
    data.vendorItemInfo = {
      vendor: vendor,
      status: await this.parseSaleItemStatus(vendor.hash, i.failureIndexes),
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


  public static dynamicVendorStringReplace(text: string, characterId: string, dynamicStrings: VendorDynamicStrings): string {
    // Thanks DIM!
    return text.replace(INTERPOLATION_PATTERN, (segment) => {
      const hash = segment.match(/\d+/)![0];
      const dynamicValue = dynamicStrings?.data[hash];
      return dynamicValue?.toString() ?? segment;
    });
  }

  private async parseSaleItemStatus(vendorHash: string, failureIndexes: number[]): Promise<string> {
    if (failureIndexes == null || failureIndexes.length == 0) {
      return null;
    }
    const index = failureIndexes[0];
    const vDesc: any = await this.destinyCacheService.getVendor(vendorHash);
    if (!vDesc || !vDesc.failureStrings || vDesc.failureStrings.length <= index) {
      return 'Unknown';
    }
    return vDesc.failureStrings[index];
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
  marginalValue: number;
}


export interface ClassInventoryBucket {
  bucket: ApiInventoryBucket;
  classType: ClassAllowed;
  gear: InventoryItem[];
  marginalValue: number;
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
  bansheeWeapons: InventoryItem[][];
}
