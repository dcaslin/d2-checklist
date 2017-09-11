
import { Injectable } from '@angular/core';
import { DestinyCacheService } from './destiny-cache.service';
@Injectable()
export class ParseService {

    constructor(private destinyCacheService: DestinyCacheService) { }

    private parseCharacter(c: _Character): Character {
        let char: Character = new Character();

        char.membershipId = c.membershipId;
        char.membershipType = c.membershipType;

        char.characterId = c.characterId;
        char.dateLastPlayed = c.dateLastPlayed;
        char.minutesPlayedThisSession = c.minutesPlayedThisSession;
        char.minutesPlayedTotal = c.minutesPlayedTotal;
        char.light = c.light;
        char.emblemBackgroundPath = c.emblemBackgroundPath;
        char.emblemPath = c.emblemPath;
        char.baseCharacterLevel = c.baseCharacterLevel;
        char.percentToNextLevel = c.percentToNextLevel / 100;

        char.gender = this.destinyCacheService.cache.Gender[c.genderHash].displayProperties.name;
        char.race = this.destinyCacheService.cache.Race[c.raceHash].displayProperties.name;
        char.className = this.destinyCacheService.cache.Class[c.classHash].displayProperties.name;
        return char;
    }

    private populateActivities(c: Character, _act: any): void {

        console.dir(_act);
        console.log("act");
        let hash: number = _act.currentActivityHash;

        if (hash != 0) {
            let act: CurrentActivity = new CurrentActivity();
            act.dateActivityStarted = _act.dateActivityStarted;

            let desc: any = this.destinyCacheService.cache.Activity[hash];
            if (desc) {
                act.name = desc.displayProperties.name;
                if (desc.activityTypeHash) {
                    let typeDesc: any = this.destinyCacheService.cache.ActivityType[desc.activityTypeHash];
                    if (typeDesc != null) {
                        act.type = typeDesc.displayProperties.name;
                    }
                }
                act.activityLevel = desc.activityLevel;
                act.activityLightLevel = desc.activityLightLevel;
            }

            //ignore in orbit
            if (act.name != null && act.name.trim().length > 0) {
                c.currentActivity = act;
            }
        }
    }

    private parseProgression(p:_Progression): Progression{
        let desc = this.destinyCacheService.cache.Faction[p.factionHash];
        if (desc != null) {
            console.dir(desc);
            
            let prog:Progression = new Progression();
            prog.icon = desc.displayProperties.icon;
            prog.hash = p.progressionHash;
            prog.name = desc.displayProperties.name;
            prog.currentProgress = p.currentProgress;
            prog.dailyLimit = p.dailyLimit;
            prog.dailyProgress = p.dailyProgress;
            prog.weeklyLimit= p.weeklyLimit;
            prog.weeklyProgress = p.weeklyProgress;
            prog.levelCap = p.levelCap;
            prog.level = p.level;
            prog.percentToNextLevel = p.progressToNextLevel/p.nextLevelAt;
            return prog;
        }
        else{
            return null;
        }
        

    }

    private populateProgressions(c: Character, _prog: any): void {
        console.dir(_prog);
        console.log("prog");
        let parsedMilestones: { [key: string]: Milestone } = {};
        if (_prog.milestones != null) {
            Object.keys(_prog.milestones).forEach((key) => {
                let ms: _Milestone = _prog.milestones[key];
                if (ms.endDate == null) return;
                let desc = this.destinyCacheService.cache.Milestone[ms.milestoneHash];
                if (desc != null) {
                    // if (desc.friendlyName==null) return;
                    let name: string = "";
                    let description: string = "";
                    // if (desc.friendlyName != null) {
                    //     name = desc.friendlyName;
                    // }
                    if (desc.displayProperties != null) {
                        name = desc.displayProperties.name;
                        description = desc.displayProperties.description;
                        console.log(description);
                    }
                    if (ms.availableQuests != null && ms.availableQuests.length == 1 && name != null && name.trim().length > 0) {
                        let q: _AvailableQuest = ms.availableQuests[0];
                        let m: Milestone = new Milestone();
                        m.name = name;
                        m.description = description;
                        m.hash = key;
                        m.complete = q.status.completed;
                        parsedMilestones[key] = m;
                    }
                }

            });
        }
        c.milestones = parsedMilestones;

        let factions: Progression[] = [];
        if (_prog.factions != null) {
            Object.keys(_prog.factions).forEach((key) => {
                let p: _Progression = _prog.factions[key];
                let prog: Progression = this.parseProgression(p);
                if (prog!=null){
                    factions.push(prog);
                }

            });

        }
        factions.sort(function (a, b) {
            return b.percentToNextLevel - a.percentToNextLevel;
        })
        c.factions = factions;

        //factions
        //milestones
        //progressions
        //quests?
        //uninstancedItemObjectives
        //c.progression = saveMe;


        //first let's handle milestones

    }



