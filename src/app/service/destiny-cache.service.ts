import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cookError, isSearchBot, safeStringifyError } from '@app/shared/utilities';
import { environment as env } from '@env/environment';
import { del, get, keys, set } from 'idb-keyval';
import { BehaviorSubject, Observable, of, ReplaySubject, throwError } from 'rxjs';
import { catchError, isEmpty, last, retry, tap } from 'rxjs/operators';
import { unzipSync, strFromU8 } from 'fflate';
import { ThisReceiver } from '@angular/compiler';
import { faFunction } from '@fortawesome/pro-light-svg-icons';

const LOG_CSS = `color: orangered`;

@Injectable()
export class DestinyCacheService {
  public cache: Cache;
  public cacheLite: CacheLite;
  private memCache: { [key: string]: any } = {};
  private observableMap: { [key: string]: ReplaySubject<any> } = {};

  public readonly ready$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly version$: BehaviorSubject<string> = new BehaviorSubject('');
  public readonly checkingCache: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly percent: BehaviorSubject<number> = new BehaviorSubject(0);
  public readonly unzipping: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly error: BehaviorSubject<string> = new BehaviorSubject(null);
  public readonly errorDetails: BehaviorSubject<any> = new BehaviorSubject(null);
  public readonly searchBot: boolean = isSearchBot();

  constructor(private http: HttpClient) {
    if (!this.searchBot) {
      this.init2();
      this.init();
    }
  }

  public observableOfInventoryItem(): Observable<{ [key: string]: ManifestInventoryItem }> {
    return this.observableOf('InventoryItem');
  }

  public observableOfMilestone(): Observable<{ [key: string]: any }> {
    return this.observableOf('Milestone');
  }

  public observableOfVendor(): Observable<{ [key: string]: any }> {
    return this.observableOf('Vendor');
  }

  private observableOf(tableName: string): Observable<{ [key: string]: any }> {
    if (!this.observableMap[tableName]) {
      this.observableMap[tableName] = new ReplaySubject(1);
      this.getManifestTable(tableName);
    }
    return this.observableMap[tableName];
  }


  public getCacheInventoryItem(key: string): ManifestInventoryItem {
    return this.cache.InventoryItem[key];
  }


  public getCoreSettings(): Destiny2CoreSettings {
    return this.cacheLite.destiny2CoreSettings;
  }

  public async getProgression(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Progression');
    return table[key + ''];
  }

  public async getRecord(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Record');
    return table[key + ''];
  }

  public async getSocketType(key: string | number): Promise<any> {
    const table = await this.getManifestTable('SocketType');
    return table[key + ''];
  }

  public async getVendor(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Vendor');
    return table[key + ''];
  }

  public async getPlugSet(key: string | number): Promise<any> {
    const table = await this.getManifestTable('PlugSet');
    return table[key + ''];
  }

  public async getInventoryBucketTable (): Promise<any> {
    return await this.getManifestTable('InventoryBucket');
  }

  public async getInventoryBucket(key: string | number): Promise<any> {
    const table = await this.getManifestTable('InventoryBucket');
    return table[key + ''];
  }

  public async getHistoricalStats(key: string | number): Promise<any> {
    const table = await this.getManifestTable('HistoricalStats');
    return table[key + ''];
  }

  public async getPerk(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Perk');
    return table[key + ''];
  }

  public async getFaction(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Faction');
    return table[key + ''];
  }


  public async getPresentationNode(key: string | number): Promise<any> {
    const table = await this.getManifestTable('PresentationNode');
    return table[key + ''];
  }


  public async getActivity(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Activity');
    return table[key + ''];
  }

  public async getActivityMode(key: string | number): Promise<any> {
    const table = await this.getManifestTable('ActivityMode');
    return table[key + ''];
  }

  public async getActivityType(key: string | number): Promise<any> {
    const table = await this.getManifestTable('ActivityType');
    return table[key + ''];
  }
  public async getChecklist(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Checklist');
    return table[key + ''];
  }

  public async getCollectible(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Collectible');
    return table[key + ''];
  }

  public async getActivityModifier(key: string | number): Promise<any> {
    const table = await this.getManifestTable('ActivityModifier');
    return table[key + ''];
  }

