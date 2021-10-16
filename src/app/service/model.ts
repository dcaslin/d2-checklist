import { faGoogle, faPlaystation, faSteam, faWindows, faXbox } from '@fortawesome/free-brands-svg-icons';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/pro-light-svg-icons';
import { BehaviorSubject } from 'rxjs';
import { ManifestInventoryItem } from './destiny-cache.service';

export const BUCKET_WEAPON_KINETIC = 1498876634;
export const BUCKET_WEAPON_ENERGY = 2465295065;
export const BUCKET_WEAPON_POWER = 953998645;
export const BUCKETS_WEAPON = [BUCKET_WEAPON_KINETIC, BUCKET_WEAPON_ENERGY, BUCKET_WEAPON_POWER];

export const BUCKET_ARMOR_HELMET = 3448274439;
export const BUCKET_ARMOR_GAUNTLETS = 3551918588;
export const BUCKET_ARMOR_CHEST = 14239492;
export const BUCKET_ARMOR_LEG = 20886954;
export const BUCKET_ARMOR_CLASS = 1585787867;

export const enum StatHashes {
    Accuracy = 1591432999,
    AimAssistance = 1345609583,
    AmmoCapacity = 925767036,
    AnyEnergyTypeCost = 3578062600,
    ArcCost = 3779394102,
    ArcDamageResistance = 1546607978,
    ArcEnergyCapacity = 3625423501,
    AspectEnergyCapacity = 2223994109,
    Attack = 1480404414,
    BlastRadius = 3614673599,
    Boost = 3017642079,
    ChargeRate = 3022301683,
    ChargeTime = 2961396640,
    Defense = 3897883278,
    Discipline = 1735777505,
    DrawTime = 447667954,
    Durability = 360359141,
    FragmentCost = 119204074,
    GhostEnergyCapacity = 237763788,
    GuardEfficiency = 2762071195,
    GuardEndurance = 3736848092,
    GuardResistance = 209426660,
    Handicap = 2341766298,
    Handling = 943549884,
    HeroicResistance = 1546607977,
    Impact = 4043523819,
    Intellect = 144602215,
    InventorySize = 1931675084,
    Magazine = 3871231066,
    Mobility = 2996146975,
    ModCost = 514071887,
    MoveSpeed = 3907551967,
    Power = 1935470627,
    PowerBonus = 3289069874,
    PrecisionDamage = 3597844532,
    Range = 1240592695,
    RecoilDirection = 2715839340,
    Recovery = 1943323491,
    ReloadSpeed = 4188031367,
    Resilience = 392767087,
    RoundsPerMinute = 4284893193,
    ScoreMultiplier = 2733264856,
    SolarCost = 3344745325,
    SolarDamageResistance = 1546607979,
    SolarEnergyCapacity = 2018193158,
    Speed = 1501155019,
    Stability = 155624089,
    StasisCost_3950461274 = 3950461274,
    StasisCost_998798867 = 998798867,
    Strength = 4244567218,
    SwingSpeed = 2837207746,
    TimeToAimDownSights = 3988418950,
    Velocity = 2523465841,
    VoidCost = 2399985800,
    VoidDamageResistance = 1546607980,
    VoidEnergyCapacity = 16120457,
    Zoom = 3555269338,
}

export const BUCKETS_ARMOR = [BUCKET_ARMOR_HELMET, BUCKET_ARMOR_GAUNTLETS,
    BUCKET_ARMOR_CHEST, BUCKET_ARMOR_LEG, BUCKET_ARMOR_CLASS];

export const BUCKETS_ALL_POWER = [BUCKET_WEAPON_KINETIC, BUCKET_WEAPON_ENERGY,
    BUCKET_WEAPON_POWER, BUCKET_ARMOR_HELMET, BUCKET_ARMOR_GAUNTLETS,
    BUCKET_ARMOR_CHEST, BUCKET_ARMOR_LEG, BUCKET_ARMOR_CLASS
];

export const TAG_WEIGHTS: { [key: string]: number } = {
    'warmind bits': 5.0,
    'gambit': 0.25,
    'crucible': 0.5,
    'precision': 1.5,
    'power weapon': 0.75,
    'lost sector': 2.0,
    'vex': 2.0,
    'cabal': 2.0,
    'fallen': 2.0,
    'finisher': 3.0,
    'void': 2.0,
    'solar': 1.5,
    'arc': 2.0
};

export enum ClassAllowed {
    Titan = 0,
    Hunter = 1,
    Warlock = 2,
    Any = 3
}

export const DestinyClasses = ['Titan', 'Hunter', 'Warlock'];

export enum NumComparison {
    gte = 0,
    lte = 1,
    gt = 2,
    lt = 3,
    e = 4
}

export enum DestinyAmmunitionType {
    None = 0,
    Primary = 1,
    Special = 2,
    Heavy = 3,
    Unknown = 4
}

export enum ItemType {
    None = 0,
    Currency = 1,
    Armor = 2,
    Weapon = 3,
    Message = 7,
    Engram = 8,
    Consumable = 9,
    ExchangeMaterial = 10,
    MissionReward = 11,
    QuestStep = 12,
    QuestStepComplete = 13,
    Emblem = 14,
    Quest = 15,
    Subclass = 16,
    ClanBanner = 17,
    Aura = 18,
    Mod = 19,
    Dummy = 20,
    Ship = 21,
    Vehicle = 22,
    Emote = 23,
    Ghost = 24,
    Package = 25,
    Bounty = 26,
    MissionArtifact = 97, // custom
    GearMod = 99,  // custom added
    Shader = 100,  // custom added
    CurrencyExchange = 101  // custom added
}

