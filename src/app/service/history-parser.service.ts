import { Injectable } from '@angular/core';
import { DestinyCacheService } from './destiny-cache.service';
import { AggHistoryEntry, Character } from './model';
import { dedupeArray, getBasicValue } from './parse-utils';

@Injectable({ providedIn: 'root' })
export class HistoryParserService {

    constructor(private destinyCacheService: DestinyCacheService) {
    }

    public static mergeAggHistory2(charAggHistDicts: { [key: string]: AggHistoryEntry }[]): AggHistoryEntry[] {
        const returnMe: AggHistoryEntry[] = [];
        let aKeys: string[] = [];
        for (const c of charAggHistDicts) {
            if (c != null) {
                aKeys = aKeys.concat(Object.keys(c));
            }
        }
        aKeys = dedupeArray(aKeys);

        const nfHashes: string[] = [];
        const nfDict: Record<string, any> = {};

        for (const key of aKeys) {
            let model: AggHistoryEntry | null = null;
            for (const c of charAggHistDicts) {
                if (c == null) {
                    continue;
                }
                if (c[key] == null) {
                    continue;
                } if (model == null) {
                    model = c[key];
                } else {
                    model = HistoryParserService.mergeAggHistoryEntry(model, c[key]);
                }
            }
            if (model != null) {
                if (model.type == 'nf') {
                    const match = nfHashes.filter(x => model!.hash.includes(x));
                    for (const m of match) {
                        nfDict[m].found = true;
                    }
                    model.special = match.length > 0;

                }
                const nfPrefix = 'Nightfall: ';
                if (model.name.startsWith(nfPrefix)) {
                    model.name = model.name.substring(nfPrefix.length);
                }
                if (model.special) {
                    model.name = '* ' + model.name;
                }
                if (model.name.startsWith('QUEST')) {
                    continue;
                }
                if (model.activityDeaths == 0) {
                    model.kd = model.activityKills;
                } else {
                    model.kd = model.activityKills / model.activityDeaths;
                }
                model.hash = dedupeArray(model.hash);
                model.hash.sort((a, b) => {
                    if (b > a) { return 1; } else if (b < a) { return -1; } else { return 0; }
                });
                returnMe.push(model);
            }
        }
        for (const hash of Object.keys(nfDict)) {
            const val = nfDict[hash];
            // this NF is missing, add it
            if (!val.found) {
                const addMe = {
                    name: '* ' + val.mission.name,
                    type: 'nf',
                    special: true,
                    hash: [hash],
                    activityBestSingleGameScore: null as any,
                    fastestCompletionMsForActivity: null as any,
                    activityCompletions: 0,
                    charCompletions: [] as any[],
                    activityKills: null as any,
                    activityAssists: null as any,
                    activityDeaths: null as any,
                    activityPrecisionKills: null as any,
                    activitySecondsPlayed: null as any,
                    activityLightLevel: null as any,
                    efficiency: null as any
                };
                returnMe.push(addMe);

            }
        }
        returnMe.sort((a, b) => {
            if (b.activityLightLevel > a.activityLightLevel) {
                return 1;
            } else if (b.activityLightLevel < a.activityLightLevel) {
                return -1;
            } else {
                if (a.name > b.name) {
                    return 1;
                } else if (a.name < b.name) {
                    return -1;
                }
                return 0;
            }
        });
        return returnMe;

    }

    public async parseAggHistory2(char: Character, resp: any): Promise<{ [key: string]: AggHistoryEntry }> {
        if (resp.activities == null) {
            return {};
        }

        const dict: { [key: string]: AggHistoryEntry } = {};
        for (const a of resp.activities) {
            if (!a.activityHash) { continue; }
            const vDesc: any = await this.destinyCacheService.getActivity(a.activityHash);
            if (vDesc == null || (vDesc.activityModeHashes == null) && vDesc.activityTypeHash == null) { continue; }
            let name = vDesc.displayProperties.name;
            if (name == null) {
                continue;
            }

            const nf = HistoryParserService.isActivityType(vDesc, 547513715) && vDesc.tier >= 2;
            const raid = HistoryParserService.isActivityType(vDesc, 2043403989);
            if (nf || raid) {
                if (nf) {
                    if (name.includes('The Ordeal') && !name.endsWith(vDesc.displayProperties.description)) {
                        name = name + ': ' + vDesc.displayProperties.description;
                    }
                }
                const entry = this.parseAggHistoryEntry(char, name, a, nf ? 'nf' : 'raid', vDesc);
                if (dict[name] == null) {
                    dict[name] = entry;
                } else {
                    dict[name] = HistoryParserService.mergeAggHistoryEntry(dict[name], entry);
                }
            }
        }
        return dict;
    }