  public async getMilestone(key: string | number): Promise<any> {
    const table = await this.getManifestTable('Milestone');
    return table[key + ''];
  }

  public async getObjective(key: string | number): Promise<Objective> {
    const table = await this.getManifestTable('Objective');
    return table[key + ''];
  }

  public async getSeason(key: string | number): Promise<Season> {
    const table = await this.getManifestTable('Season');
    return table[key + ''];
  }

  public async getSeasonPass(key: string | number): Promise<SeasonPass> {
    const table = await this.getManifestTable('SeasonPass');
    return table[key + ''];
    // return this.cache.SeasonPass[key + ''];
  }

  private async init2() {
    this.cacheLite = await this.getManifestTable('cache-lite') as CacheLite;
    console.log('%cLoaded cache-lite.', LOG_CSS);
  }

  private async getManifestTable(tableName: string) {
    if (this.memCache[tableName] != null) {
      return this.memCache[tableName];
    }
    const key = `table-${tableName}-${env.versions.manifest}`;
    const cached = await get(key);
    let returnMe = null;
    if (cached != null) {
      console.log(`%c${tableName} idb cached`, LOG_CSS);
      returnMe = cached;
    } else {
      // not found
      // clean up
      const ks = await keys();
      for (const k of ks) {
        if (k.toString().startsWith(`table-${tableName}`)) {
          del(k);
        }
      }
      const remote = await this.http.get<any>(`/assets/destiny2-${tableName.toLowerCase()}.json?v=${env.versions.manifest}`).toPromise();
      // cache it, but don't wait on that
      set(key, remote);
      console.log(`%c${tableName} remote`, LOG_CSS);
      returnMe = remote;
    }
    this.memCache[tableName] = returnMe;
    if (!this.observableMap[tableName]) {
      this.observableMap[tableName] = new ReplaySubject(1);
    }
    this.observableMap[tableName].next(returnMe);
    // emit in observable too
    return returnMe;
  }

  private async init() {
    this.checkingCache.next(true);


    const t0 = performance.now();
    const key = 'manifest-' + env.versions.manifest;
    console.log(`Loading cache ${key}`);
    try {
      const manifest = await get(key);
      this.checkingCache.next(false);
      // if nothing found, perhaps version has changed, clear old values
      if (manifest == null) {
        console.log('No cached value found');
        const ks = await keys();
        for (const k of ks) {
          if (k.toString().startsWith('manifest')) {
            del(k);
          }
        }
        await this.load(key);
      } else {
        this.cache = manifest as Cache;
      }
      if (this.cache?.version) {
        this.version$.next(this.cache.version);
      }
      this.percent.next(100);
      this.ready$.next(true);
      const t1 = performance.now();
      console.log((t1 - t0) + ' ms to load manifest');
    } catch (exc) {
      console.log(`Error loading Bungie Manifest DB ${key}`);
      const s = safeStringifyError(exc);
      console.log(s);
      this.errorDetails.next(s);
      try {
        console.log('Deleting any existing cache entry');
        await del(key);
      } catch (exc2) {
        console.log('Secondary error deleting cache entry');
        console.dir(exc2);
      }
      this.error.next('There was an error loading the Bungie Manifest DB, please refresh the page and try again.');
    }
    finally {
      this.checkingCache.next(false);
      this.percent.next(100);
    }
  }

  async unzip(blob: Blob): Promise<void> {
    let ab: ArrayBuffer;
    // if blob.arraybuffer is not suppported, copy to a new request
    if (!blob.arrayBuffer) {
      ab = await new Response(blob).arrayBuffer();
    } else {
      ab = await blob.arrayBuffer();
    }
    const unzipMe = new Uint8Array(ab);
    const decompressed = unzipSync(unzipMe);
    const binaryData = decompressed['destiny2.json'];
    const data2 = strFromU8(binaryData);
    this.cache = JSON.parse(data2);
    this.ready$.next(true);
  }

