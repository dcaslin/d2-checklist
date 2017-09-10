
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
        act.isPrivate = a.activityDetails.isPrivate;
        if (desc.isPvP){
            act.pvType = "PvP";
        }
        else{
            act.pvType = "PvE";
        }

        act.desc = act.mode+": "+act.name;
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

    private parsePGCREntry(e: any): PGCREntry{
        let r:PGCREntry = new PGCREntry();
        r.characterId = e.characterId;
        r.standing = e.standing;
        r.score = ParseService.getBasicValue(e.score);
        if (e.values){

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

    public parseUserInfo(i: any): UserInfo{
        let platformName: string = "";
        if (i.membershipType==1){
            platformName = "XBL";
        }
        else if (i.membershipType==2){
            platformName = "PSN";
        }
        else if (i.membershipType==4){
            platformName = "BNET";
        }
        return {
            'membershipType': i.membershipType,
            'membershipId': i.membershipId,
            'displayName': i.displayName,
            'icon' : i.iconPath,
            'platformName': platformName 
        };

    }

    public parsePGCR(p:any):PGCR{
        let r:PGCR = new PGCR();
        r.period = p.period;
        r.referenceId = p.activityDetails.referenceId;
        r.instanceId = p.activityDetails.instanceId;
        r.mode = ParseService.lookupMode(p.activityDetails.mode);

        let desc: any = this.destinyCacheService.cache.Activity[r.referenceId];
        if (desc){
            r.name = desc.displayProperties.name;
            r.level = desc.activityLevel;
        }
        else{
            r.name = "redacted";
        }

        r.isPrivate = p.activityDetails.isPrivate;
        r.entries = [];
        p.entries.forEach((ent)=>{
            r.entries.push(this.parsePGCREntry(ent));
        });

        let teamList = {};

        r.entries.forEach((ent)=>{
            let list = teamList[ent.fireteamId];
            if (list==null){
                teamList[ent.fireteamId] = [];
                list = teamList[ent.fireteamId];
            } 
            list.push(ent);
        });

        let cntr:number = 0;
        Object.keys(teamList).forEach((key)=>{
            cntr++;

            let list = teamList[key];
            list.forEach((ent)=>{
                ent.fireteam = cntr;
            });
        });
        r.entries.sort(function(a, b) { 
            return b.score-a.score;
        })

        return r;
        
    }

    public static lookupMode(mode:number):string{
        if (mode==0) return "All";
        if (mode==2) return "Story";
        if (mode==3) return "Strike";
        if (mode==5) return "All PvP";
        if (mode==6) return "Patrol";
        if (mode==7) return "All PvE";
        if (mode==10) return "Control";
        if (mode==12) return "Team";
        if (mode==16) return "Nightfall";
        if (mode==17) return "Heroic";
        if (mode==18) return "Strikes";
        if (mode==37) return "Survival";
        if (mode==38) return "Countdown";
        if (mode==40) return "Social";
        return "unknown";
    }


}

export class PGCREntry{
    standing:number;
    score:number;
    values: any;
    user: UserInfo;

    characterId:string;
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

export interface UserInfo {
    membershipType: number;
    membershipId: string;
    platformName: string;
    displayName: string;
    icon: string;
}