    private static isActivityType(vDesc: any, typeHash: number): boolean {
        if (vDesc.activityTypeHash == typeHash) {
            return true;
        }
        if (vDesc.activityModeHashes != null && vDesc.activityModeHashes.indexOf(typeHash) >= 0) {
            return true;
        }
        return false;
    }

    private static setEfficiency(x: AggHistoryEntry) {
        if (x.activitySecondsPlayed > 0) {
            x.efficiency = x.activityCompletions / (x.activitySecondsPlayed / (60 * 60));
        } else {
            x.efficiency = 0;
        }
    }

    private static mergeAggHistoryEntry(a: AggHistoryEntry, b: AggHistoryEntry): AggHistoryEntry {
        if (b == null) { return a; }
        let fastest: number | null = null;
        if (a.fastestCompletionMsForActivity && b.fastestCompletionMsForActivity) {
            fastest = Math.min(a.fastestCompletionMsForActivity, b.fastestCompletionMsForActivity);
        } else if (a.fastestCompletionMsForActivity) {
            fastest = a.fastestCompletionMsForActivity;
        }
        const timePlayed = a.activitySecondsPlayed + b.activitySecondsPlayed;
        const charCompDict: Record<string, any> = {};
        for (const c of a.charCompletions.concat(b.charCompletions)) {
            if (!charCompDict[c.char.id]) {
                charCompDict[c.char.id] = c;
            } else {
                charCompDict[c.char.id].count += c.count;
            }
        }
        const charCompletions = [];
        for (const k of Object.keys(charCompDict)) {
            charCompletions.push(charCompDict[k]);
        }
        const returnMe: AggHistoryEntry = {
            name: a.name,
            type: a.type,
            hash: a.hash.concat(b.hash),
            activityBestSingleGameScore: Math.max(a.activityBestSingleGameScore, b.activityBestSingleGameScore),
            fastestCompletionMsForActivity: fastest!,
            activityCompletions: a.activityCompletions + b.activityCompletions,
            charCompletions: charCompletions,
            activityKills: a.activityKills + b.activityKills,
            activityAssists: a.activityAssists + b.activityAssists,
            activityDeaths: a.activityDeaths + b.activityDeaths,
            activityPrecisionKills: a.activityPrecisionKills + b.activityPrecisionKills,
            activitySecondsPlayed: timePlayed,
            activityLightLevel: Math.max(a.activityLightLevel, b.activityLightLevel),
            efficiency: 0
        };
        HistoryParserService.setEfficiency(returnMe);
        return returnMe;
    }

    private parseAggHistoryEntry(char: Character, name: string, a: any, type: string, vDesc: any): AggHistoryEntry {
        let fastest = getBasicValue(a.values.fastestCompletionMsForActivity);
        if (fastest == 0) {
            fastest = null!;
        }
        const total = getBasicValue(a.values.activityCompletions);

        const returnMe: AggHistoryEntry = {
            name: name,
            type,
            hash: [a.activityHash],
            activityBestSingleGameScore: getBasicValue(a.values.activityBestSingleGameScore),
            fastestCompletionMsForActivity: fastest,
            activityCompletions: total,
            charCompletions: [{
                char: char,
                count: total
            }],
            activityKills: getBasicValue(a.values.activityKills),
            activityAssists: getBasicValue(a.values.activityAssists),
            activityDeaths: getBasicValue(a.values.activityDeaths),

            activityPrecisionKills: getBasicValue(a.values.activityPrecisionKills),
            activitySecondsPlayed: getBasicValue(a.values.activitySecondsPlayed),
            activityLightLevel: vDesc.activityLightLevel,
            efficiency: 0
        };
        HistoryParserService.setEfficiency(returnMe);
        return returnMe;
    }
}
