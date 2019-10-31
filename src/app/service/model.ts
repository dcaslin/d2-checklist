import { faGoogle, faPlaystation, faSteam, faWindows, faXbox } from '@fortawesome/free-brands-svg-icons';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/pro-light-svg-icons';
import { BehaviorSubject } from 'rxjs';
import { Moment } from 'moment';

export enum ClassAllowed {
    Titan = 0,
    Hunter = 1,
    Warlock = 2,
    Any = 3
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
    Chalice = 97, // custom
    ForgeVessel = 98, // custom
    GearMod = 99  // custom added
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
    Raid = 5
}

export enum EnergyType {
    Any = 0,
    Arc = 1,
    Thermal = 2,
    Void = 3
}

export interface MastworkInfo {
    hash: string;
    name: string;
    desc: string;
    icon: string;
    tier: number;
}

export interface RecordSeason {
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
    name: string;
    desc: string;
    icon: string;
    children: TriumphNode[];
    title: string;

    percent: number;
    progress: number;
    completionValue: number;
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
}

export interface TriumphRecordNode extends TriumphNode {
    objectives: ItemObjective[];
    intervalsRedeemedCount: number;
    redeemed: boolean;
    title: boolean;
    interval: boolean;
    earned: number;
    score: number;
    lowLinks?: LowLinks;
    percent: number;
    searchText: string;
    invisible: boolean;
    pointsToBadge: boolean;
    badge?: Badge;
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
}

export interface SaleItem {
    vendor: Vendor;
    hash: string;
    name: string;
    icon: string;
    type: ItemType;
    tierType: number;
    status: string;
    itemTypeAndTierDisplayName: string;
    itemTypeDisplayName: string;
    quantity: number;
    objectives: ItemObjective[];
    rolledPerks: ItemPerks[][];
    value: NameQuantity[];
    costs: NameQuantity[];
    searchText: string;
    lowLinks?: LowLinks;
}

export interface ItemPerks {
    icon: string;
    hash: string;
    name: string;
    desc: string;
}

export interface PublicMilestonesAndActivities {
    publicMilestones: PublicMilestone[];
    crucibleCore: MilestoneActivity[];
    crucibleRotator: MilestoneActivity[];
    herMenag: MilestoneActivity;
    heroicStrikes: MilestoneActivity;
    reckoning: MilestoneActivity;
    nightfalls: Mission[];
    flashpoint: string;
    weekStart: Moment;
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
    aggActivities: AggMilestoneActivity[];
    rewards: string;
    pl: number;
    summary: string;
    milestoneType: number;
    type?: string;

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
    membershipType: number;
    membershipId: string;
    displayName: string;
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


export class SelectedUser {
    userInfo: UserInfo;
    selectedUserCurrencies: BehaviorSubject<Currency[]> = new BehaviorSubject([]);
    membership: BungieMembership;
    promptForPlatform = false;
}

export class BungieGroupMember {
    memberType: number;
    isOnline: boolean;
    lastOnlineStatusChange: number;
    groupId: string;
    destinyUserInfo: UserInfo;
    bungieNetUserInfo: BungieNetUserInfo;
    joinDate: string;
    player: Player;
    errorMsg: string;

    isDefunct(): boolean {
        const current = this.destinyUserInfo.crossSaveOverride == 0 ||
            (this.destinyUserInfo.crossSaveOverride == this.destinyUserInfo.membershipType);
        return !current;
    }
}


export class FriendListEntry {
    user: UserInfo;
    player?: Player;
    errorMsg?: string;
}

export interface BungieNetUserInfo {
    supplementalDisplayName: string;
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
    desc: string;
    lowLinks?: LowLinks;
}

export interface Checklist {
    hash: string;
    name: string;
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
    totals: CharTotal[];
    entries: CharChecklistItem[];
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
    readonly seasons: RecordSeason[];
    readonly hasHiddenClosest: boolean;
    readonly accountProgressions: Progression[];
    readonly glory: Progression;
    readonly seasonRank: Progression;
    readonly valor: Progression;
    readonly infamy: Progression;
    readonly artifactPowerBonus: number;
    readonly transitoryData: ProfileTransitoryData;
    maxLL = 0;
    pvpStreak: PvpStreak;
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
        title: string, seasons: RecordSeason[], hasHiddenClosest: boolean,
        accountProgressions: Progression[], artifactPowerBonus: number, transitoryData: ProfileTransitoryData) {
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
        if (characters != null && characters.length > 0) {
            for (const char of characters) {
                if (char.light > this.maxLL) {
                    this.maxLL = char.light;
                }
            }
        }
        this.vault = vault;
        this.shared = shared;
        this.lowHangingTriumphs = lowHangingTriumphs;
        this.searchableTriumphs = searchableTriumphs;
        this.searchableCollection = searchableCollection;
        this.seals = seals;
        this.badges = badges;
        this.title = title;
        this.seasons = seasons;
        this.hasHiddenClosest = hasHiddenClosest;
        this.accountProgressions = accountProgressions;
        this.artifactPowerBonus = artifactPowerBonus;
        this.transitoryData = transitoryData;
        if (accountProgressions != null) {
            let prestige: Progression = null;
            for (const ap of accountProgressions) {
                // valor
                if (ap.hash == '2626549951') {
                    this.valor = ap;
                } else if (ap.hash == '2772425241') {
                    this.infamy = ap;
                } else if (ap.hash == '2000925172') {
                    this.glory = ap;
                } else if (ap.hash == '1628407317') {
                    this.seasonRank = ap;
                } else if (ap.hash == '3184735011') {
                    prestige = ap;
                }
            }
            if (prestige != null && this.seasonRank != null) {
                prestige.level += this.seasonRank.level;
                prestige.weeklyProgress += this.seasonRank.weeklyProgress;
                prestige.dailyProgress += this.seasonRank.dailyProgress;
                this.seasonRank = prestige;
            }
        }

    }