export enum ItemState {
    None = 0,
    Locked = 1,
    Tracked = 2,
    Masterwork = 4
}

export enum DamageType {
    None = 0,
    Kinetic = 1,
    Arc = 2,
    Thermal = 3,
    Void = 4,
    Raid = 5,
    Stasis = 6,
}

export enum EnergyType {
    Any = 0,
    Arc = 1,
    Thermal = 2,
    Void = 3,
    Stasis = 6,
}

export interface MasterworkInfo {
    hash: string;
    name: string;
    desc: string;
    icon: string;
    tier: number;
    godTierPve: boolean;
    godTierPvp: boolean;
    recommendedPvpMws: string[];
    recommendedPveMws: string[];
}

export interface RecordSeason {
    name: string;
    records: TriumphRecordNode[];
}

export interface SeasonalChallengeEntry {
    name: string;
    records: TriumphRecordNode[];
}

export interface Badge {
    hash: string;
    name: string;
    desc: string;
    icon: string;
    complete: boolean;
    bestProgress: number;
    percent: number;
    total: number;
    classes: BadgeClass[];
}

export interface BadgeClass {
    hash: string;
    name: string;
    complete: number;
    total: number;
    children: TriumphCollectibleNode[];
}


export interface Seal {
    hash: string;
    contentVault: boolean;
    name: string;
    desc: string;
    icon: string;
    children: TriumphNode[];
    title: string;

    percent: number;
    progress: number;
    completionValue: number;

    gildProgress: number;
    gildTotal: number;
    
    complete: boolean;
}

export interface TriumphNode {
    type: string;
    hash: string;
    name: string;
    desc: string;
    icon: string;
    index: string;
    complete: boolean;
    children: TriumphNode[];
    path: PathEntry[];
}

export interface PathEntry {
    path: string;
    hash: string;
}

export interface TriumphPresentationNode extends TriumphNode {
    progress: number;
    completionValue: number;
    unredeemedCount: number;
    pts: number;
    totalPts: number;
    vaultedChildren?: number;
    vaultedChildrenComplete?: number;
    vaultedChildrenIncomplete?: number;
}

export interface TriumphRecordNode extends TriumphNode {
    objectives: ItemObjective[];
    contentVault: boolean;
    intervalsRedeemedCount: number;
    redeemed: boolean;
    forTitleGilding: boolean;
    title: boolean;
    interval: boolean;
    earned: number;
    score: number;
    lowLinks?: LowLinks;
    percentToNextInterval: number;
    percent: number;
    searchText: string;
    invisible: boolean;
    pointsToBadge: boolean;
    badge?: Badge;
    rewardItems: NameQuantity[];
}

export interface TriumphCollectibleNode extends TriumphNode {
    acquired: boolean;
    sourceString: string;
    searchText: string;
}
export interface Vendor {
    hash: string;
    name: string;
    icon: string;
    displayProperties: any;
    nextRefreshDate: string;
}

export interface NameQuantity {
    hash: string;
    name: string;
    quantity: number;
    icon?: string;
    itemTypeDisplayName?: string;
}

export interface ItemPerks {
    icon: string;
    hash: string;
    name: string;
    desc: string;
}

export interface PublicMilestonesAndActivities {
    publicMilestones: PublicMilestone[];
    crucible: PublicMilestone;
    strikes: PublicMilestone;
    nightfall: PublicMilestone;
    empireHunts: MilestoneActivity[];
    weekStart: Date;
}

export interface PublicMilestone {
    hash: string;
    name: string;
    desc: string;
    start: string;
    end: string;
    order: number;
    icon: string;
    activities: MilestoneActivity[];
    rewards: string;
    boost: BoostInfo;
    milestoneType: number;
    type?: string;
    dependsOn: string[];

}

export interface AggMilestoneActivity {
    lls: number[];
    activity: MilestoneActivity;
}

export interface MilestoneActivity {
    hash: string;
    name: string;
    desc: string;
    ll: number;
    tier: number;
    icon: string;
    modifiers: NameDesc[];
    specialLoot?: ItemDisplay;
}

export interface LegendLostSectorActivity extends MilestoneActivity {
    info: LostSectorInfo;
}

export interface PrivPublicMilestone {
    milestoneHash: number;
    activities: PrivMilestoneActivity[];
    availableQuests: PrivAvailableQuest[];
    startDate: string;
    endDate: string;
    order: number;
}

interface PrivAvailableQuest {
    questItemHash: number;
}

export interface PrivLoadoutRequirement {
    equipmentSlotHash: number;
    allowedEquippedItemHashes: any[];
    allowedWeaponSubTypes: number[];
}

export interface PrivMilestoneActivity {
    activityHash: string;
    challengeObjectiveHashes: any[];
    modifierHashes: string[];
    loadoutRequirementIndex: number;
}

export interface ItemObjective {
    hash: string;
    completionValue: number;
    progressDescription: string;
    progress: number;
    complete: boolean;
    percent: number;
    score?: number;
}

export class ActivityMode {
    name: string;
    type: number;
    desc: string;

    constructor(type: number, name: string, desc: string) {
        this.type = type;
        this.name = name;
        this.desc = desc;
    }
}

export interface SearchResult {
    iconPath: string;
    crossSaveOverride?:  number;
    applicableMembershipTypes?: number[];
    isPublic?: boolean;
    membershipType:              number;
    membershipId:                string;
    displayName:                 string;
    bungieGlobalDisplayName?:     string;
    bungieGlobalDisplayNameCode?: number;
}



