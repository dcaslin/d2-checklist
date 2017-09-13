

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
    membership: BungieMembership;
}

export class BungieMembership{
    bungieId: string;
    clanId: string;
    destinyMemberships: UserInfo[];
}

export interface UserInfo {
    membershipType: number;
    membershipId: string;
    platformName: string;
    displayName: string;
    icon: string;
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

    constructor(profile: Profile, characters: Character[], currentActivity: CurrentActivity, milestoneList: MileStoneName[]) {
        this.profile = profile;
        this.characters = characters;
        this.currentActivity = currentActivity;
        this.milestoneList = milestoneList;
    }
}

export interface MileStoneName{
    key: string;
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

    currentActivity: CurrentActivity;
    milestones: { [key: string]: Milestone };
    factions: Progression[];
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


export class Milestone{
    hash: string;
    name: string;
    description: string;
    complete: boolean;
}


export class PGCR {
    period: string;
    //Acitivity Details
    referenceId: number;
    instanceId: string;
    mode: string;
    name: string; //from referenceId
    isPrivate: boolean;
    entries: PGCREntry[];
    level: number;
    //TODO teams    
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


// export class BungieMember{
//     name: string;
//     platforms: BungieMemberPlatform[];
//     constructor(name: string, platforms: BungieMemberPlatform[]){
//         this.name = name;
//         this.platforms = platforms;
//     }
// }

// export class BungieMemberPlatform{
//     name: string;
//     platform: Platform;

//     constructor(name: string, platform: Platform){
//         this.name = name;
//         this.platform = platform;
//     }
// }


export class Progression{
    icon: string;
    name: string;
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


export class Const{
    
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
    