    public getWeeklyXp(): number {
        return this.seasonRank ? this.seasonRank.weeklyProgress : 0;
    }
}

export class InventoryItem {
    readonly id: string;
    readonly hash: string;
    readonly name: string;
    equipped: boolean;
    readonly canEquip: boolean;
    readonly icon: string;
    owner?: Target;
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
    readonly values: any;
    readonly expirationDate: string;
    readonly expired: boolean;
    public locked: boolean;
    readonly masterworked: boolean;
    readonly masterwork: MastworkInfo;
    readonly mods: InventoryPlug[];
    readonly tracked: boolean;
    readonly questline: Questline;
    readonly energyCapacity: number;
    readonly energyUsed: number;
    readonly totalStatPoints: number;
    public searchText: string;
    public markLabel: string;
    public mark: string;
    public notes: string;
    public inventoryBucket: string;
    public tier: string;
    public readonly options: Target[] = [];
    public readonly isRandomRoll: boolean;
    public readonly ammoType: DestinyAmmunitionType;
    public postmaster: boolean;
    public canReallyEquip: boolean;
    public copies = 1;
    public godRoll = false;
    public godRollPve = false;
    public godRollPvp = false;
    public noGodRollInfo = false;
    public preferredStatPoints: number;

    public lowLinks: LowLinks;
    // more to come, locked other stuff

    damageTypeString(): string {
        return DamageType[this.damageType];
    }

    typeString(): string {
        return ItemType[this.type];
    }