export class BungieMembership {
    bungieId: string;
    clans: ClanRow[] = [];
    destinyMemberships: UserInfo[];

    public getBnetInfo(): UserInfo {
        if (this.destinyMemberships == null) { return null; }
        for (const u of this.destinyMemberships) {
            if (u.membershipType == 4) {
                return u;
            }
        }
        return null;
    }
}

export class BungieMember {
    name: string;
    id: string;
    noClan = false;
    clans: ClanRow[] = null;
    xbl: BungieMemberPlatform;
    psn: BungieMemberPlatform;
    bnet: BungieMemberPlatform;
    steam: BungieMemberPlatform;

    constructor(name: string, id: string, xbl: BungieMemberPlatform,
        psn: BungieMemberPlatform, bnet: BungieMemberPlatform,
        steam: BungieMemberPlatform) {
        this.id = id;
        this.name = name;
        this.xbl = xbl;
        this.psn = psn;
        this.bnet = bnet;
        this.steam = steam;
    }
}

export interface BountySet {
    type: string;
    tag: string;
    score: number;
    bounties: InventoryItem[];
}

export class SelectedUser {
    userInfo: UserInfo;
    currencies$: BehaviorSubject<Currency[]> = new BehaviorSubject([]);
    gearMeta$: BehaviorSubject<GearMetaData> = new BehaviorSubject(null);
    clans: BehaviorSubject<ClanRow[]> = new BehaviorSubject([]);
    membership: BungieMembership;
    promptForPlatform = false;
}

export class BungieGroupMember {
    memberType: number;
    isOnline: boolean;
    lastOnlineStatusChange: string;
    groupId: string;
    destinyUserInfo: UserInfo;
    bungieNetUserInfo: BungieNetUserInfo;
    joinDate: string;
    player$: BehaviorSubject<Player> = new BehaviorSubject(null);
    errorMsg: string;

    currentPlayer(): Player | null {
        return this.player$.getValue();
    }

    isDefunct(): boolean {
        const current = this.destinyUserInfo.crossSaveOverride == 0 ||
            (this.destinyUserInfo.crossSaveOverride == this.destinyUserInfo.membershipType);
        return !current;
    }
}


export class FriendListEntry {
    user: UserInfo;
    player$: BehaviorSubject<Player> = new BehaviorSubject(null);
    errorMsg$: BehaviorSubject<string> = new BehaviorSubject(null);

    currentPlayer(): Player | null {
        return this.player$.getValue();
    }
}

export interface BungieNetUserInfo {
    iconPath: string;
    membershipType: number;
    membershipId: string;
    displayName: string;
}

export interface UserInfo {
    membershipType: number;
    membershipId: string;
    crossSaveOverride: number;
    platformName: string;
    displayName: string;
    icon: string;
    bungieMembershipId?: string;
    bungieInfo?: BungieMembership;

}

export interface Profile {
    userInfo: UserInfo;
    dateLastPlayed: string;
    versionsOwned: number;
    characterIds: string[];
}

export class Rankup {
    hash: number;
    name: string;
    // xyz300: boolean;

    constructor(hash: number, name: string) {
        this.hash = hash;
        this.name = name;
    }
}

export interface ChecklistItem {
    hash: string;
    name: string;
    checked: boolean;
    video?: string;
    desc: string;
    lowLinks?: LowLinks;
}

export interface Checklist {
    hash: string;
    name: string;
    contentVault: boolean;
    order: number;
    video?: string;
    complete: number;
    total: number;
    entries: ChecklistItem[];
    hasDescs: boolean;
}

export interface CharCheck {
    char: Character;
    checked: boolean;
}

export interface CharChecklistItem {
    hash: string;
    name: string;
    allDone: boolean;
    oncePerAccount: boolean;
    checked: CharCheck[];
    lowLinks?: LowLinks;
}

export interface LowLinks {
    mapLink?: string;
    loreLink?: string;
    videoLink?: string;
}

export interface CharTotal {
    char: Character;
    complete: number;
    total: number;
}

export interface CharChecklist {
    hash: string;
    name: string;
    contentVault: boolean;
    maxComplete: number;
    totals: CharTotal[];
    entries: CharChecklistItem[];
}

export interface SpecialAccountProgressions {
    glory: Progression;
    seasonRank: Progression;
    crucibleRank: Progression;
    gambitRank: Progression;
    vanguardRank: Progression;
}

export class Player {
    readonly profile: Profile;
    readonly superprivate: boolean;
    readonly hasWellRested: boolean;
    readonly currentActivity: CurrentActivity;
    readonly characters: Character[];
    milestoneList: MileStoneName[] = [];
    readonly currencies: Currency[];
    readonly bounties: InventoryItem[];
    readonly quests: InventoryItem[];
    readonly pursuitGear: InventoryItem[];
    readonly rankups: Rankup[];
    readonly checklists: Checklist[];
    readonly charChecklists: CharChecklist[];
    readonly triumphScore: number;
    readonly records: TriumphNode[];
    readonly collections: TriumphNode[];
    readonly lowHangingTriumphs: TriumphRecordNode[];
    readonly seals: Seal[];
    readonly badges: Badge[];
    readonly searchableTriumphs: TriumphRecordNode[];
    readonly searchableCollection: TriumphCollectibleNode[];
    readonly gear: InventoryItem[];
    readonly vault: Target;
    readonly shared: Target;
    readonly raidChecked = false;
    readonly title;
    readonly seasonChallengeEntries: SeasonalChallengeEntry[];
    readonly hasHiddenClosest: boolean;
    readonly accountProgressions: Progression[];
    readonly glory: Progression;
    readonly seasonRank: Progression;
    readonly crucibleRank: Progression;
    readonly vanguardRank: Progression;
    readonly gambitRank: Progression;
    readonly artifactPowerBonus: number;
    readonly transitoryData: ProfileTransitoryData;
    readonly minsPlayed: number;
    readonly gearMetaData: GearMetaData;
    maxLL = 0;
    maxLLFraction?: Fraction;
    aggHistory: AggHistoryEntry[] = [];

