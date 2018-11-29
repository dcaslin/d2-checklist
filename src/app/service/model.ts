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
    GearMod = 99  // custom added
}

export enum DamageType {
    None = 0,
    Kinetic = 1,
    Arc = 2,
    Thermal = 3,
    Void = 4,
    Raid = 5
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
}

export interface TriumphPresentationNode extends TriumphNode {
    progress: number,
    completionValue: number,
    unredeemedCount: number;
}

export interface TriumphRecordNode extends TriumphNode {
    objectives: ItemObjective[];
    redeemed: boolean;
    title: boolean;
    mapLink: string;
    score: number;
}

export interface TriumphCollectibleNode extends TriumphNode {
   acquired: boolean;
   sourceString: string;
}
export interface Vendor {
    hash: string;
    name: string;
    icon: string;
    displayProperties: any;
    nextRefreshDate: string;
}

export interface SaleItemCost {
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
    objectives: any;
    rolledPerks: ItemPerks[][];
    value: any;
    costs: SaleItemCost[];
    searchText: string;
    mapLink?: string;
}

export interface ItemPerks {
    icon: string;
    hash: string;
    name: string;
    desc: string;
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
    summary: string;

}

export interface AggMilestoneActivity {
    lls: number[],
    activity: MilestoneActivity
}

export interface MilestoneActivity {
    hash: string;
    name: string;
    desc: string;
    ll: number;
    tier: number;
    icon: string;
    challenges: MilestoneChallenge[];
    modifiers: NameDesc[];
    loadoutReqs: LoadoutRequirement[];
}


export interface LoadoutRequirement {
    equipmentSlot: string;
    allowedEquippedItems: string[];
    allowedWeaponSubTypes: string[];
}

export interface MilestoneChallenge {

    name: string;
    desc: string;
    completionValue: number;
    progressDescription: number;
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
    completionValue: number;
    progressDescription: string;
    progress: number;
    complete: boolean;
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

export class SelectedUser {
    userInfo: UserInfo;
    selectedUserCurrencies: Currency[];
    membership: BungieMembership;
    promptForPlatform = false;
}

export class BungieMembership {
    bungieId: string;
    clans: ClanRow[];
    destinyMemberships: UserInfo[];
}

export class BungieGroupMember {
    memberType: number;
    isOnline: boolean;
    groupId: string;
    destinyUserInfo: UserInfo;
    bungieNetUserInfo: BungieNetUserInfo;
    joinDate: string;
    player: Player;
    errorMsg: string;
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
    platformName: string;
    displayName: string;
    icon: string;
    bungieMembershipId?: string;
}

export class LeaderBoardList {
    name: string;
    entries: LeaderboardEntry[];

    constructor(name: string, entries: LeaderboardEntry[]) {
        this.name = name;
        this.entries = entries;
    }
}

export class LeaderboardEntry {
    destinyUserInfo: UserInfo;
    characterId: string;
    characterClass: string;
    light: number;
    rank: number;
    value: number;
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
    mapLink?: string;
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
    mapLink?: string;
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
    profile: Profile;
    superprivate: boolean;
    hasWellRested: boolean;
    currentActivity: CurrentActivity;
    characters: Character[];
    milestoneList: MileStoneName[];
    currencies: Currency[];
    bounties: InventoryItem[];
    rankups: Rankup[];
    checklists: Checklist[];
    charChecklists: CharChecklist[];
    triumphScore: number;
    records: TriumphNode[];
    collections: TriumphNode[];
    maxLL = 0;

