

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
    selectedUser: UserInfo;
    selectedUserCurrencies: Currency[];
    membership: BungieMembership;
}

export class BungieMembership {
    bungieId: string;
    clanId: string;
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
}

export class LeaderBoardList{
    name: string;
    entries: LeaderboardEntry[];

    constructor(name:string, entries: LeaderboardEntry[]){
        this.name = name;
        this.entries = entries;
    }
}

export class LeaderboardEntry{
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


export class Player {
    profile: Profile;
    currentActivity: CurrentActivity;
    characters: Character[];
    milestoneList: MileStoneName[];
    currencies: Currency[];

    constructor(profile: Profile, characters: Character[], currentActivity: CurrentActivity, milestoneList: MileStoneName[], currencies: Currency[]) {
        this.profile = profile;
        this.characters = characters;
        this.currentActivity = currentActivity;
        this.milestoneList = milestoneList;
        this.currencies = currencies;
    }
}

export class Currency{
    name: string;
    icon: string;
    count: number;

    constructor(name: string, icon:string, count: number){
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

    constructor(hash, complete, pct, info){
        this.hash = hash;
        this.complete = complete;
        this.pct = pct;
        this.info = info;
    }
}

export interface MileStoneName {
    key: string;
    type: string;
    name: string;
    desc: string;
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
    percentToNextLevel: number;
    race: string;
    gender: string;
    className: string;
    levelProgression: LevelProgression;
    legendProgression: Progression;
    currentActivity: CurrentActivity;
    milestones: { [key: string]: MilestoneStatus };
    clanMilestones: ClanMilestoneResults;
    factions: Progression[];
    //progressions: Progression[];
    stats: CharacterStat[];
    startWeek: Date;
    endWeek: Date;
    lifetimeRaid: number = 0;
    
}

export class Challenge{
    name: string;
    desc: string;

    constructor(name: string, desc: string){
        this.name = name;
        this.desc = desc;
    }
}

export class CharacterStat{
    name: string;
    desc: string;
    value: number;

    constructor(name, desc, value){
        this.name = name;
        this.desc = desc;
        this.value = value;
    }
}

export class ClanMilestoneResults{
    nightfall: boolean;
    raid: boolean;
    crucible: boolean;
    trials: boolean;
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
    //Acitivity Details
    referenceId: number;
    instanceId: string;
    mode: string;
    name: string; //from referenceId
    isPrivate: boolean;
    entries: PGCREntry[];
    level: number;
    //teams?
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
    assists: number;
    score: number;

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

    characterId: string;
    characterClass: string;
    characterLevel: number;
    lightLevel: number;

    kills: number;
    deaths: number;
    assists: number;
    fireteamId: number;
    fireteam: string;

    startSeconds: number;
    activityDurationSeconds: number;
    timePlayedSeconds: number;

    weapons: PGCRWeaponData[];

}

export class PGCRWeaponData{
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

    constructor(type: number, name: string, desc: string) {
        this.type = type;
        this.name = name;
        this.desc = desc;
    }
}


export class BungieMember {
    name: string;
    id: string;
    noClan: boolean = false;
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
    defunct: boolean = false;

    constructor(name: string, platform: Platform) {
        this.name = name;
        this.platform = platform;
    }
}

export class ClanInfo{
    
    groupId: string;
    name: string;
    creationDate: string;
    memberCount: number;
    avatarPath: string;
    bannerPath: string;
    progressions: Progression[];
}

export class Progression {
    icon: string;
    name: string;
    info: string;
    desc: string;
    hash: number;
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

    public static XBL_PLATFORM = new Platform(1, "XBL", "Xbox");
    public static PSN_PLATFORM = new Platform(2, "PSN", "Playstation");
    public static BNET_PLATFORM = new Platform(4, "BNET", "Battle.net");

    public static PLATFORMS_ARRAY = [
        Const.XBL_PLATFORM, Const.PSN_PLATFORM, Const.BNET_PLATFORM
    ];

    public static PLATFORMS_DICT = {
        "1": Const.XBL_PLATFORM,
        "2": Const.PSN_PLATFORM,
        "4": Const.BNET_PLATFORM
    }

}