    constructor(profile: Profile, characters: Character[], currentActivity: CurrentActivity,
        milestoneList: MileStoneName[],
        currencies: Currency[],
        bounties: InventoryItem[],
        quests: InventoryItem[],
        rankups: Rankup[], superprivate: boolean, hasWellRested: boolean,
        checklists: Checklist[], charChecklists: CharChecklist[], triumphScore: number, records: TriumphNode[],
        collections: TriumphNode[], gear: InventoryItem[], vault: Target, shared: Target,
        lowHangingTriumphs: TriumphRecordNode[], searchableTriumphs: TriumphRecordNode[],
        searchableCollection: TriumphCollectibleNode[],
        seals: Seal[], badges: Badge[],
        title: string, seasonChallengeEntries: SeasonalChallengeEntry[], hasHiddenClosest: boolean,
        accountProgressions: Progression[], artifactPowerBonus: number, transitoryData: ProfileTransitoryData,
        specialAccountProgressions: SpecialAccountProgressions, gearMeta: GearMetaData) {
        this.profile = profile;
        this.characters = characters;
        this.currentActivity = currentActivity;
        this.milestoneList = milestoneList;
        this.currencies = currencies;
        this.bounties = bounties;
        this.quests = quests;
        this.rankups = rankups;
        this.superprivate = superprivate;
        this.hasWellRested = hasWellRested;
        this.checklists = checklists;
        this.charChecklists = charChecklists;
        this.triumphScore = triumphScore;
        this.records = records;
        this.collections = collections;
        this.gear = gear;
        let minsPlayed = 0;
        if (characters != null && characters.length > 0) {
            for (const char of characters) {
                if (char.light > this.maxLL) {
                    this.maxLL = char.light;
                    this.maxLLFraction = char.lightFraction;
                }
                minsPlayed += char.minutesPlayedTotal;
            }
        }
        this.minsPlayed = minsPlayed;
        this.vault = vault;
        this.shared = shared;
        this.lowHangingTriumphs = lowHangingTriumphs;
        this.searchableTriumphs = searchableTriumphs;
        this.searchableCollection = searchableCollection;
        this.seals = seals;
        this.badges = badges;
        this.title = title;
        this.seasonChallengeEntries = seasonChallengeEntries;
        this.hasHiddenClosest = hasHiddenClosest;
        this.accountProgressions = accountProgressions;
        this.artifactPowerBonus = artifactPowerBonus;
        this.transitoryData = transitoryData;
        if (specialAccountProgressions) {
            this.glory = specialAccountProgressions.glory;
            this.gambitRank = specialAccountProgressions.gambitRank;
            this.vanguardRank = specialAccountProgressions.vanguardRank;
            this.crucibleRank = specialAccountProgressions.crucibleRank;
            this.seasonRank = specialAccountProgressions.seasonRank;
        }
        this.gearMetaData = gearMeta; 
        this.pursuitGear = this.gear ? this.gear.filter(g => g.objectives?.length > 0 && g.type != ItemType.Subclass) : [];
    }

    public getWeeklyXp(): number {
        return this.seasonRank ? this.seasonRank.weeklyProgress : 0;
    }
}

export class InventoryItem {
    vendorItemInfo?: VendorItemInfo;
    tags?: string[];
    id: string;
    readonly hash: string;
    readonly name: string;
    equipped: BehaviorSubject<boolean>;
    readonly canEquip: boolean;
    readonly icon: string;
    readonly iconWatermark: string;
    owner: BehaviorSubject<Target>;
    readonly type: ItemType;
    readonly typeName: string;
    readonly quantity: number;
    power: number;
    readonly damageType: DamageType;
    readonly energyType: EnergyType;
    readonly stats: InventoryStat[];
    readonly sockets: InventorySocket[];
    readonly objectives: ItemObjective[];
    readonly desc: string;
    readonly classAllowed: ClassAllowed;
    readonly bucketOrder: number;
    readonly aggProgress: number;
    readonly values: NameQuantity[];
    readonly expirationDate: string;
    readonly expired: boolean;
    public locked: BehaviorSubject<boolean>;
    readonly masterworked: boolean;
    readonly masterwork: MasterworkInfo;
    readonly mods: InventoryPlug[];
    public tracked: boolean;
    readonly questline: Questline;
    readonly energyCapacity: number;
    readonly energyUsed: number;
    readonly totalStatPoints: number;
    public searchText: string;
    public isHighest = false;
    public markLabel: string;
    public mark: string;
    public notes: string;
    public inventoryBucket: ApiInventoryBucket;
    public tier: string;
    public readonly options: Target[] = [];
    public readonly isRandomRoll: boolean;
    public readonly ammoType: DestinyAmmunitionType;
    public postmaster: boolean;
    public canReallyEquip: boolean;
    public copies = 1;
    public pandaPve = 0;
    public pandaPvp = 0;
    public godRollInfo: string;
    public noGodRollInfo = false;
    public preferredStatPoints: number;
    public readonly seasonalModSlot: number;
    public readonly powerCap: number;
    public dupesByEnergyAndSeason?: number;
    public dupesTaggedToKeep?: number;
    public dupesByFrameSlotAndEnergy?: number;
    public coveredSeasons?: number[];
    readonly redacted: boolean;
    readonly specialModSockets: string[];
    readonly collectibleHash: string;
    public lowLinks: LowLinks;
    readonly versionNumber: number;

