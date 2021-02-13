import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment as env } from '@env/environment';
import { del, get, keys, set } from 'idb-keyval';
import { BehaviorSubject } from 'rxjs';
import { last, tap } from 'rxjs/operators';

declare let JSZip: any;

@Injectable()
export class DestinyCacheService {
  public cache: Cache;

  public readonly ready$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly checkingCache: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly percent: BehaviorSubject<number> = new BehaviorSubject(0);
  public readonly unzipping: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly error: BehaviorSubject<string> = new BehaviorSubject(null);

  constructor(private http: HttpClient) {
    this.init();
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
      this.percent.next(100);
      this.ready$.next(true);
      const t1 = performance.now();
      console.log((t1 - t0) + ' ms to load manifest');
    } catch (exc) {
      console.log(`Error loading Bungie Manifest DB ${key}`);
      console.dir(exc);
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
    const zip: any = new JSZip();
    const zip2 = await zip.loadAsync(blob);
    const z2f = zip2.file('destiny2.json');
    const data2 = await z2f.async('string');
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

  async load(key: string): Promise<void> {
    console.log('--- load ---');

    let headers = new HttpHeaders();
    headers = headers
        .set('Content-Type', 'application/x-www-form-urlencoded');
    const httpOptions = {
        headers: headers};

    const req = new HttpRequest<Blob>('GET', '/assets/destiny2.zip?v=' + env.versions.manifest, {
      reportProgress: true,
      responseType: 'blob'
    });

    const r = this.http.request(req).pipe(
      tap((evt: HttpEvent<any>) => this.showProgress(evt)),
      last()
    );
    const event = await r.toPromise();
    this.percent.next(100);
    this.unzipping.next(true);
    try {
      await this.unzip((event as HttpResponse<Blob>).body);
      set(key, this.cache);
      return;
    }
    finally {
      this.unzipping.next(false);
    }
  }
}

export interface Cache {
  version: string;
  destiny2CoreSettings: Destiny2CoreSettings,
  Vendor?: any;
  Race?: any;
  Gender?: any;
  EnergyType?: any;
  Class?: any;
  Activity?: any;
  ActivityType?: any;
  ActivityMode?: any;
  Milestone?: any;
  Faction?: any;
  Progression?: any;
  PowerCap?: any;
  InventoryItem?: { [key: string]: ManifestInventoryItem };
  Stat?: any;
  Objective?: { [key: string]: Objective };
  ActivityModifier?: any;
  Perk?: any;
  SocketType?: any;
  PlugSet?: any;
  SocketCategory?: any;
  Checklist?: any;
  InventoryBucket?: any;
  EquipmentSlot?: any;
  PresentationNode?: any;
  Record?: any;
  Collectible?: any;
  ItemTierType?: any;
  HistoricalStats?: any;
  RecordSeasons?: any;
  PursuitTags?: { [key: string]: string[] };
  Season?: { [key: string]: Season };
  SeasonPass?: { [key: string]: SeasonPass };
  TagWeights?:  {[key: string]: number};
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