    constructor(id: string, hash: string, name: string, equipped: boolean, canEquip: boolean, owner: Target,
        icon: string, type: ItemType, typeName: string, quantity: number,
        power: number, damageType: DamageType, energyType: EnergyType, stats: InventoryStat[],
        sockets: InventorySocket[], objectives: ItemObjective[], desc: string, classAllowed: ClassAllowed,
        bucketOrder: number, aggProgress: number, values: any, expirationDate: string,
        locked: boolean, masterworked: boolean, masterwork: MastworkInfo, mods: InventoryPlug[], tracked: boolean,
        questline: Questline, searchText: string, inventoryBucket: string, tier: string, options: Target[],
        isRandomRoll: boolean, ammoType: DestinyAmmunitionType, postmaster: boolean, energyUsed?: number,
        energyCapacity?: number, totalStatPoints?: number
    ) {
        this.id = id;
        this.hash = hash;
        this.name = name;
        this.equipped = equipped;
        this.canEquip = canEquip;
        this.owner = owner;

        this.icon = icon;
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
        this.locked = locked;
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

export class MilestoneStatus {
    readonly hash: string;
    readonly complete: boolean;
    readonly pct: number;
    readonly info: string;
    readonly suppInfo: string;
    readonly phases: boolean[];
    readonly indeterminate: boolean;

    constructor(hash: string, complete: boolean, pct: number, info: string, suppInfo: string, phases: boolean[], indeterminate?: boolean) {
        this.hash = hash;
        this.complete = complete;
        this.pct = pct;
        this.info = info;
        this.suppInfo = suppInfo;
        this.phases = phases;
        this.indeterminate = indeterminate;
    }
}

export interface MileStoneName {
    key: string;
    resets: string;
    rewards: string;
    pl: number;
    name: string;
    desc: string;
    hasPartial: boolean;
    neverDisappears?: boolean;
    suppInfo?: string;
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


export class Character extends Target {
    readonly membershipId: string;
    readonly membershipType: number;
    readonly characterId: string;
    readonly className: string;
    readonly light: number;

    dateLastPlayed: string;
    minutesPlayedThisSession: string;
    minutesPlayedTotal: string;
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

export interface AggHistoryEntry {
    name: string;
    type: string;
    hash: string[];
    special?: boolean;
    activityBestSingleGameScore: number; // this is a personal score, NOT team score, useless
    fastestCompletionMsForActivity: number;
    activityCompletions: number;
    efficiency: number;

    activityKills: number;
    activityAssists: number;
    activityDeaths: number;

    activityPrecisionKills: number;
    activitySecondsPlayed: number;
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

export class PGCR {
    period: string;
    activityDurationSeconds: number;
    finish: string;
    // Acitivity Details
    referenceId: number;
    instanceId: string;
    mode: string;
    name: string; // from referenceId
    isPrivate: boolean;
    entries: PGCREntry[];
    level: number;
    teams: PGCRTeam[];
    pveSuccess?: boolean;
    pve: boolean;
    ll: number;
    teamScore: number;
    timeLostPoints: number;

}

export class PGCRTeam {
    name: string;
    standing: string;
    score: number;
}


export class CurrentActivity {
    dateActivityStarted: string;
    name: string;
    type: string;
    activityLevel: number;
    activityLightLevel: number;
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


export class PGCREntry {
    standing: number;
    score: number;
    teamScore: number;
    values: any;
    kd: number;
    user: UserInfo;
    bungieNetUserInfo: BungieNetUserInfo;

    characterId: string;
    characterClass: string;
    characterLevel: number;
    lightLevel: number;

    kills: number;
    deaths: number;
    assists: number;
    fireteamId: number;
    fireteamSize: number;
    team: string;
    completionReason: number;

    startSeconds: number;
    activityDurationSeconds: number;
    timePlayedSeconds: number;
    weapons: PGCRWeaponData[];
    extra: PGCRExtraData[];
}


export class PGCRExtraData {
    name: string;
    value: number;
    desc: any;
}

export class PGCRWeaponData {
    hash: string;
    name: string;
    type: string;
    kills: number;
    precPct: number;
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
    lifetimeResetCount: number;
    title: string;
    nextTitle: string;
}

export interface PvpStreak {
    count: number;
    win: boolean;
}

export class Const {
    // used for clan filter
    public static readonly ALL_PLATFORM = new Platform(0, 'ALL', 'All', faUsers);
    public static readonly XBL_PLATFORM = new Platform(1, 'XBL', 'Xbox', faXbox);
    public static readonly PSN_PLATFORM = new Platform(2, 'PSN', 'Playstation', faPlaystation);
    public static readonly STEAM_PLATFORM = new Platform(3, 'STEAM', 'Steam', faSteam);
    public static readonly BNET_PLATFORM = new Platform(4, 'BNET', 'Battle.net', faWindows);
    public static readonly STADIA_PLATFORM = new Platform(5, 'STADIA', 'Stadia', faGoogle);

    public static readonly PLATFORMS_ARRAY = [
        Const.XBL_PLATFORM, Const.PSN_PLATFORM, Const.STEAM_PLATFORM, Const.BNET_PLATFORM, Const.STADIA_PLATFORM
    ];

    public static readonly PLATFORMS_DICT = {
        '1': Const.XBL_PLATFORM,
        '2': Const.PSN_PLATFORM,
        '3': Const.STEAM_PLATFORM,
        '4': Const.BNET_PLATFORM,
        '5': Const.STADIA_PLATFORM
    };

    public static readonly ERIS_KEY = '11111111';
    public static readonly CHALICE_KEY = '22222222';

    public static readonly UNKNOWN_BOOST = 0;
    public static readonly NO_BOOST = 1;
    public static readonly LOW_BOOST = 2;
    public static readonly MID_BOOST = 3;
    public static readonly HIGH_BOOST = 4;

    public static readonly BOOSTS: DropInfo[] = [
        {
            level: Const.UNKNOWN_BOOST,
            min: 0,
            max: 1,
            softCap: 900,
            hardCap: 950
        },
        {
            level: Const.NO_BOOST,
            min: -3,
            max: 0,
            softCap: 900,
            hardCap: 950
        },
        {
            level: Const.LOW_BOOST,
            min: 3,
            max: 3,
            softCap: 950,
            hardCap: 950
        },
        {
            level: Const.MID_BOOST,
            min: 4,
            max: 4,
            softCap: 950,
            hardCap: 950
        },
        {
            level: Const.HIGH_BOOST,
            min: 5,
            max: 5,
            softCap: 950,
            hardCap: 960
        }
    ];
}

export interface DropInfo {
    level: number;
    min: number;
    max: number;
    softCap: number;
    hardCap: number;
}

export class InventoryStat {
    readonly name: string;
    readonly desc: string;
    value: number;
    baseValue: number;
    enhancement: number;

    constructor(name, desc, value, baseValue) {
        this.name = name;
        this.desc = desc;
        this.value = value;
        this.baseValue = baseValue;
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

export interface PerkCount {
    perk: InventoryPlug;
    count: number;
}

export class InventoryPlug {
    readonly hash: string;

    readonly name: string;
    readonly icon: string;
    readonly active: boolean;
    readonly enabled: boolean;
    readonly objectives: ItemObjective[];
    public godRoll = false;
    public godRollPve = false;
    public godRollPvp = false;
    public targetArmorPerk = false;
    public alreadyEquipped = false;
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
    }
}

export interface Questline {
    hash: string;
    name: string;
    steps: QuestlineStep[];
    progress: string;
}

export interface QuestlineStep {
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