  private showProgress(evt: HttpEvent<any>) {
    switch (evt.type) {
      case HttpEventType.Sent:
        this.percent.next(5);
        break;
      case HttpEventType.ResponseHeader:
        this.percent.next(10);
        break;
      case HttpEventType.DownloadProgress:
        const kbLoaded = Math.round(evt.loaded / 1024);
        console.log(`Download in progress! ${kbLoaded}Kb loaded`);
        this.percent.next(15 + 80 * evt.loaded / evt.total);
        break;
      case HttpEventType.Response: {
        this.percent.next(95);
      }
    }
  }
  private async download(cacheBuster?: string): Promise<Blob> {
    console.log(`--- load remote cache ${env.versions.manifest} ---`);

    let uri = `/assets/destiny2.zip?ngsw-bypass=true&v=${env.versions.manifest}`;
    if (cacheBuster && cacheBuster.trim().length > 0) {
      uri = `/assets/destiny2.zip?ngsw-bypass=true&v=${env.versions.manifest}-${cacheBuster}`;
    }
    console.log(`Downloading zip from URI: ${uri}`);
    const req = new HttpRequest<Blob>('GET', uri, {
      reportProgress: true,
      responseType: 'blob'
    });

    const finalHttpEvt = await this.http.request(req).pipe(
      tap((evt: HttpEvent<any>) => this.showProgress(evt)),
      retry(1),
      last(),
      catchError(err => throwError(cookError(err)))
    ).toPromise();

    if (finalHttpEvt.type !== HttpEventType.Response) {
      throw new Error(`Unexpected final http event type ${finalHttpEvt.type}`);
    }
    const dl = finalHttpEvt as HttpResponse<Blob>;
    this.percent.next(100);
    return dl.body;
  }


  async load(key: string, isRetry?: boolean): Promise<void> {
    let blob = await this.download();
    // retry if size zero to try to get to the bottom of weird problem
    if (blob.size == 0) {
      console.log(`   Retrieved zero length blob, adding cache buster and retrying.`);
      blob = await this.download('' + new Date().getTime());
    }
    console.log(`   Retrieved Blob size ${blob.size}. Beginning unzip...`);
    this.unzipping.next(true);
    try {
      try {
        await this.unzip(blob);
      } catch (unzipExc) {
        console.dir(unzipExc);
        if (!isRetry) {
          console.log('Initial error unzipping blob. Retrying...');
          await this.load(key, true);
        } else {
          console.log('Secondary error unzipping blob. Fail');
          throw unzipExc;
        }
      }
      set(key, this.cache);
      return;
    }
    finally {
      this.unzipping.next(false);
    }
  }
}
export interface CacheLite {
  Class: any;
  EnergyType: any;
  Gender: any;
  InventoryBucket: any;
  ItemTierType: any;
  PowerCap: any;
  PursuitTags: { [key: string]: string[] };
  Race: any;
  Stat: any;
  destiny2CoreSettings: Destiny2CoreSettings;
  version: string;
  // TODO index of inventory item?
}

export interface Cache {
  // Class?: any;
  // Stat?: any;
  // Activity?: any;
  // ActivityMode?: any;
  // ActivityModifier?: any;
  // ActivityType?: any;
  // Checklist?: any;
  // Collectible?: any;
  // EnergyType?: any;
  // EquipmentSlot?: any;
  // Faction?: any;
  // Gender?: any;
  // HistoricalStats?: any;
  // InventoryBucket?: any;
  InventoryItem?: { [key: string]: ManifestInventoryItem };
  // ItemTierType?: any;
  // Milestone?: any;
  // Objective?: { [key: string]: Objective };
  // Perk?: any;
  // PlugSet?: any;
  // PowerCap?: any;
  // PresentationNode?: any;
  // Progression?: any;
  // PursuitTags?: { [key: string]: string[] };
  // Race?: any;
  // Record?: any;
  // RecordSeasons?: any;
  // Season?: { [key: string]: Season };
  // SeasonPass?: { [key: string]: SeasonPass };
  // SocketCategory?: any;
  // SocketType?: any;
  // TagWeights?: { [key: string]: number };
  // Vendor?: any;
  // destiny2CoreSettings: Destiny2CoreSettings;
  version: string;
}


