import { DynamicStrings, Fraction, Progression } from './model';

export const INTERPOLATION_PATTERN = /\{var:\d+\}/g;

export function dedupeArray(arr: any[]): any[] {
    const unique_array = Array.from(new Set(arr));
    return unique_array;
}

export function decimalToFraction(value: number): Fraction {
    if (value === parseInt(value.toString(), 10)) {
        return null!;
    } else {
        let top = value.toString().includes('.') ? +(value.toString().replace(/\d+[.]/, '')) : 0;
        const wholeNumber = Math.floor(value);
        const decimal = value - wholeNumber;
        const bottom = Math.pow(10, top.toString().replace('-', '').length);
        if (decimal >= 1) {
            top = +top + (Math.floor(decimal) * bottom);
        } else if (decimal <= -1) {
            top = +top + (Math.ceil(decimal) * bottom);
        }
        const x = Math.abs(greatestCommonDenominator(top, bottom));
        return {
            top: top / x,
            bottom: bottom / x
        };
    }
}

export function greatestCommonDenominator(a: number, b: number): number {
    return (b) ? greatestCommonDenominator(b, a % b) : a;
}

export function getBasicValue(val: any): number {
    if (val == null) { return null!; }
    if (val.basic == null) { return null!; }
    return val.basic.value;
}

export function getBasicDisplayValue(val: any): string {
    if (val == null) { return null!; }
    if (val.basic == null) { return null!; }
    return val.basic.displayValue;
}