    constructor(profile: Profile, characters: Character[], currentActivity: CurrentActivity, milestoneList: MileStoneName[],
        currencies: Currency[], bounties: InventoryItem[], rankups: Rankup[],            superprivate: boolean, hasWellRested: boolean,
        checklists: Checklist[], charChecklists: CharChecklist[], triumphScore: number, records: TriumphNode[],
        collections: TriumphNode[]) {
        this.profile = profile;
        this.characters = characters;
        this.currentActivity = currentActivity;
        this.milestoneList = milestoneList;
        this.currencies = currencies;
        this.bounties = bounties;
        this.rankups = rankups;
        this.superprivate = superprivate;
        this.hasWellRested = hasWellRested;
        this.checklists = checklists;
        this.charChecklists = charChecklists;
        this.triumphScore = triumphScore;
        this.records = records;
        this.collections = collections;
        if (characters != null && characters.length > 0) {
            for (const char of characters) {
                if (char.light > this.maxLL) {
                    this.maxLL = char.light;
                }
            }
        }
    }
}

export class InventoryItem {
    readonly hash: string;
    readonly name: string;
    readonly equipped: boolean;
    readonly icon: string;
    readonly owner?: Character;
    readonly type: ItemType;
    readonly typeName: string;
    readonly quantity: number;
    readonly power: number;
    readonly damageType: DamageType;
    readonly perks: Perk[];
    readonly stats: InventoryStat[];
    readonly sockets: InventorySocket[];
    readonly objectives: ItemObjective[];
    readonly desc: string;
    readonly classAvail: any;
    readonly bucketOrder: number;
    readonly aggProgress: number;
    readonly values: any;
    readonly expirationDate: string;
    public mapLink: string;
    // more to come, locked other stuff

    damageTypeString(): string {
        return DamageType[this.damageType];
    }

    typeString(): string {
        return ItemType[this.type];
    }

    constructor(hash: string, name: string, equipped: boolean, owner: Character,
        icon: string, type: ItemType, typeName: string, quantity: number,
        power: number, damageType: DamageType, perks: Perk[], stats: InventoryStat[],
        sockets: InventorySocket[], objectives: ItemObjective[], desc: string, classAvail: any,
        bucketOrder: number, aggProgress: number, values: any, expirationDate: string
    ) {
        this.hash = hash;
        this.name = name;
        this.equipped = equipped;
        this.owner = owner;
        this.icon = icon;
        this.type = type;
        this.typeName = typeName;
        this.quantity = quantity;
        this.power = power;
        this.damageType = damageType;
        this.perks = perks;
        this.stats = stats;
        this.sockets = sockets;
        this.objectives = objectives;
        this.desc = desc;
        this.classAvail = classAvail;
        this.bucketOrder = bucketOrder;
        this.aggProgress = aggProgress;
        this.values = values;
        this.expirationDate = expirationDate;
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
    hash: string;
    complete: boolean;
    pct: number;
    info: string;
    suppInfo: string;

    constructor(hash, complete, pct, info, suppInfo?) {
        this.hash = hash;
        this.complete = complete;
        this.pct = pct;
        this.info = info;
        this.suppInfo = suppInfo;
    }
}

export interface MileStoneName {
    key: string;
    resets: string;
    rewards: string;
    name: string;
    desc: string;
    hasPartial: boolean;
    neverDisappears?: boolean;
}

export class Character {
    membershipId: string;
    membershipType: number;
    characterId: string;
    dateLastPlayed: string;
    minutesPlayedThisSession: string;
    minutesPlayedTotal: string;
    light: number;
    emblemBackgroundPath: string;
    emblemPath: string;
    baseCharacterLevel: number;
    maxLevel: number;
    percentToNextLevel: number;
    race: string;
    gender: string;
    className: string;
    classType: number;
    levelProgression: LevelProgression;
    legendProgression: Progression;
    wellRested = false;
    currentActivity: CurrentActivity;
    milestones: { [key: string]: MilestoneStatus };
    clanMilestones: ClanMilestoneResult[];
    factions: Progression[];
    // progressions: Progression[];
    stats: CharacterStat[];
    startWeek: Date;
    endWeek: Date;
    lifetimeRaid = 0;
    lifetimeRaidNormal = 0;
    lifetimeRaidPrestige = 0;
    lifetimeEater = 0;
    lifetimeSpire = 0;
    lifetimeLwNormal = 0;
    hasEater = false;
    hasSpire = false;
    hasLevNm = false;
    hasLevHm = false;
    hasLwNm = false;
    hasPrestigeNf = false;
    aggHistory: AggHistory;

}

export class Nightfall {
    name: string;
    desc: string;
    tiers: number[];
    modifiers: NameDesc[];
    challenges: NameDesc[];
    image: string;
}

export class AggHistory {
    nf = 0;
    nfFastestMs: number;