    private static getBasicValue(val: any): number {
        if (val == null) return null;
        if (val.basic == null) return;
        return val.basic.value;
    }

    private parseActivity(a): any {
        let act: Activity = new Activity();

        act.period = a.period;
        act.referenceId = a.activityDetails.referenceId;
        act.instanceId = a.activityDetails.instanceId;
        act.mode = ParseService.lookupMode(a.activityDetails.mode);
        act.type = "";
        let desc: any = this.destinyCacheService.cache.Activity[act.referenceId];
        if (desc) {
            act.name = desc.displayProperties.name;
            if (desc.activityTypeHash) {
                let typeDesc: any = this.destinyCacheService.cache.ActivityType[desc.activityTypeHash];
                if (typeDesc != null) {
                    act.type = typeDesc.displayProperties.name;
                }
            }
            //TODO activityModeHash let modeDesc: any = this.destinyCacheService.cache.ActivityMode[desc.activityModeHash];
            if (a.activityDetails.activityTypeHashOverride) {
                let typeDesc: any = this.destinyCacheService.cache.ActivityType[a.activityDetails.activityTypeHashOverride];
                if (typeDesc != null) {
                    console.log("Override: " + typeDesc.displayProperties.name);
                    act.type = typeDesc.displayProperties.name;
                }
            }
            act.activityLevel = desc.activityLevel;
            act.activityLightLevel = desc.activityLightLevel;
        }
        if (a.values) {
            act.completed = ParseService.getBasicValue(a.values.completed);
            act.timePlayedSeconds = ParseService.getBasicValue(a.values.timePlayedSeconds);
            act.playerCount = ParseService.getBasicValue(a.values.playerCount);
            act.standing = ParseService.getBasicValue(a.values.standing);
            act.kills = ParseService.getBasicValue(a.values.kills);
            act.deaths = ParseService.getBasicValue(a.values.deaths);
            act.assists = ParseService.getBasicValue(a.values.assists);
            act.score = ParseService.getBasicValue(a.values.score);


        }
        act.isPrivate = a.activityDetails.isPrivate;
        if (desc.isPvP) {
            act.pvType = "PvP";
        }
        else {
            act.pvType = "PvE";
        }

        act.desc = act.mode + ": " + act.name;
        if (act.isPrivate) {
            act.desc += "(Private)";
        }
        //act.values = a.values;
        return act;

    }

    public parseActivities(a: any[]): any[] {
        let returnMe: any[] = [];
        a.forEach((act) => {
            let parsed = this.parseActivity(act);
            if (parsed != null)
                returnMe.push(parsed);
        })
        return returnMe;
    }

    public parsePlayer(resp: any): Player {
        if (resp.profile.privacy == 2) throw new Error("Privacy settings disable viewing this player's profile.");
        if (resp.characters.privacy == 2) throw new Error("Privacy settings disable viewing this player's characters.");
        const profile: Profile = resp.profile.data;

        let charsDict: any = {};


        const oChars: any = resp.characters.data;
        Object.keys(oChars).forEach((key) => {
            charsDict[key] = this.parseCharacter(oChars[key]);
        });

        let mileStoneHashSet: any = {};

        if (resp.characterProgressions && resp.characterProgressions.data) {
            const oProgs: any = resp.characterProgressions.data;
            Object.keys(oProgs).forEach((key) => {
                let curChar: Character = charsDict[key];
                this.populateProgressions(curChar, oProgs[key]);
                if (curChar.milestones != null) {
                    Object.keys(curChar.milestones).forEach(key2 => {

                        mileStoneHashSet[key2] = curChar.milestones[key2];
                    });
                }
            });
        }

        let milestoneList: MileStoneName[] = [];

        Object.keys(mileStoneHashSet).forEach(key => {
            milestoneList.push({
                key: key,
                name: mileStoneHashSet[key].name,
                desc: mileStoneHashSet[key].description
            });
        });

        let currentActivity: CurrentActivity = null;

        if (resp.characterActivities && resp.characterActivities.data) {
            const oActs: any = resp.characterActivities.data;
            Object.keys(oActs).forEach((key) => {
                let curChar: Character = charsDict[key];
                this.populateActivities(curChar, oActs[key]);
                if (curChar.currentActivity != null) {
                    currentActivity = curChar.currentActivity;
                }
            });
        }


        // //progressions
        // if ()

        let chars: Character[] = [];
        Object.keys(charsDict).forEach((key) => {
            chars.push(charsDict[key]);
        });



        return new Player(profile, chars, currentActivity, milestoneList);
    }