    statPointTier(): number {
        if (!this.totalStatPoints || this.totalStatPoints < 50) {
            return 0;
        }
        if (this.totalStatPoints < 60) {
            return 1;
        }
        if (this.totalStatPoints <= 65) {
            return 2;
        }
        if (this.totalStatPoints > 65) {
            return 3;
        }
    }

    damageTypeString(): string {
        return DamageType[this.damageType];
    }

    typeString(): string {
        return ItemType[this.type];
    }

    constructor(id: string, hash: string, name: string, equipped: boolean, canEquip: boolean, owner: Target,
        icon: string, iconWatermark: string,
        type: ItemType, typeName: string, quantity: number,
        power: number, damageType: DamageType, energyType: EnergyType, stats: InventoryStat[],
        sockets: InventorySocket[], objectives: ItemObjective[], desc: string, classAllowed: ClassAllowed,
        bucketOrder: number, aggProgress: number, values: NameQuantity[], expirationDate: string,
        locked: boolean, masterworked: boolean, masterwork: MasterworkInfo, mods: InventoryPlug[], tracked: boolean,
        questline: Questline, searchText: string, inventoryBucket: ApiInventoryBucket, tier: string, options: Target[],
        isRandomRoll: boolean, ammoType: DestinyAmmunitionType, postmaster: boolean, energyUsed: number,
        energyCapacity: number, totalStatPoints: number, seasonalModSlot: number, coveredSeasons: number[], powerCap: number, redacted: boolean,
        specialModSockets: string[], collectibleHash: string, versionNumber: number
    ) {
        this.id = id;
        this.hash = hash;
        this.name = name;
        this.equipped = new BehaviorSubject(equipped);
        this.canEquip = canEquip;
        this.owner = new BehaviorSubject(owner);

        this.icon = icon;
        this.iconWatermark = iconWatermark;
        this.type = type;
        this.typeName = typeName;
        this.quantity = quantity;
        this.power = power;
        this.damageType = damageType;
        this.energyType = energyType;
        this.stats = stats;
        this.sockets = sockets;
        this.objectives = objectives;
        this.desc = desc;
        this.classAllowed = classAllowed;
        this.bucketOrder = bucketOrder;
        this.aggProgress = aggProgress;
        this.values = values;
        this.expirationDate = expirationDate;
        if (!this.expirationDate) {
            this.expired = false;
        } else {
            const d = Date.parse(this.expirationDate);
            this.expired = Date.now() > d;
        }
        this.locked = new BehaviorSubject(locked);
        this.masterworked = masterworked;
        this.masterwork = masterwork;
        this.mods = mods;
        this.tracked = tracked;
        this.questline = questline;
        this.searchText = searchText;

        this.inventoryBucket = inventoryBucket;
        this.tier = tier;
        this.options = options;
        this.isRandomRoll = isRandomRoll;
        this.ammoType = ammoType;

        this.postmaster = postmaster;
        this.energyUsed = energyUsed;
        this.energyCapacity = energyCapacity;
        this.totalStatPoints = totalStatPoints;
        this.seasonalModSlot = seasonalModSlot;
        this.coveredSeasons = coveredSeasons;
        this.powerCap = powerCap;
        this.redacted = redacted;
        this.specialModSockets = specialModSockets;
        this.collectibleHash = collectibleHash;
        this.versionNumber = versionNumber;
    }
}

export class Currency {
    hash: string;
    name: string;
    icon: string;
    count: number;
    constructor(hash: string, name: string, icon: string, count: number) {
        this.hash = hash;
        this.name = name;
        this.icon = icon;
        this.count = count;
    }
}

export interface GearMetaData {
    postmaster: CharPostmasterMeta[];
    vault: VaultMeta;
    postmasterTotal: number;
}

export interface VaultMeta {
    count: number;
    total: number;
}

export interface CharPostmasterMeta {
    char: Character;
    count: number;
    total: number;
}

export class MilestoneStatus {
    readonly hash: string;
    readonly complete: boolean;
    readonly pct: number;
    info: string;
    suppInfo: string[];
    readonly phases: boolean[];
    readonly locked: boolean;
    readonly tooLowPower: boolean;
    readonly readyToCollect: boolean;

    constructor(hash: string, complete: boolean, pct: number, info: string, suppInfo: string[],
        phases: boolean[], locked: boolean, tooLowPower: boolean, readyToCollect?: boolean) {
        this.hash = hash;
        this.complete = complete;
        this.pct = pct;
        this.info = info;
        this.suppInfo = suppInfo;
        this.phases = phases;
        this.locked = locked;
        this.tooLowPower = tooLowPower;
        this.readyToCollect = readyToCollect;
    }
}

export interface MileStoneName {
    key: string;
    resets: string;
    rewards: string;
    boost: BoostInfo;
    name: string;
    desc: string;
    hasPartial: boolean;
    dependsOn: string[];
    neverDisappears?: boolean;
    suppInfo?: string;
    publicInfo?: PublicMilestone;
}

export abstract class Target {
    public readonly label: string;
    public readonly id: string;