export interface Destiny2CoreSettings {
  collectionRootNode: number;
  badgesRootNode: number;
  recordsRootNode: number;
  medalsRootNode: number;
  metricsRootNode: number;
  activeTriumphsRootNodeHash: number;
  activeSealsRootNodeHash: number;
  legacyTriumphsRootNodeHash: number;
  legacySealsRootNodeHash: number;
  medalsRootNodeHash: number;
  exoticCatalystsRootNodeHash: number;
  loreRootNodeHash: number;
  currentRankProgressionHashes: number[];
  undiscoveredCollectibleImage: string;
  ammoTypeHeavyIcon: string;
  ammoTypeSpecialIcon: string;
  ammoTypePrimaryIcon: string;
  currentSeasonalArtifactHash: number;
  currentSeasonHash: number;
  seasonalChallengesPresentationNodeHash: number;
  futureSeasonHashes: number[];
  pastSeasonHashes: number[];
}


export interface ManifestInventoryItem {
  displayProperties: DisplayProperties;
  iconWatermark: string;
  tooltipNotifications: any[];
  backgroundColor: any;
  itemTypeDisplayName: string;
  uiItemDisplayStyle: string;
  itemTypeAndTierDisplayName: string;
  displaySource: string;
  tooltipStyle: string;
  inventory: any;
  damageTypes: any[];
  stats: any;
  value: any;
  objectives: Objectives;
  acquireRewardSiteHash: number;
  acquireUnlockHash: number;
  investmentStats: any[];
  perks: any[];
  allowActions: boolean;
  doesPostmasterPullHaveSideEffects: boolean;
  nonTransferrable: boolean;
  itemCategoryHashes: number[];
  specialItemType: number;
  itemType: number;
  itemSubType: number;
  classType: number;
  breakerType: number;
  equippable: boolean;
  defaultDamageType: number;
  isWrapper: boolean;
  hash: number;
  index: number;
  redacted: boolean;
  blacklisted: boolean;
  quality: Quality;
  sockets: any;
  plug: any;
}

interface Quality {
  currentVersion: number;
  displayVersionWatermarkIcons: string[];
  infusionCategoryHash: number;
  infusionCategoryHashes: number[];
  infusionCategoryName: string;
  itemLevels: any[];
  progressionLevelRequirementHash: number;
  qualityLevel: number;
  versions: Version[];
}

interface Version {
  powerCapHash: number;
}

// part of Inventory Item
interface Objectives {
  objectiveHashes: number[];
  displayActivityHashes: number[];
  requireFullObjectiveCompletion: boolean;
  questlineItemHash: number;
  narrative: string;
  objectiveVerbName: string;
  questTypeIdentifier: string;
  questTypeHash: number;
  completionRewardSiteHash: number;
  nextQuestStepRewardSiteHash: number;
  timestampUnlockValueHash: number;
  isGlobalObjectiveItem: boolean;
  useOnObjectiveCompletion: boolean;
  inhibitCompletionUnlockValueHash: number;
  perObjectiveDisplayProperties: any[];
}

// an Objective record looked up from an objective-hash
export interface Objective {
  displayProperties: DisplayProperties;
  unlockValueHash: number;
  completionValue: number;
  scope: number;
  locationHash: number;
  allowNegativeValue: boolean;
  allowValueChangeWhenCompleted: boolean;
  isCountingDownward: boolean;
  valueStyle: number;
  progressDescription: string;
  perks: any;
  stats: any;
  minimumVisibilityThreshold: number;
  allowOvercompletion: boolean;
  showValueOnComplete: boolean;
  isDisplayOnlyObjective: boolean;
  completedValueStyle: number;
  inProgressValueStyle: number;
  hash: number;
  index: number;
  redacted: boolean;
  blacklisted: boolean;
}

export interface Season {
  artifactItemHash: string;
  backgroundImagePath: string;
  blacklisted: boolean;
  displayProperties: DisplayProperties;
  endDate: string;
  hash: string;
  index: number;
  redacted: boolean;
  sealPresentationNodeHash: number;
  seasonNumber: number;
  seasonPassHash: string;
  seasonPassProgressionHash: string;
  seasonPassUnlockHash: string;
  startDate: string;
  startTimeInSeconds: string;
}

export interface SeasonPass {
  blacklisted: boolean;
  displayProperties: DisplayProperties;
  hash: string;
  index: number;
  prestigeProgressionHash: string;
  redacted: boolean;
  rewardProgressionHash: string;
}

interface DisplayProperties {
  description: string;
  name: string;
  icon: string;
  hasIcon: boolean;
}