    hmNf = 0;
    hmNfFastestMs: number;

    eater = 0;
    eaterFastestMs: number;

    spire = 0;
    spireFastestMs: number;

    raid = 0;
    raidFastestMs: number;

    hmRaid = 0;
    hmRaidFastestMs: number;

    lwNm = 0;
    lwNmFastestMs: number;
}



export class NameDesc {
    name: string;
    desc: string;

    constructor(name: string, desc: string) {
        this.name = name;
        this.desc = desc;
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

export interface LevelProgression {
    progressionHash: number;
    dailyProgress: number;
    dailyLimit: number;
    weeklyProgress: number;
    weeklyLimit: number;
    currentProgress: number;
    level: number;
    levelCap: number;
    stepIndex: number;
    progressToNextLevel: number;
    nextLevelAt: number;
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
    iconClass: string;

    constructor(type: number, name: string, desc: string, iconClass: string) {
        this.type = type;
        this.name = name;
        this.desc = desc;
        this.iconClass = iconClass;
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

export class BungieMember {
    name: string;
    id: string;
    noClan = false;
    clans: ClanRow[] = null;
    xbl: BungieMemberPlatform;
    psn: BungieMemberPlatform;
    bnet: BungieMemberPlatform;

    constructor(name: string, id: string, xbl: BungieMemberPlatform, psn: BungieMemberPlatform, bnet: BungieMemberPlatform) {
        this.id = id;
        this.name = name;
        this.xbl = xbl;
        this.psn = psn;
        this.bnet = bnet;
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


export class Progression {
    icon: string;
    name: string;
    info: string;
    desc: string;
    hash: number;
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
    percentToNextLevel: number;
}

export class Const {

    public static XBL_PLATFORM = new Platform(1, 'XBL', 'Xbox', 'fab fa-xbox');
    public static PSN_PLATFORM = new Platform(2, 'PSN', 'Playstation', 'fab fa-playstation');
    public static BNET_PLATFORM = new Platform(4, 'BNET', 'Battle.net', 'fal fa-desktop');

    public static PLATFORMS_ARRAY = [
        Const.XBL_PLATFORM, Const.PSN_PLATFORM, Const.BNET_PLATFORM
    ];

    public static PLATFORMS_DICT = {
        '1': Const.XBL_PLATFORM,
        '2': Const.PSN_PLATFORM,
        '4': Const.BNET_PLATFORM
    }
}

export class InventoryStat {
    readonly name: string;
    readonly desc: string;
    readonly value: number;

    constructor(name, desc, value) {
        this.name = name;
        this.desc = desc;
        this.value = value;
    }
}

export class InventorySocket {
    readonly plugs: InventoryPlug[];
    readonly bonusLight: number;

    constructor(plugs: InventoryPlug[], bonusLight: number) {
        this.plugs = plugs;
        this.bonusLight = bonusLight;

    }

}

export class InventoryPlug {
    readonly hash: string;
    readonly name: string;
    readonly desc: string;
    readonly active: boolean;

    constructor(hash: string, name: string, desc: string, active: boolean) {
        this.hash = hash;
        this.name = name;
        this.desc = desc;
        this.active = active;
    }
}

export class Perk {

    readonly hash: string;
    readonly name: string;
    readonly desc: string;
    readonly icon: string;
    readonly active: boolean;
    readonly visible: boolean;

    constructor(hash: string, name: string, desc: string, icon: string, active: boolean, visible: boolean) {
        this.hash = hash;
        this.name = name;
        this.desc = desc;
        this.icon = icon;
        this.active = active;
        this.visible = visible;
    }

}