    constructor(label: string, id: string) {
        this.label = label;
        this.id = id;
    }
}

export class Vault extends Target {
    constructor() {
        super('Vault', 'vault');
    }
}


export class Shared extends Target {
    constructor() {
        super('Shared', 'shared');
    }
}

export interface Fraction {
    top: number;
    bottom: number;
}


export class Character extends Target {
    readonly membershipId: string;
    readonly membershipType: number;
    readonly characterId: string;
    readonly className: string;
    light: number;
    lightFraction?: Fraction;
    basePL = 0;
    basePLString?: string;
    bestPlGear: { [key: string]: InventoryItem } = {};

    dateLastPlayed: string;
    minutesPlayedThisSession: string;
    minutesPlayedTotal: number;
    emblemBackgroundPath: string;
    emblemPath: string;
    baseCharacterLevel: number;
    maxLevel: number;
    percentToNextLevel: number;
    title: string;
    race: string;
    gender: string;
    classType: number;
    wellRested = false;
    currentActivity: CurrentActivity;
    milestones: { [key: string]: MilestoneStatus };
    clanMilestones: ClanMilestoneResult[];
    factions: Progression[];
    stats: CharacterStat[];
    startWeek: Date;
    endWeek: Date;
    lifetimeRaid = 0;
    lifetimeRaidNormal = 0;
    lifetimeRaidPrestige = 0;
    lifetimeEater = 0;
    lifetimeSpire = 0;
    lifetimeLwNormal = 0;
    lifetimeSpNormal = 0;
    hasEater = false;
    hasSpire = false;
    hasLevNm = false;
    hasLevHm = false;
    hasLwNm = false;
    hasSpNm = false;
    hasPrestigeNf = false;
    notReady = false;

    constructor(membershipType: number, membershipId: string, className: string, light: number, characterId: string) {
        super(className, characterId);
        this.characterId = characterId;
        this.membershipType = membershipType;
        this.membershipId = membershipId;
        this.className = className;
        this.light = light;

    }
}

export class Nightfall {
    name: string;
    desc: string;
    tiers: number[];
    modifiers: NameDesc[];
    challenges: NameDesc[];
    image: string;
}


export interface AggHistoryCache {
    membershipType: number;
    membershipId: string;
    lastLogon: number;
    stale: boolean;
    data: AggHistoryEntry[];
}

export interface CharCompletions {
    char: Character;
    count: number;
}

export interface AggHistoryEntry {
    name: string;
    type: string;
    hash: string[];
    special?: boolean;
    activityBestSingleGameScore: number; // this is a personal score, NOT team score, useless
    fastestCompletionMsForActivity: number;
    activityCompletions: number;
    charCompletions: CharCompletions[];
    efficiency: number;

    activityKills: number;
    activityAssists: number;
    activityDeaths: number;

    activityPrecisionKills: number;
    activitySecondsPlayed: number;
    activityLightLevel: number;
    kd?: number;
    highScore?: number;
    highScorePGCR?: string;
}

export class NameDesc {
    name: string;
    hash: string;
    desc: string;
    icon: string;

    constructor(name: string, desc: string, icon?: string, hash?: string) {
        this.name = name;
        this.desc = desc;
        this.icon = icon;
        this.hash = hash;
    }
}

export class CharacterStat {
    name: string;
    desc: string;
    value: number;

    constructor(name, desc, value) {
        this.name = name;
        this.desc = desc;
        this.value = value;
    }
}

export interface ClanMilestoneResult {
    name: string;
    earned: boolean;
    redeemed: boolean;
}

export class CurrentActivity {
    dateActivityStarted: string;
    name: string;
    type: string;
}

// export interface SuppCurrentActivityInfo{
//     partyMembers: PartyMember[];
// }

// export interface PartyMember {
//     membershipId: string;
//     displayName: string;
//     status: number;
//     emblemHash: number;
// }

export class Activity {
    period: string;
    type: string;
    mode: string;
    name: string;
    desc: string;
    pvType: string;
    completed: number;
    timePlayedSeconds: number;
    playerCount: number;
    standing: number;
    kills: number;
    deaths: number;
    kd: number;
    assists: number;
    score: number;
    teamScore: number;
    completionReason: number;
    success: boolean;

    activityLevel: number;
    activityLightLevel: number;
    referenceId: number;
    instanceId: string;
    activityTypeHashOverride: number;
    isPrivate: boolean;
}

export class Platform {
    name: string;
    type: number;
    desc: string;
    icon: IconDefinition;

    constructor(type: number, name: string, desc: string, icon: IconDefinition) {
        this.type = type;
        this.name = name;
        this.desc = desc;
        this.icon = icon;
    }
}

export class ClanRow {
    name: string;
    id: string;
    constructor(name: string, id: string) {
        this.id = id;
        this.name = name;
    }
}

export class BungieMemberPlatform {
    name: string;
    platform: Platform;
    defunct = false;

    constructor(name: string, platform: Platform) {
        this.name = name;
        this.platform = platform;
    }
}

export class ClanInfo {

    groupId: string;
    name: string;
    creationDate: string;
    memberCount: number;
    avatarPath: string;
    bannerPath: string;
    primaryProgression: Progression;
    progressions: Progression[];
    about: string;
}

export interface ProgressStep {
    stepName: string;
    progressTotal: number;
    cumulativeTotal: number;
}