    private parsePGCREntry(e: any): PGCREntry {
        let r: PGCREntry = new PGCREntry();
        r.characterId = e.characterId;
        r.standing = e.standing;
        r.score = ParseService.getBasicValue(e.score);
        if (e.values) {

            r.kills = ParseService.getBasicValue(e.values.kills);
            r.deaths = ParseService.getBasicValue(e.values.deaths);
            r.assists = ParseService.getBasicValue(e.values.assists);
            r.fireteamId = ParseService.getBasicValue(e.values.fireteamId);
        }
        r.characterClass = e.player.characterClass;
        r.characterLevel = e.player.characterLevel;
        r.lightLevel = e.player.lightLevel;
        if (!r.fireteamId) r.fireteamId = -1;
        if (!r.score) r.score = 0;

        r.user = this.parseUserInfo(e.player.destinyUserInfo);
        return r;
    }

    public parseUserInfo(i: any): UserInfo {
        let platformName: string = "";
        if (i.membershipType == 1) {
            platformName = "XBL";
        }
        else if (i.membershipType == 2) {
            platformName = "PSN";
        }
        else if (i.membershipType == 4) {
            platformName = "BNET";
        }
        return {
            'membershipType': i.membershipType,
            'membershipId': i.membershipId,
            'displayName': i.displayName,
            'icon': i.iconPath,
            'platformName': platformName
        };

    }

    public parsePGCR(p: any): PGCR {
        let r: PGCR = new PGCR();
        r.period = p.period;
        r.referenceId = p.activityDetails.referenceId;
        r.instanceId = p.activityDetails.instanceId;
        r.mode = ParseService.lookupMode(p.activityDetails.mode);

        let desc: any = this.destinyCacheService.cache.Activity[r.referenceId];
        if (desc) {
            r.name = desc.displayProperties.name;
            r.level = desc.activityLevel;
        }
        else {
            r.name = "redacted";
        }

        r.isPrivate = p.activityDetails.isPrivate;
        r.entries = [];
        p.entries.forEach((ent) => {
            r.entries.push(this.parsePGCREntry(ent));
        });

        let teamList = {};

        r.entries.forEach((ent) => {
            let list = teamList[ent.fireteamId];
            if (list == null) {
                teamList[ent.fireteamId] = [];
                list = teamList[ent.fireteamId];
            }
            list.push(ent);
        });

        let cntr: number = 0;
        Object.keys(teamList).forEach((key) => {
            cntr++;

            let list = teamList[key];
            list.forEach((ent) => {
                ent.fireteam = cntr;
            });
        });
        r.entries.sort(function (a, b) {
            return b.score - a.score;
        })

        return r;

    }

    public static lookupMode(mode: number): string {
        if (mode == 0) return "All";
        if (mode == 2) return "Story";
        if (mode == 3) return "Strike";
        if (mode == 5) return "All PvP";
        if (mode == 6) return "Patrol";
        if (mode == 7) return "All PvE";
        if (mode == 10) return "Control";
        if (mode == 12) return "Team";
        if (mode == 16) return "Nightfall";
        if (mode == 17) return "Heroic";
        if (mode == 18) return "Strikes";
        if (mode == 37) return "Survival";
        if (mode == 38) return "Countdown";
        if (mode == 40) return "Social";
        return "unknown";
    }


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


    constructor() {

    }
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

export interface MileStoneName {
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
    progression: any;
}

class Milestone {
    hash: string;
    name: string;
    description: string;
    complete: boolean;
}

interface _Character {
    membershipId: string;
    membershipType: number;
    characterId: string;
    dateLastPlayed: string;
    minutesPlayedThisSession: string;
    minutesPlayedTotal: string;
    light: number;

    stats: any;
    raceHash: number;
    genderHash: number;
    classHash: number;
    raceType: number;
    classType: number;
    genderType: number;
    emblemPath: string;
    emblemBackgroundPath: string;
    emblemHash: number;
    levelProgression: LevelProgression;
    baseCharacterLevel: number;
    percentToNextLevel: number;
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


interface Profile {
    userInfo: UserInfo;
    dateLastPlayed: string;
    versionsOwned: number;
    characterIds: string[];
}

export interface UserInfo {
    membershipType: number;
    membershipId: string;
    platformName: string;
    displayName: string;
    icon: string;
}

export interface _Milestone {
    milestoneHash: number;
    availableQuests: _AvailableQuest[];
    startDate: string;
    endDate: string;
}

interface _AvailableQuest {
    questItemHash: number;
    status: _QuestStatus;
}


interface _QuestStatus {
    questHash: number;
    stepHash: number;
    stepObjectives: any[];
    tracked: boolean;
    itemInstanceId: string;
    completed: boolean;
    redeemed: boolean;
    started: boolean;
}

interface _Progression {
    factionHash: number;
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

class Progression{
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