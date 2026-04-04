export interface DestinyCache {
  Activity?: any;
  ActivityMode?: any;
  ActivityModifier?: any;
  ActivityType?: any;
  Checklist?: any;
  Class?: any;
  Collectible?: any;
  Faction?: any;
  Gender?: any;
  HistoricalStats?: any;
  InventoryBucket?: any;
  InventoryItem?: any;
  ItemTierType?: any;
  Milestone?: any;
  Objective?: any;
  Perk?: any;
  PlugSet?: any;
  PowerCap?: any;
  PresentationNode?: any;
  Progression?: any;
  Race?: any;
  Record?: any;
  Season?: any;
  SeasonPass?: any;
  SocketCategory?: any;
  SocketType?: any;
  Stat?: any;
  Vendor?: any;
  destiny2CoreSettings?: Destiny2CoreSettings;
  version: string;
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
}

export interface VersionAndSettings {
  version: string;
  destiny2CoreSettings: Destiny2CoreSettings;
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