export class Progression {
    icon: string;
    name: string;
    info: string;
    desc: string;
    hash: string;
    nextLevelAt: number;
    progressToNextLevel: number;
    progressionHash: number;
    level: number;
    levelCap: number;
    dailyProgress: number;
    dailyLimit: number;
    weeklyProgress: number;
    weeklyLimit: number;
    currentProgress: number;
    completeProgress?: number; // includes resets
    percentToNextLevel: number;
    steps: ProgressStep[];
    totalProgress: number;
    currentResetCount: number;
    title: string;
    nextTitle: string;
    special: string;
}

export class Const {
    // used for clan filter
    public static readonly ALL_PLATFORM = new Platform(0, 'ALL', 'All', faUsers);
    public static readonly XBL_PLATFORM = new Platform(1, 'XBL', 'Xbox', faXbox);
    public static readonly PSN_PLATFORM = new Platform(2, 'PSN', 'Playstation', faPlaystation);
    public static readonly STEAM_PLATFORM = new Platform(3, 'STEAM', 'Steam', faSteam);
    public static readonly BNET_PLATFORM = new Platform(4, 'BNET', 'Battle.net', faWindows);
    public static readonly STADIA_PLATFORM = new Platform(5, 'STADIA', 'Stadia', faGoogle);



    public static readonly HIDE_MILESTONES: string[] = [
        '534869653', // xur
        '3341030123', // rewiring the light
        // '3031052508','2953722265','3632712541' // battlegrounds
    ];

    public static readonly PLATFORMS_ARRAY = [
        Const.XBL_PLATFORM, Const.STEAM_PLATFORM, Const.PSN_PLATFORM, Const.STADIA_PLATFORM, Const.BNET_PLATFORM
    ]; // Const.BNET_PLATFORM

    public static readonly PLATFORMS_DICT = {
        '1': Const.XBL_PLATFORM,
        '2': Const.PSN_PLATFORM,
        '3': Const.STEAM_PLATFORM,
        // '4': Const.BNET_PLATFORM,
        '5': Const.STADIA_PLATFORM
    };

    public static readonly MISSION_ARTIFACT_KEY = '22222222';
    // public static readonly  PSUEDO_HERESY_KEY = 'PSUEDO-HERESY';
    // public static readonly PROPHECY_KEY = '44444444';
    // public static readonly PSUEDO_PRESAGE = 'PSUEDO-PRESAGE';
    public static readonly PSUEDO_MASTER_EMPIRE_HUNT = 'PSUEDO_MASTER_EMPIRE';

    public static readonly LIGHT_TOO_LOW = 1269; // #UPDATEME
    private static readonly SEASON_SOFT_CAP = 1270; // #UPDATEME
    public static readonly SEASON_HARD_CAP = 1320; // #UPDATEME
    public static readonly SEASON_PINNACLE_CAP = 1330; // #UPDATEME


    public static readonly BOOST_UNKNOWN = 'BOOST_UNKNOWN';
    public static readonly BOOST_SEASON_PASS = 'BOOST_SEASON_PASS';
    public static readonly BOOST_LEGENDARY = 'BOOST_LEGENDARY';
    public static readonly BOOST_POWERFUL_1 = 'BOOST_POWERFUL_1';
    public static readonly BOOST_POWERFUL_2 = 'BOOST_POWERFUL_2';
    public static readonly BOOST_POWERFUL_3 = 'BOOST_POWERFUL_3';
    public static readonly BOOST_PINNACLE_WEAK = 'BOOST_PINNACLE_WEAK';
    public static readonly BOOST_PINNACLE = 'BOOST_PINNACLE';