export function camelKebab(prefix: string, s: string): string {
    if (prefix != null) {
        s = s.replace(prefix, '');
    }
    s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildDynamicStrings(resp: any): DynamicStrings {
    const returnMe: DynamicStrings = {
        character: {},
        profile: {}
    };
    if (resp.profileStringVariables?.data?.integerValuesByHash) {
        returnMe.profile = resp.profileStringVariables.data.integerValuesByHash;
    }
    if (resp.characterStringVariables?.data) {
        for (const key of Object.keys(resp.characterStringVariables.data)) {
            returnMe.character[key] = resp.characterStringVariables.data[key].integerValuesByHash;
        }
    }
    return returnMe;

}
export function dynamicStringReplace(text: string, characterId: string, dynamicStrings: DynamicStrings): string {
    // Thanks DIM!
    return text.replace(INTERPOLATION_PATTERN, (segment) => {
        const hash = segment.match(/\d+/)![0];
        const dynamicValue =
          dynamicStrings?.character[characterId]?.[hash] ?? dynamicStrings?.profile[hash];
        return dynamicValue?.toString() ?? segment;
      });
}

export function dynamicStringClear(text: string): string {
    return text.replace(INTERPOLATION_PATTERN, (segment) => {
        return '';
      });
}

// Crucible and glory have progressions working together
export function parseProgression(p: PrivProgression, desc: any, suppProg?: PrivProgression): Progression {
    // TODO use profileInfo.profileProgression?.data?.seasonalArtifact.powerBonusProgression.progressionHash for this
    if (desc != null) {
        const prog: Progression = new Progression();
        prog.icon = desc.displayProperties.icon;
        prog.hash = p.progressionHash + '';
        let name = desc.displayProperties.name;
        let info = '';
        if (name === 'Exodus Black AI') {
            name = 'Failsafe';
            info = 'Nessus';
        } else if (name === 'Dead Zone Scout') {
            name = 'Devrim';
            info = 'EDZ';
        } else if (name === 'Vanguard Operations') {
            name = 'War Table';
            info = 'Vanguard Operations';
        } else if (name === 'Vanguard Tactical') {
            name = 'Zavala';
            info = 'Vanguard Tactical';
        } else if (name === 'The Crucible') {
            name = 'Crucible';
            info = 'Shaxx';
        } else if (name === 'Gunsmith') {
            info = 'Banshee';
        } else if (name === 'AI Research Assistant') {
            info = 'AI Research Assistant';
            name = 'Failsafe';

        } else if (name === 'Cryptarchs') {
            info = 'Rahool';
        } else if (name === 'Conscientious Objector')  {
            name = 'Fynch';
            info = 'Conscientious Objector';
        } else if (name === 'Purveyor of Strange Goods')  {
            name = 'Xur';
            info = 'Purveyor of Strange Goods';
        } else if (name === 'Strange Favor')  {
            name = 'Xur';
            info = 'Strange Favor';
        } else if (name === 'Hero of Six Fronts')  {
            name = 'Saint-14';
            info = 'Trials';
        } else if (name === 'Hero of Six Fronts')  {
            name = 'The Drifter';
            info = 'Gambit';
        } else if (name === 'Classified') {
            return null!;
        }

        // fix names on clan progressions
        if (p.progressionHash === 3759191272) { name = 'Guided Trials'; }
        if (p.progressionHash === 1273404180) { name = 'Guided Nightfall'; }
        if (p.progressionHash === 3381682691) { name = 'Guided Raid'; }


        prog.name = name;
        if ('Resonance Rank' == prog.name) {
            return null!;
        }
        prog.info = info;
        prog.desc = desc.displayProperties.description;
        prog.currentProgress = p.currentProgress;
        prog.dailyLimit = p.dailyLimit;
        prog.dailyProgress = p.dailyProgress;
        prog.weeklyLimit = p.weeklyLimit;
        prog.weeklyProgress = p.weeklyProgress;
        prog.levelCap = p.levelCap;
        prog.level = p.level;
        prog.nextLevelAt = p.nextLevelAt;
        prog.progressToNextLevel = p.progressToNextLevel;

        if (desc.steps != null && desc.steps.length > 1) {
            if (desc.steps[0].stepName != null && desc.steps[0].stepName.length > 0) {
                prog.steps = [];
                let total = 0;
                for (const s of desc.steps) {
                    total += s.progressTotal;
                    const as = s.stepName.split(' ');
                    let stepName = as[0].charAt(0) + as[0].slice(1).toLowerCase();
                    if (as.length > 1) {
                        stepName += ' ' + as[1];
                    }

                    prog.steps.push({
                        stepName,
                        progressTotal: s.progressTotal,
                        cumulativeTotal: total
                    });
                }
                prog.totalProgress = total;
                if (prog.level >= prog.steps.length) {
                    prog.title = 'Max';
                } else {
                    prog.title = prog.steps[prog.level].stepName;
                }

                if (prog.level + 1 >= prog.steps.length) {
                    prog.nextTitle = 'Max';
                } else {
                    prog.nextTitle = prog.steps[prog.level + 1].stepName;
                }
            }

        }

        if (p.nextLevelAt > 0) {
            prog.percentToNextLevel = p.progressToNextLevel / p.nextLevelAt;
        } else {
            prog.percentToNextLevel = 1;
        }
        if (suppProg != null) {
            if (prog.dailyProgress == 0) {
                prog.dailyProgress = suppProg.dailyProgress;
            }
            if (prog.weeklyProgress == 0) {
                prog.weeklyProgress = suppProg.weeklyProgress;
            }
            prog.currentResetCount = suppProg.currentResetCount!;
        }
        return prog;
    } else {
        return null!;
    }
}

export function cookAccountProgression(prog: Progression) {
    prog.completeProgress = prog.currentProgress;
    if (!prog.steps || prog.steps.length === 0) {
        return;
    }
    // find max reset in steps
    const maxLevel = prog.steps[prog.steps.length - 1].cumulativeTotal;
    if (prog.currentResetCount! > 0) {
        prog.completeProgress = prog.currentResetCount! * maxLevel + prog.currentProgress;
    }
}

// Re-export the PrivProgression interface for use in parse.service.ts
export interface PrivProgression {
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
    currentResetCount?: number;
    seasonResets?: SeasonResets[];
}

interface SeasonResets {
    season: number;
    resets: number;
}

export interface PrivInventoryItem {
    itemHash: number;
    itemInstanceId: string;
    quantity: number;
    overrideStyleItemHash: number;
    bindStatus: number;
    location: number;
    bucketHash: number;
    transferStatus: number; // 0 can transfer, 1 equipped, 2 not transferrable, 4 no room in dest
    lockable: boolean;
    state: number;
    expirationDate: string;
    versionNumber?: number;
}

export interface PrivItemEnergy {
    energyCapacity: number;
    energyUnused: number;
    energyUsed: number;
}
