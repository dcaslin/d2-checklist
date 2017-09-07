
import { Injectable } from '@angular/core';
import { DestinyCacheService } from './destiny-cache.service';
@Injectable()
export class ParseService {

    constructor(private destinyCacheService: DestinyCacheService) { }

    private parseCharacter(c: _Character): Character{
        let char: Character = new Character();
        char.characterId = c.characterId;
        char.dateLastPlayed = c.dateLastPlayed;
        char.minutesPlayedThisSession = c.minutesPlayedThisSession;
        char.minutesPlayedTotal = c.minutesPlayedTotal;
        char.light = c.light;
        char.emblemBackgroundPath = c.emblemBackgroundPath;
        char.emblemPath = c.emblemPath;
        char.baseCharacterLevel = c.baseCharacterLevel;
        char.percentToNextLevel = c.percentToNextLevel/100;

        char.gender = this.destinyCacheService.cache.Gender[c.genderHash].displayProperties.name;
        char.race = this.destinyCacheService.cache.Race[c.raceHash].displayProperties.name;
        char.className = this.destinyCacheService.cache.Class[c.classHash].displayProperties.name;

        //TODO level progression, if it even makes sense
        return char;


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

export class Player {
    profile: Profile;
    characters: Character[];

    constructor(profile: Profile, characters: Character[]) {
        this.profile = profile;
        this.characters = characters;
    }
}

export class Character {
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