    public static readonly BOOST_DROP_TABLE: { [key: string]: BoostInfo } = {
        'BOOST_UNKNOWN': {
            key: Const.BOOST_UNKNOWN,
            name: 'Unknown',
            hideFromTable: true,
            sortVal: -10,
            upToHardCap: {
                bonus: 0,
                min: 0,
                max: 0
            },
            afterHardCap: {
                bonus: 0,
                min: 0,
                max: 0
            },
            cappedAt: Const.SEASON_HARD_CAP
        },
        'BOOST_LEGENDARY': {
            key: Const.BOOST_UNKNOWN,
            name: 'Legendary',
            sortVal: 0,
            upToHardCap: {
                bonus: 0,
                min: -3,
                max: 0
            },
            afterHardCap: null,
            cappedAt: Const.SEASON_HARD_CAP
        },
        'BOOST_SEASON_PASS': {
            key: Const.BOOST_SEASON_PASS,
            name: 'Season Pass',
            sortVal: 5,
            upToHardCap: {
                bonus: 0,
                min: 0,
                max: 0
            },
            afterHardCap: {
                bonus: 0,
                min: 0,
                max: 0
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        },
        'BOOST_PRIME': {
            key: Const.BOOST_POWERFUL_1,
            name: 'Prime Engram',
            sortVal: 7,
            upToHardCap: {
                bonus: 3
            },
            afterHardCap: {
                bonus: 0
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        },
        'BOOST_POWERFUL_1': {
            key: Const.BOOST_POWERFUL_1,
            name: 'Powerful (Tier 1)',
            sortVal: 10,
            upToHardCap: {
                bonus: 3
            },
            afterHardCap: {
                bonus: 0
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        },
        'BOOST_POWERFUL_2': {
            key: Const.BOOST_POWERFUL_2,
            name: 'Powerful (Tier 2)',
            sortVal: 20,
            upToHardCap: {
                bonus: 4
            },
            afterHardCap: {
                bonus: 0
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        },
        'BOOST_POWERFUL_3': {
            key: Const.BOOST_POWERFUL_3,
            name: 'Powerful (Tier 3)',
            sortVal: 30,
            upToHardCap: {
                bonus: 5
            },
            afterHardCap: {
                bonus: 0
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        },
        'BOOST_PINNACLE_WEAK': {
            key: Const.BOOST_PINNACLE_WEAK,
            name: 'Pinnacle (Weak)',
            sortVal: 40,
            upToHardCap: {
                bonus: 3
            },
            afterHardCap: {
                bonus: 1
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        },
        'BOOST_PINNACLE': {
            key: Const.BOOST_PINNACLE,
            name: 'Pinnacle',
            sortVal: 50,
            upToHardCap: {
                bonus: 5
            },
            afterHardCap: {
                bonus: 2
            },
            cappedAt: Const.SEASON_PINNACLE_CAP
        }
    };
}

export interface BoostInfo {
    key: string;
    name: string;
    hideFromTable?: boolean;
    sortVal: number;
    upToHardCap: Bonus;
    afterHardCap: Bonus;
    cappedAt: number;
}

export interface Bonus {
    bonus: number;
    min?: number;
    max?: number;
}

export class InventoryStat {
    readonly hash: number;
    readonly name: string;
    readonly desc: string;
    value: number;
    baseValue: number;
    enhancement: number;
    index: number;

    constructor(hash, name, desc, value, baseValue, index) {
        this.hash = hash;
        this.name = name;
        this.desc = desc;
        this.value = value;
        this.baseValue = baseValue;
        this.index = index;
    }

    getValue(): number {
        if (this.value != null) {
            return this.value;
        } else {
            return this.baseValue;
        }
    }
}

export class InventorySocket {
    readonly socketCategoryHash: string;
    readonly plugs: InventoryPlug[];
    readonly possiblePlugs: InventoryPlug[];

    constructor(socketCategoryHash: string, plugs: InventoryPlug[], possiblePlugs: InventoryPlug[]) {
        this.socketCategoryHash = socketCategoryHash;
        this.plugs = plugs;
        this.possiblePlugs = possiblePlugs;
    }

}

export class InventoryPlug {
    readonly hash: string;

    readonly name: string;
    readonly icon: string;
    readonly active: boolean;
    readonly enabled: boolean;
    readonly objectives: ItemObjective[];
    public currentlyCanRoll: boolean;
    public pandaPve = 0;
    public pandaPvp = 0;

    public targetArmorPerk = false;
    public desc: string;
    public selectedPossible = false; // used for possible roll screen only
    public inventoryStats: InventoryStat[] = [];

    constructor(hash: string, name: string, desc: string, icon: string, active: boolean, enabled?: boolean, objectives?: ItemObjective[]) {
        this.hash = hash;
        this.name = name;
        this.desc = desc;
        this.icon = icon;
        this.active = active;
        this.enabled = enabled;
        if (objectives) {
            this.objectives = objectives;
        } else {
            this.objectives = [];
        }
        this.currentlyCanRoll = true;
    }
}

export interface Questline {
    hash: string;
    name: string;
    steps: QuestlineStep[];
    progress: string;
}

export interface QuestlineStep {
    hash: number;
    name: string;
    desc: string;
    objectives: ItemObjective[];
    values: QuestStepReward[];
    current: boolean;
}

export interface QuestStepReward {
    hash: string;
    name: string;
    quantity: number;
}

export interface Mission {
    name: string;
    icon: string;
    hash: string;
}

export interface Sort {
    name: string;
    ascending: boolean;
}

export interface ProfileTransitoryData {
    partyMembers: SearchResult[];
    currentActivity: CurrentPartyActivity;
    joinability: Joinability;
}

export interface CurrentPartyActivity {
    startTime: string;
    score: number;
    highestOpposingFactionScore: number;
    numberOfOpponents: number;
    numberOfPlayers: number;
}

export interface Joinability {
    openSlots: number;
    privacySetting: number;
    closedReasons: number;
}

export interface ApiInventoryBucket {
    blacklisted: boolean;
    bucketOrder: number;
    category: number;
    displayProperties: ApiDisplayProperties;
    enabled: boolean;
    fifo: boolean;
    hasTransferDestination: boolean;
    hash: number;
    index: number;
    itemCount: number;
    location: number;
    redacted: boolean;
    scope: number;
}

export interface ItemDisplay {
    itemTypeDisplayName: string;
    itemTypeAndTierDisplayName: string;
    displayProperties: ApiDisplayProperties;
}

export interface ApiDisplayProperties {
    description: string;
    hasIcon: boolean;
    name: string;
}

export interface ApiItemTierType {
    blacklisted: boolean;
    displayProperties: ApiDisplayProperties;
    hash: number;
    index: number;
    infusionProcess: any;
    redacted: boolean;
}

export interface CharacterVendorData {
    char: Character;
    data: InventoryItem[];
    cached: boolean;
    ts?: number;
    loading?: boolean;
}

export interface VendorCost {
    desc: ManifestInventoryItem;
    count: number;
}

export interface VendorItemInfo {
    tags?: string[];
    vendor: Vendor;
    status: string;
    quantity: number;
    values: NameQuantity[];
    costs: VendorCost[];
    objectives: ItemObjective[];
    searchText: string;
}

export interface LostSector {
    activity: LegendLostSectorActivity;
    icon: string;
    soloReward: string;
    special: boolean;
}

export interface LostSectorInfo {
    abbrev: string;
    hash: string;
    shields: string[];
    champions: Champion[];
}

interface Champion {
    name: string;
    count: number;
}

export interface PursuitTuple {
    vendorItem: InventoryItem;
    characterItem: InventoryItem;
}
