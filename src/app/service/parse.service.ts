
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

        //TODO level progression, if it even makes sense
        return char;


    }

    private static getBasicValue(val: any): number {
        if (val==null) return null;
        if (val.basic==null) return;
        return val.basic.value;
    }

    private parseActivity(a): any {
        let act: Activity = new Activity();

        act.period = a.period;
        act.referenceId = a.activityDetails.referenceId;
        act.instanceId = a.activityDetails.instanceId;
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
        if (a.values){
            act.completed = ParseService.getBasicValue(a.values.completed);
            act.timePlayedSeconds = ParseService.getBasicValue(a.values.timePlayedSeconds);
            act.playerCount = ParseService.getBasicValue(a.values.playerCount);
            act.standing = ParseService.getBasicValue(a.values.standing);
            act.kills = ParseService.getBasicValue(a.values.kills);
            act.deaths = ParseService.getBasicValue(a.values.deaths);
            act.assists = ParseService.getBasicValue(a.values.assists);
            act.score = ParseService.getBasicValue(a.values.score);


        }
        act.isPvP = desc.isPvP;        
        act.isPrivate = a.activityDetails.isPrivate;
        if (act.isPvP){
            act.desc = "PvP "+act.type+": "+act.name;
        }
        else{
            act.desc = "PvE "+act.type+": "+act.name;
        }
        if (act.isPrivate){
            act.desc+="(Private)";
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
        const oChars: any = resp.characters.data;
        let chars: Character[] = [];

        Object.keys(oChars).forEach((key) => {
            chars.push(this.parseCharacter(oChars[key]));
        });
        return new Player(profile, chars);
    }


}


export class Activity {
    period: string;
    type: string;
    name: string;
    desc: string;
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
    mode: number;
    activityTypeHashOverride: number;
    isPrivate: boolean;
    isPvP: boolean;


    constructor() {

    }
}


export class Player {
    profile: Profile;
    characters: Character[];

    constructor(profile: Profile, characters: Character[]) {
        this.profile = profile;
        this.characters = characters;
    }
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

interface UserInfo {
    membershipType: number;
    membershipId: string;
    displayName: string;
}

