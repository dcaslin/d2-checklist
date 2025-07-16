import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isSearchBot, safeStringifyError } from '@app/shared/utilities';
import { NotificationService } from './notification.service';
import { environment as env } from '@env/environment';
import { del, get, keys, set } from 'idb-keyval';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { DestinyObjectiveUiStyle } from './model';

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

  constructor(private http: HttpClient,
    private notificationService: NotificationService) {
    if (!this.searchBot) {
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

  public getCoreSettings(): Destiny2CoreSettings {
    return this.cacheLite.destiny2CoreSettings;
  }

  public async getInventoryItem(key: string | number): Promise<any> {
    const table = await this.getManifestTable('InventoryItem');
    return table[key + ''];
  }

  public async getInventoryItemTable(): Promise<any> {
    return await this.getManifestTable('InventoryItem');
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
  }

  private async getManifestTable(tableName: string) {
    if (this.memCache[tableName] != null) {
      return this.memCache[tableName];
    }
    let t0: number = null;
    const key = `table-${tableName}-${env.versions.manifest}`;
    const cached = await get(key);
    let returnMe = null;
    let method = null;
    if (cached != null) {
      t0 = performance.now();
      method = 'idb';
      returnMe = cached;
    } else {
      // not found, clean up
      const ks = await keys();
      for (const k of ks) {
        if (k.toString().startsWith(`table-${tableName}`)) {
          del(k);
        }
      }
      t0 = performance.now();
      method = 'remote';
      // special case for missing cache lite, warn that manifest updated
      if ('cache-lite' == tableName) {
        this.notificationService.info(`New Manifest found!`);
      }
      const remote = await this.http.get<any>(`/assets/destiny2-${tableName.toLowerCase()}.json?v=${env.versions.manifest}`).toPromise();
      // cache it, but don't wait on that
      set(key, remote);
      returnMe = remote;
    }
    this.memCache[tableName] = returnMe;
    if (!this.observableMap[tableName]) {
      this.observableMap[tableName] = new ReplaySubject(1);
    }
    // emit in observable too
    this.observableMap[tableName].next(returnMe);

    // // for perf debugguning
    // if (t0 != null) {
    //   const t1 = performance.now();

    //   console.log(`%c${tableName} ${method} loaded in ${(t1 - t0).toFixed(2)}ms`, LOG_CSS);
    // }
    return returnMe;
  }

  private async init() {
    this.checkingCache.next(true);
    const t0 = performance.now();
    console.log(`%cLoading cache ${env.versions.manifest}`, LOG_CSS);
    try {
      this.cacheLite = await this.getManifestTable('cache-lite') as CacheLite;
      const t1 = performance.now();
      console.log(`%c${t1 - t0} ms elapsed loading manifest lite`, LOG_CSS);
      this.percent.next(100);
      this.ready$.next(true);
    } catch (exc) {
      console.log('%Error loading cache-lite  ${env.versions.manifest}.', LOG_CSS);
      const s = safeStringifyError(exc);
      console.log(s);
      this.errorDetails.next(s);
      this.error.next('There was an error loading the Bungie Manifest DB, please refresh the page and try again.');
    }
    finally {
      this.checkingCache.next(false);
      this.percent.next(100);
    }
  }

}
export interface CacheLite {
  Class: any;
  Gender: any;
  InventoryBucket: any;
  ItemTierType: any;
  PowerCap: any;
  Race: any;
  Stat: any;
  destiny2CoreSettings: Destiny2CoreSettings;
  version: string;
  // TODO index of inventory item?
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


export interface SimpleInventoryItem {
  displayProperties: DisplayProperties;
  redacted: boolean;
  iconWatermark: string;

}

export interface ManifestInventoryItem extends SimpleInventoryItem {
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
  uiStyle?: DestinyObjectiveUiStyle;
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
  // seasonPassHash: string;
  seasonPassList: SeasonPassListItem[]
  seasonPassProgressionHash: string;
  seasonPassUnlockHash: string;
  startDate: string;
  startTimeInSeconds: string;
}

export interface SeasonPassListItem {
  seasonPassHash: number
  ownershipUnlockFlagHash: number
  seasonPassStartTime: string
  seasonPassStartDate: string
  seasonPassEndDate: string
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
