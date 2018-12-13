
import { Injectable } from '@angular/core';
import { DestinyCacheService } from './destiny-cache.service';

import { LowLineService } from './lowline.service';
import {
    Character, CurrentActivity, Progression, Activity,
    Profile, Player, MilestoneStatus, MileStoneName, PGCR, PGCREntry, UserInfo, LevelProgression,
    Const, BungieMembership, BungieMember, BungieMemberPlatform,
    BungieGroupMember, ClanInfo, PGCRWeaponData, ClanMilestoneResult,
    CharacterStat, Currency, LeaderboardEntry, LeaderBoardList, PGCRTeam, NameDesc,
    InventoryItem, ItemType, DamageType, Perk, InventoryStat, InventorySocket, Rankup, AggHistory,
    Checklist, ChecklistItem, CharChecklist, CharChecklistItem, ItemObjective, PrivMilestoneActivity,
    PrivLoadoutRequirement, PrivPublicMilestone, PublicMilestone, MilestoneActivity, MilestoneChallenge,
    LoadoutRequirement, Vendor, SaleItem, TriumphCollectibleNode, TriumphRecordNode, TriumphPresentationNode
} from './model';
@Injectable()
export class ParseService {
    MAX_LEVEL = 50;

    constructor(private destinyCacheService: DestinyCacheService, private lowlineService: LowLineService) {
        this.lowlineService.init();
    }

    private parseCharacter(c: PrivCharacter): Character {
        const char: Character = new Character();

        char.membershipId = c.membershipId;
        char.membershipType = c.membershipType;

        char.characterId = c.characterId;
        char.dateLastPlayed = c.dateLastPlayed;
        char.minutesPlayedThisSession = c.minutesPlayedThisSession;
        char.minutesPlayedTotal = c.minutesPlayedTotal;

        char.light = c.light;
        char.emblemBackgroundPath = c.emblemBackgroundPath;
        char.emblemPath = c.emblemPath;
        char.levelProgression = c.levelProgression;
        char.baseCharacterLevel = c.baseCharacterLevel;
        char.percentToNextLevel = c.percentToNextLevel / 100;

        char.gender = this.destinyCacheService.cache.Gender[c.genderHash].displayProperties.name;
        char.race = this.destinyCacheService.cache.Race[c.raceHash].displayProperties.name;
        char.className = this.destinyCacheService.cache.Class[c.classHash].displayProperties.name;
        char.classType = c.classType;
        char.stats = [];
        Object.keys(c.stats).forEach(key => {
            const val: number = c.stats[key];
            const desc: any = this.destinyCacheService.cache.Stat[key];
            const name = desc.displayProperties.name;
            const sDesc = desc.displayProperties.description;
            char.stats.push(new CharacterStat(name, sDesc, val));
        });
        return char;
    }

    public parseLeaderBoard(resp: any): LeaderBoardList[] {
        // should only be one value
        let mainKey: any = null;
        Object.keys(resp).forEach(key => {
            mainKey = resp[key];
        });
        const returnMe: LeaderBoardList[] = [];
        if (mainKey != null) {
            Object.keys(mainKey).forEach(key => {
                let title: string = key.substring(2);
                title = title.replace(/([A-Z])/g, ' $1');
                const entries: LeaderboardEntry[] = [];
                mainKey[key].entries.forEach(x => {
                    const l: LeaderboardEntry = new LeaderboardEntry();
                    l.characterClass = x.player.characterClass;
                    l.light = x.player.lightLevel;
                    l.characterId = x.characterId;
                    l.destinyUserInfo = x.player.destinyUserInfo;
                    l.rank = x.rank;
                    l.value = x.value.basic.value;
                    entries.push(l);
                });
                returnMe.push(new LeaderBoardList(title, entries));
            });
        }
        return returnMe;
    }

    private populateActivities(c: Character, _act: any): void {
        const hash: number = _act.currentActivityHash;

        if (hash !== 0) {
            const act: CurrentActivity = new CurrentActivity();
            act.dateActivityStarted = _act.dateActivityStarted;

            const desc: any = this.destinyCacheService.cache.Activity[hash];
            if (desc) {
                act.name = desc.displayProperties.name;
                if (desc.activityTypeHash) {
                    const typeDesc: any = this.destinyCacheService.cache.ActivityType[desc.activityTypeHash];
                    if (typeDesc != null) {
                        act.type = typeDesc.displayProperties.name;
                    }
                }
                act.activityLevel = desc.activityLevel;
                act.activityLightLevel = desc.activityLightLevel;
            }

            // ignore in orbit
            if (act.name != null && act.name.trim().length > 0) {
                c.currentActivity = act;
            }
        }
    }
    // factionHash
    private parseProgression(p: PrivProgression, desc: any): Progression {
        if (desc != null) {

            const prog: Progression = new Progression();
            prog.icon = desc.displayProperties.icon;
            prog.hash = p.progressionHash;
            let name = desc.displayProperties.name;
            let info = '';
            if (name === 'Exodus Black AI') {
                name = 'Failsafe';
                info = 'Nessus';
            } else if (name === 'Dead Zone Scout') {
                name = 'Devrim';
                 info = 'EDZ';
            } else if (name === 'Vanguard Tactical') {
                name = 'Zavala';
                 info = 'Strikes';
            } else if (name === 'Vanguard Research') {
                name = 'Ikora';
                 info = 'Research';
            } else if (name === 'Fragmented Researcher') {
                name = 'Asher';
                info = 'IO';
            } else if (name === 'Field Commander') {
                name = 'Sloane';
                 info = 'Titan';
            } else if (name === 'The Crucible') {
                name = 'Crucible';
                info = 'Shaxx';
            } else if (name === 'Gunsmith') {
                name = 'Gunsmith';
                info = 'Banshee';
            } else if (name === 'Classified') {
                return null;
            }

            // fix names on clan progressions
            if (p.progressionHash === 3759191272) { name = 'Guided Trials'; }
            if (p.progressionHash === 1273404180) { name = 'Guided Nightfall'; }
            if (p.progressionHash === 3381682691) { name = 'Guided Raid'; }
            prog.name = name;
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

            const progNeeded = p.nextLevelAt - p.progressToNextLevel;
            prog.percentToNextLevel = p.progressToNextLevel / p.nextLevelAt;
            return prog;
        } else {
            return null;
        }
    }

    private static parseMilestoneType(t: number): string {
        // ?, tutorial and one-time
        if (t === 0 || t === 1 || t === 2) { return null; }
        // if (t == 1) return "tut";
        // if (t == 2) return "1-off";
        if (t === 3) { return 'Weekly'; }
        if (t === 4) { return 'Daily'; }
        if (t === 5) { return 'Special'; }
        return 'Unknown: ' + t;
    }

    private populateProgressions(c: Character, _prog: any, milestonesByKey: any): void {
        c.milestones = {};
        if (_prog.milestones != null) {
            Object.keys(_prog.milestones).forEach((key) => {

                const ms: PrivMilestone = _prog.milestones[key];
                // ignore milestones we're not reporting
                if (key === '4253138191') {

                    const desc = this.destinyCacheService.cache.Milestone[ms.milestoneHash];

                    // grab weekly reset from this
                    c.startWeek = new Date(ms.startDate);
                    c.endWeek = new Date(ms.endDate);

                    const clanMilestones: ClanMilestoneResult[] = [];
                    ms.rewards.forEach(r => {
                        // last week, for testing
                        // if (r.rewardCategoryHash == 4258746474) {
                        // this week
                        if (r.rewardCategoryHash === 1064137897) {
                            const rewEntryDescs = desc.rewards[r.rewardCategoryHash].rewardEntries;

                            r.entries.forEach(rewEnt => {

                                const rewEntKey = rewEnt.rewardEntryHash;
                                const name = rewEntryDescs[rewEntKey].displayProperties.name;

                                const earned: boolean = rewEnt.earned;
                                const redeemed: boolean = rewEnt.redeemed;
                                clanMilestones.push({
                                    name: name,
                                    earned: earned,
                                    redeemed: redeemed
                                });

                                // if (rewEntKey == 3789021730) {
                                //     clanMilestones.nightfall = earned;

                                // }
                                // else if (rewEntKey == 2112637710) {
                                //     clanMilestones.trials = earned;

                                // }
                                // else if (rewEntKey == 2043403989) {
                                //     clanMilestones.raid = earned;
                                // }
                                // else if (rewEntKey == 964120289) {
                                //     clanMilestones.crucible = earned;
                                // }
                                // else{
                                //     console.log("--- "+rewEntKey);
                                // }
                            });
                        }
                    });

                    c.clanMilestones = clanMilestones;
                    return;
                } else if (milestonesByKey[key] == null) {
                    return;
                }


                // clan rewards special case

                let total = 0;
                let complete = 0;
                let info: string = null;
                let suppInfo: string = null;
                let oPct = 0;
                if (ms.availableQuests != null) {

                    ms.availableQuests.forEach((q: PrivAvailableQuest) => {
                        total++;

                        if (key === '466653501') {
                            if (q.status.stepHash != null && q.status.stepHash > 0) {

                                const sDesc = this.destinyCacheService.cache.InventoryItem[q.status.stepHash];
                                if (sDesc != null) {
                                    suppInfo = sDesc.displayProperties.description;
                                }
                            }
                        }


                        if (q.status.completed) { complete++; }

                        if (q.status.completed === false && q.status.started === true) {
                            let oCntr = 0;
                            if (q.status.stepObjectives != null) {
                                q.status.stepObjectives.forEach(o => {
                                    oCntr++;
                                    const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                                    if (oDesc.completionValue != null && oDesc.completionValue > 0) {
                                        oPct = o.progress / oDesc.completionValue;
                                    }
                                });
                            }
                        }


                    })
                } else if (ms.activities != null && ms.activities.length > 0) {
                    const act = ms.activities[0];
                    if (act.challenges != null && act.challenges.length > 0) {
                        const challenge = act.challenges[0];
                        if (challenge.objective != null) {
                            const obj = challenge.objective;
                            const oDesc: any = this.destinyCacheService.cache.Objective[obj.objectiveHash];
                            if (oDesc != null) {
                                if (obj.complete === true) {
                                    oPct = 1;
                                } else {
                                    oPct = obj.progress / oDesc.completionValue;
                                }
                            }
                        }

                    }

                }
                if (total === 0) { total++; }
                let pct: number = complete / total;
                if (pct === 0) { pct = oPct; }
                if (pct > 0 && pct < 1) {
                    info = Math.floor(100 * pct) + '% complete';
                    milestonesByKey[key].hasPartial = true;
                }
                const m: MilestoneStatus = new MilestoneStatus(key, complete === total, pct, info, suppInfo);
                c.milestones[key] = m;
            });
        }

        const factions: Progression[] = [];
        if (_prog.factions != null) {
            Object.keys(_prog.factions).forEach((key) => {
                const p: PrivProgression = _prog.factions[key];
                const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Faction[p.factionHash]);
                if (prog != null) {
                    factions.push(prog);
                }

            });
        }
        c.maxLevel = this.MAX_LEVEL;

        // only progression we care about right now is Legend
        if (_prog.progressions) {
            Object.keys(_prog.progressions).forEach((key) => {
                // infamy
                if (key === '2030054750') {
                    const p: PrivProgression = _prog.progressions[key];
                    const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                    c.legendProgression = prog;
                    c.wellRested = prog.nextLevelAt * 3 > prog.weeklyProgress;
                } else if (key === '3882308435' || key === '2679551909' || key === '2772425241') {
                    const p: PrivProgression = _prog.progressions[key];
                    const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                    if (prog != null) {
                        factions.push(prog);
                    }
                } else if (key === '2679551909') {
                    const p: PrivProgression = _prog.progressions[key];
                    const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                    if (prog != null) {
                        factions.push(prog);
                    }
                } else if (key === '540048094') {
                    const p: PrivProgression = _prog.progressions[key];
                    const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                    prog.name = 'Personal Clan XP';
                    prog.currentProgress = prog.weeklyProgress;
                    prog.percentToNextLevel = prog.currentProgress / 5000;
                    if (prog != null) {
                        factions.push(prog);
                    }
                }

            });
        }

        factions.sort(function (a, b) {
            return b.percentToNextLevel - a.percentToNextLevel;
        })
        c.factions = factions;

        // progressions we'll ignore for now, factions has it all
        // quests? are empty for now, check back later
        // uninstancedItemObjectives

    }



    private static getBasicValue(val: any): number {
        if (val == null) { return null; }
        if (val.basic == null) { return; }
        return val.basic.value;
    }

    private static getBasicDisplayValue(val: any): string {
        if (val == null) { return null; }
        if (val.basic == null) { return; }
        return val.basic.displayValue;
    }

    private parseActivity(a): Activity {
        const act: Activity = new Activity();

        act.period = a.period;
        act.referenceId = a.activityDetails.referenceId;
        act.instanceId = a.activityDetails.instanceId;
        act.mode = ParseService.lookupMode(a.activityDetails.mode);
        act.type = '';
        const desc: any = this.destinyCacheService.cache.Activity[act.referenceId];
        if (desc) {
            act.name = desc.displayProperties.name;
            if (desc.activityTypeHash) {
                const typeDesc: any = this.destinyCacheService.cache.ActivityType[desc.activityTypeHash];
                if (typeDesc != null) {
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
            act.kd = ParseService.getBasicValue(a.values.killsDeathsRatio);
            act.completionReason = ParseService.getBasicValue(a.values.completionReason);
            if (desc.isPvP) {
                act.success = act.standing === 0;
            } else {
                act.success = act.completionReason === 0;
            }


        }
        act.isPrivate = a.activityDetails.isPrivate;
        if (desc.isPvP) {
            act.pvType = 'PvP';
        } else {
            act.pvType = 'PvE';
        }

        act.desc = act.mode + ': ' + act.name;
        if (act.isPrivate) {
            act.desc += '(Private)';
        }
        // act.values = a.values;
        return act;

    }

    private parseModifier(hash: string): NameDesc {
        const jDesc = this.destinyCacheService.cache.ActivityModifier[hash];
        let name: string = null;
        let desc: string = null;
        if (jDesc != null) {
            name = jDesc.displayProperties.name;
            desc = jDesc.displayProperties.description;
        }
        if (name != null && name !== '' && name !== 'Classified') {
            return new NameDesc(name, desc);
        }
        return new NameDesc('Classified', 'Keep it secret, keep it safe');
    }

    public parseAggHistory(resp: any): AggHistory {
        const returnMe: AggHistory = new AggHistory();

        if (resp.activities != null) {
            // activity type hash 2043403989 raid
            // 575572995 nightfall
            resp.activities.forEach((act: any) => {
                if (!act.activityHash) { return; }

                const vDesc: any = this.destinyCacheService.cache.Activity[act.activityHash];
                if (vDesc == null) { return; }
                const tDesc: any = this.destinyCacheService.cache.ActivityType[vDesc.activityTypeHash];
                // raid
                if (vDesc.activityTypeHash === 2043403989) {
                    const desc: any = this.destinyCacheService.cache.Activity[act.activityHash];
                    let name: string = null;
                    let tier: number = null;
                    if (desc) {
                        name = desc.displayProperties.name;
                        tier = desc.tier;
                    } else {
                        console.log('No entry found for activity hash: ' + act.activityhash);
                    }
                    // console.log(name);
                    if (name === 'Leviathan') {
                        // nm
                        if (tier < 2) {
                            const c = ParseService.getBasicValue(act.values.activityCompletions);
                            returnMe.raid += c;
                            const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                            if ((f > 0) && (returnMe.raidFastestMs == null || returnMe.raidFastestMs > f)) {
                                returnMe.raidFastestMs = f;
                            }
                        } else {
                            const c = ParseService.getBasicValue(act.values.activityCompletions);
                            returnMe.hmRaid += c;
                            const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                            if ((f > 0) && (returnMe.hmRaidFastestMs == null || returnMe.hmRaidFastestMs > f)) {
                                returnMe.hmRaidFastestMs = f;
                            }
                        }

                    } else if (name === 'Leviathan, Eater of Worlds') {
                        const c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.eater += c;
                        const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f > 0) && (returnMe.eaterFastestMs == null || returnMe.eaterFastestMs > f)) {
                            returnMe.eaterFastestMs = f;
                        }
                    } else if (name === 'Leviathan, Spire of Stars') {
                        const c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.spire += c;
                        const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f > 0) && (returnMe.spireFastestMs == null || returnMe.spireFastestMs > f)) {
                            returnMe.spireFastestMs = f;
                        }
                    } else if (name.indexOf('Last Wish') === 0) {
                        const c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.lwNm += c;
                        const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f > 0) && (returnMe.lwNmFastestMs == null || returnMe.lwNmFastestMs > f)) {
                            returnMe.lwNmFastestMs = f;
                        }
                    }
                    else if (name.indexOf('Scourge of the Past') === 0) {
                        const c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.spNm += c;
                        const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f > 0) && (returnMe.spNmFastestMs == null || returnMe.spNmFastestMs > f)) {
                            returnMe.spNmFastestMs = f;
                        }
                    }
                } else if (vDesc.activityTypeHash === 575572995) {
                    // heroic nightfall - scored
                    if (vDesc.directActivityModeHash === 532484583) {
                        const c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.hmNf += c;
                        const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f > 0) && (returnMe.hmNfFastestMs == null || returnMe.hmNfFastestMs > f)) {
                            returnMe.hmNfFastestMs = f;
                        }
                    } else if (vDesc.directActivityModeHash === 547513715) {
                        const c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.nf += c;
                        const f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f > 0) && (returnMe.nfFastestMs == null || returnMe.nfFastestMs > f)) {
                            returnMe.nfFastestMs = f;
                        }
                    }
                }
            });
        }
        return returnMe;
    }

    private dedupeArray(arr: number[]): number[] {
        const unique_array = Array.from(new Set(arr))
        return unique_array;
    }

    public parseVendorData(resp: any): SaleItem[] {
        if (resp == null || resp.sales == null) { return null; }
        let returnMe = [];
        for (const key of Object.keys(resp.sales.data)) {
            const vendor = resp.sales.data[key];
            const items = this.parseIndividualVendor(resp, key, vendor);
            returnMe = returnMe.concat(items);

        }
        for (const i of returnMe) {
            i.lowLinks = this.lowlineService.buildItemLink(i.hash);
        }
        returnMe.sort((a, b) => {
            if (a.tierType < b.tierType) { return 1; }
            if (a.tierType > b.tierType) { return -1; }
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });

        return returnMe;
    }

    private parseIndividualVendor(resp: any, vendorKey: string, v: any): SaleItem[] {
        if (v.saleItems == null) { return []; }
        const vDesc: any = this.destinyCacheService.cache.Vendor[vendorKey];
        if (vDesc == null) { return []; }
        const vendor: Vendor = {
            hash: vendorKey,
            name: vDesc.displayProperties.name,
            icon: vDesc.displayProperties.icon,
            displayProperties: vDesc.displayProperties,
            nextRefreshDate: resp.vendors.data[vendorKey].nextRefreshDate
        };
        const items: SaleItem[] = [];
        for (const key of Object.keys(v.saleItems)) {
            const i = v.saleItems[key];
            const oItem = this.parseSaleItem(vendor, resp, i);
            if (oItem != null) {
                items.push(oItem);
            }
        }
        return items;
    }

    private parseSaleItem(vendor: Vendor, resp: any, i: any): SaleItem {
        if (i.itemHash == null && i.itemHash === 0) { return null; }
        const index = i.vendorItemIndex;
        const iDesc: any = this.destinyCacheService.cache.InventoryItem[i.itemHash];
        if (iDesc == null) { return null; }

        let searchText = '';
        const costs: any[] = [];
        if (i.costs) {
            for (const cost of i.costs) {
                if (cost.itemHash == null || cost.itemHash === 0) { continue; }
                const cDesc: any = this.destinyCacheService.cache.InventoryItem[cost.itemHash];
                if (cDesc == null) { continue; }
                costs.push({
                    name: cDesc.displayProperties.name,
                    hash: cost.itemHash,
                    quantity: cost.quantity
                });
                searchText += cDesc.displayProperties.name + ' ';
            }
        }

        const rolledPerks = [];

        const itemSockets = resp.itemComponents[vendor.hash].sockets.data[index];
        if (itemSockets != null) {
            const socketArray = itemSockets.sockets;
            for (let cntr = 0; cntr < socketArray.length; cntr++) {
                const socketVal = socketArray[cntr];
                if (iDesc.sockets==null) {
                    continue;
                }
                const socketTemplate = iDesc.sockets.socketEntries[cntr];

                // 2846385770
                if (socketTemplate.reusablePlugItems != null && socketTemplate.reusablePlugItems.length > 0 ) {
                    const perkDesc: any = this.destinyCacheService.cache.InventoryItem[socketVal.plugHash];
                    if (perkDesc != null && perkDesc.itemTypeAndTierDisplayName === 'Exotic Intrinsic'
                        && (iDesc.itemTypeAndTierDisplayName.indexOf('Exotic') >= 0)) {
                        const perkSet = [];
                        perkSet.push({
                            hash: socketVal.plugHash,
                            icon: perkDesc.displayProperties.icon,
                            name: perkDesc.displayProperties.name,
                            desc: perkDesc.displayProperties.description,
                        });
                        searchText += perkDesc.displayProperties.name + ' ';
                        console.log(perkDesc.displayProperties.name);
                        rolledPerks.push(perkSet);
                    }
                }

                if (socketTemplate.randomizedPlugItems != null && socketTemplate.randomizedPlugItems.length > 0) {
                    const perkSet = [];
                    if (socketVal.reusablePlugs != null) {

                        for (const perkHash of socketVal.reusablePlugHashes) {
                            const perkDesc: any = this.destinyCacheService.cache.InventoryItem[perkHash];
                            if (perkDesc != null) {
                                perkSet.push({
                                    hash: perkHash,
                                    icon: perkDesc.displayProperties.icon,
                                    name: perkDesc.displayProperties.name,
                                    desc: perkDesc.displayProperties.description,
                                });
                                searchText += perkDesc.displayProperties.name + ' ';
                            }
                        }

                    } else if (socketVal.reusablePlugHashes == null) {
                        const perkDesc: any = this.destinyCacheService.cache.InventoryItem[socketVal.plugHash];
                        if (perkDesc != null) {
                            perkSet.push({
                                hash: socketVal.plugHash,
                                icon: perkDesc.displayProperties.icon,
                                name: perkDesc.displayProperties.name,
                                desc: perkDesc.displayProperties.description,
                            });
                            searchText += perkDesc.displayProperties.name + ' ';
                        }
                    }
                    if (perkSet.length > 0) {
                        rolledPerks.push(perkSet);
                    }
                }
            }
        }

        const objectives = [];
        if (iDesc.objectives != null && iDesc.objectives.objectiveHashes != null) {
            for (const oHash of iDesc.objectives.objectiveHashes) {
                const oDesc: any = this.destinyCacheService.cache.Objective[oHash];
                if (oDesc != null) {
                    objectives.push({
                        total: oDesc.completionValue,
                        units: oDesc.progressDescription
                    });

                    searchText += oDesc.progressDescription + ' ';
                }
            }
        }

        const values = [];
        if (iDesc.value != null && iDesc.value.itemValue != null) {
            for (const val of iDesc.value.itemValue) {
                if (val.itemHash === 0) { continue; }
                const valDesc: any = this.destinyCacheService.cache.InventoryItem[val.itemHash];
                if (valDesc != null) {
                    values.push({
                        name: valDesc.displayProperties.name,
                        quantity: val.quantity
                    });
                    searchText += valDesc.displayProperties.name + ' ';
                }

            }
        }

        let itemType = iDesc.itemType;
        if (iDesc.itemType === ItemType.Mod && iDesc.itemTypeDisplayName.indexOf('Mod') > 0) {
            itemType = ItemType.GearMod;
        }


        searchText += iDesc.displayProperties.name + ' '
        searchText += vendor.name + ' ';
        if (vendor.hash === '2190858386') {
            searchText += 'Xur ';
        }
        searchText += iDesc.itemTypeAndTierDisplayName + ' ';

        return {
            vendor: vendor,
            hash: i.itemHash,
            name: iDesc.displayProperties.name,
            icon: iDesc.displayProperties.icon,
            type: itemType,
            tierType: iDesc.tierType != null ? iDesc.tierType : -1,
            status: this.parseSaleItemStatus(i.saleStatus),
            itemTypeAndTierDisplayName: iDesc.itemTypeAndTierDisplayName,
            itemTypeDisplayName: iDesc.itemTypeDisplayName,
            quantity: i.quantity,
            objectives: objectives,
            rolledPerks: rolledPerks,
            value: values,
            costs: costs,
            searchText: searchText.toLowerCase()
        }
    }

    private parseSaleItemStatus(s: number): string {
        if ((s & 8) > 0) {
            return 'Not unlocked';
        } else if ((s & 32) > 0) {
            return 'Not for sale right now';
        } else if ((s & 64) > 0) {
            return 'Not available';
        } else if ((s & 128) > 0) {
            return 'Already held';
        }
        return null;
    }

    public parsePublicMilestones(resp: any): PublicMilestone[] {
        const msMilestones: PrivPublicMilestone[] = [];
        const returnMe: PublicMilestone[] = [];
        Object.keys(resp).forEach(key => {
            const ms: any = resp[key];
            msMilestones.push(ms);
        });
        for (const ms of msMilestones) {
            let rewards = '';
            let rewCnt = 0;
            const desc = this.destinyCacheService.cache.Milestone[ms.milestoneHash];
            if (desc == null) {
                 continue;
            }
            let icon = desc.displayProperties.icon;
            const activities: MilestoneActivity[] = [];
            if (ms.activities != null) {
                for (const act of ms.activities) {
                    const challenges: MilestoneChallenge[] = [];
                    const aDesc = this.destinyCacheService.cache.Activity[act.activityHash];
                    if (act.challengeObjectiveHashes != null && act.challengeObjectiveHashes.length > 0) {
                        for (const c of act.challengeObjectiveHashes) {
                            const oDesc: any = this.destinyCacheService.cache.Objective[c];
                            challenges.push({
                                name: oDesc.displayProperties.name,
                                desc: oDesc.displayProperties.description,
                                completionValue: oDesc.completionValue,
                                progressDescription: oDesc.progressDescription
                            });
                        }
                    }
                    const modifiers: NameDesc[] = [];
                    if (act.modifierHashes != null && act.modifierHashes.length > 0) {
                        for (const n of act.modifierHashes) {
                            const mod: NameDesc = this.parseModifier(n);
                            modifiers.push(mod);
                        }
                    }
                    const loadoutReqs: LoadoutRequirement[] = [];
                    if (act.loadoutRequirementIndex != null) {
                        if (aDesc != null) {
                            if (aDesc.loadouts != null && aDesc.loadouts.length > act.loadoutRequirementIndex) {
                                const pReq = aDesc.loadouts[act.loadoutRequirementIndex];
                                if (pReq != null && pReq.requirements != null) {
                                    const lReqs: PrivLoadoutRequirement[] = aDesc.loadouts[act.loadoutRequirementIndex].requirements;
                                    for (const lReq of lReqs) {
                                        const slotDesc = this.destinyCacheService.cache.EquipmentSlot[lReq.equipmentSlotHash];
                                        const items = [];
                                        const subtypes = [];
                                        if (lReq.allowedEquippedItemHashes != null) {
                                            for (const lReqItem of lReq.allowedEquippedItemHashes) {
                                                const iDesc: any = this.destinyCacheService.cache.InventoryItem[lReqItem];
                                                if (iDesc != null) {
                                                    if (iDesc.displayProperties != null) {
                                                        items.push(iDesc.displayProperties.name);
                                                    }
                                                }
                                            }
                                        }
                                        if (lReq.allowedWeaponSubTypes != null) {
                                            for (const lSubType of lReq.allowedWeaponSubTypes) {
                                                const s = this.parseWeaponSubtype(lSubType);
                                                subtypes.push(s);
                                            }
                                        }
                                        loadoutReqs.push({
                                            equipmentSlot: slotDesc.displayProperties.name,
                                            allowedEquippedItems: items,
                                            allowedWeaponSubTypes: subtypes
                                        });
                                    }

                                }
                            }
                        }
                    }
                    activities.push({
                        hash: act.activityHash,
                        name: aDesc.displayProperties.name,
                        desc: aDesc.displayProperties.description,
                        ll: aDesc.activityLightLevel,
                        tier: aDesc.tier,
                        icon: aDesc.displayProperties.icon,
                        challenges: challenges,
                        modifiers: modifiers,
                        loadoutReqs: loadoutReqs
                    });
                }
            } else if (ms.availableQuests) {
                for (const q of ms.availableQuests) {
                    const iDesc: any = this.destinyCacheService.cache.InventoryItem[q.questItemHash];
                    if (iDesc != null) {
                        if (iDesc.value != null && iDesc.value.itemValue != null) {
                            for (const v of iDesc.value.itemValue) {
                                if (v.itemHash != null && v.itemHash > 0) {
                                    const rewDesc: any = this.destinyCacheService.cache.InventoryItem[v.itemHash];
                                    if (rewDesc != null) {
                                        rewCnt++;
                                        rewards += rewDesc.displayProperties.name;
                                    }

                                }

                            }
                        }
                        if (icon == null) {
                            icon = iDesc.displayProperties.icon;
                        }
                        activities.push({
                            hash: 'quest-' + q.questItemHash,
                            name: iDesc.displayProperties.name,
                            desc: iDesc.displayProperties.description,
                            ll: null,
                            tier: null,
                            icon: iDesc.displayProperties.icon,
                            challenges: [],
                            modifiers: [],
                            loadoutReqs: []
                        });
                    }
                }
            }
            // else{
            //     console.log("    Empty activities on milestone: "+desc.displayProperties.name+", hash: "+ms.milestoneHash);
            // }

            if (desc.rewards != null) {
                for (const entryKey of Object.keys(desc.rewards)) {
                    const entry = desc.rewards[entryKey];
                    if (entry.rewardEntries != null) {
                        for (const rewEntKey of Object.keys(entry.rewardEntries)) {
                            const rewEnt = entry.rewardEntries[rewEntKey];
                            if (rewEnt.items != null) {
                                for (const reI of rewEnt.items) {

                                    rewCnt++;
                                    const iDesc: any = this.destinyCacheService.cache.InventoryItem[reI.itemHash];
                                    if (iDesc != null) {

                                        rewCnt++;
                                        rewards += iDesc.displayProperties.name;
                                        if (reI.quantity > 0) {
                                            rewards += reI.quantity + ' ';
                                        }
                                    }

                                }
                            }
                        }
                    }
                }
            }
            if (rewCnt > 4) {
                rewards = '';
            }

            const dAct = {};

            for (const a of activities) {
                const key = a.name + ' ' + a.challenges.length + ' ' + a.modifiers.length + ' ' + a.loadoutReqs.length
                if (dAct[key] == null) {

                    dAct[key] = {
                        activity: a,
                        lls: []
                    };
                }
                if (a.ll > 100) {
                    dAct[key].lls.push(a.ll);
                }
            }

            const aggActivities = [];
            let nothingInteresting = true;
            for (const key of Object.keys(dAct)) {
                const aggAct = dAct[key];
                aggAct.lls = this.dedupeArray(aggAct.lls);
                if (aggAct.activity.challenges.length > 0 ||
                    aggAct.activity.modifiers.length > 0 ||
                    aggAct.activity.loadoutReqs.length > 0) {
                    nothingInteresting = false;
                }
                aggActivities.push(aggAct);
            }
            let summary = null;
            if (nothingInteresting && aggActivities.length > 0) {
                summary = '';
                for (const a of aggActivities) {
                    summary += a.activity.name + ' ';
                    if (a.lls.length > 0) {
                        for (const ll of a.lls) {
                            summary += ll + ' ';
                        }
                    }
                }
            }

            if (ms.milestoneHash === 3603098564) {
                rewards += ' (600)';
            } else if (ms.milestoneHash === 3456) {
                rewards += ' (580-600)';
            } else if (ms.milestoneHash === 2171429505) {
                rewards += ' (540)';
            } else if (ms.milestoneHash === 2853331463) {
                rewards += ' (540)';
            } else if (ms.milestoneHash === 463010297) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 536115997) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 3082135827) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 3448738070) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 1437935813) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 3172444947) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 3312018120) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 157823523) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 941217864) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 1300394968) {
                rewards += ' (520)';
            } else if (ms.milestoneHash === 3312018120) {
                rewards += ' (520)';
            }

            returnMe.push({
                hash: ms.milestoneHash + '',
                name: desc.displayProperties.name,
                desc: desc.displayProperties.description,
                start: ms.startDate,
                end: ms.endDate,
                order: ms.order,
                icon: icon,
                activities: activities,
                aggActivities: aggActivities,
                rewards: rewards,
                summary: summary
            });

        }

        returnMe.sort((a, b) => {
            if (a.rewards < b.rewards) { return 1; }
            if (a.rewards > b.rewards) { return -1; }
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });
        return returnMe;
    }

    private parseWeaponSubtype(n: number): String {
        if (n === 0) { return 'None'; }
        if (n === 6) { return 'Auto Rifle'; }
        if (n === 7) { return 'Shotgun'; }
        if (n === 8) { return 'Machine Gun'; }
        if (n === 9) { return 'Hand Cannon'; }
        if (n === 10) { return 'Rocket Launcher'; }
        if (n === 11) { return 'Fusion Rifle'; }
        if (n === 12) { return 'Sniper Rifle'; }
        if (n === 13) { return 'Pulse Rifle'; }
        if (n === 14) { return 'Scout Rifle'; }
        if (n === 17) { return 'Sidearm'; }
        if (n === 8) { return 'Sword'; }
        if (n === 9) { return 'Mask'; }
        if (n === 20) { return 'Shader'; }
        if (n === 21) { return 'Ornament'; }
        if (n === 22) { return 'Linear Fusion Rifle'; }
        if (n === 23) { return 'Grenade Launcher'; }
        if (n === 24) { return 'Submachine Gun'; }
        if (n === 25) { return 'Trace Rifle'; }
        if (n === 26) { return 'Helmet'; }
        if (n === 27) { return 'Gauntlets'; }
        if (n === 28) { return 'Chest'; }
        if (n === 29) { return 'Leg'; }
        if (n === 30) { return 'Class'; }
        if (n === 31) { return 'Bow'; }
        return '';
    }


    public parseActivities(a: any[]): Activity[] {
        const returnMe: any[] = [];
        a.forEach((act) => {
            const parsed = this.parseActivity(act);
            if (parsed != null) {
                returnMe.push(parsed);
            }
        })
        return returnMe;
    }

    private parseProfileChecklists(resp: any): Checklist[] {
        const checklists: Checklist[] = [];

        if (resp.profileProgression != null && resp.profileProgression.data != null && resp.profileProgression.data.checklists != null) {
            const oChecklists: any = resp.profileProgression.data.checklists;
            Object.keys(oChecklists).forEach((key) => {
                // skip raid lair
                if (key === '110198094') { return; }
                const vals: any = oChecklists[key];
                const desc: any = this.destinyCacheService.cache.Checklist[key];
                if (desc == null) {
                    return;
                }
                let cntr = 0, cntChecked = 0;
                const checkListItems: ChecklistItem[] = [];
                let hasDescs = false;
                for (const entry of desc.entries) {
                    const hash = entry.hash;
                    let name = entry.displayProperties.name;
                    const checked = vals[entry.hash];
                    let cDesc = entry.displayProperties.description;

                    if ('Mementos from the Wild' === name) {
                        name += ' ' + (1 + cntr);
                        if ((hash === '4195138678') ||
                            (hash === '78905203') ||
                            (hash === '1394016600') ||
                            (hash === '1399126202')) {
                            // this is fine
                        } else {
                            // ignore
                            continue;
                        }
                    }
                    cntr++;
                    if (entry.itemHash) {
                        const iDesc: any = this.destinyCacheService.cache.InventoryItem[entry.itemHash];
                        cDesc = iDesc.displayProperties.description;
                    }
                    if (entry.activityHash) {
                        const iDesc: any = this.destinyCacheService.cache.Activity[entry.activityHash];
                        cDesc = iDesc.displayProperties.description;
                    }
                    if (cDesc == null || cDesc.length === 0) {
                        cDesc = null;
                    } else if (cDesc.startsWith('CB.NAV/RUN.()')) {
                        cDesc = cDesc.substring('CB.NAV/RUN.()'.length);
                        name = name.substring(0, 3) + ' ' + cDesc;
                        cDesc = null;
                    }

                    if (!hasDescs && cDesc != null) {
                        hasDescs = true;
                    }

                    const checklistItem: ChecklistItem = {
                        hash: hash,
                        name: name,
                        checked: checked,
                        lowLinks: this.lowlineService.buildChecklistLink(hash),
                        desc: cDesc
                    };
                    checkListItems.push(checklistItem);
                    if (checked) {
                        cntChecked++;
                    }
                }

                let checklistName = desc.displayProperties.name;
                if (checklistName === 'Latent Memories') {
                    checklistName = 'Memory Fragments';
                }
                if (checklistName === 'The Journals of Cayde-6') {
                    checklistName = 'Cayde Journals';
                }
                if (checklistName === 'Forsaken Item Collection - Preview, Profile-wide Items') {
                    checklistName = 'Forsaken - Profile';
                    // ignore
                    return;
                }

                const checklist: Checklist = {
                    hash: key,
                    name: checklistName,
                    complete: cntChecked,
                    total: cntr,
                    entries: checkListItems,
                    hasDescs: hasDescs
                }

                checklists.push(checklist);
            });
        }
        return checklists;
    }

    private parseCharChecklists(resp: any, chars: Character[]): CharChecklist[] {
        const checklists: CharChecklist[] = [];
        if (resp.characterProgressions && resp.characterProgressions.data) {
            for (const char of chars) {
                const charProgs = resp.characterProgressions.data[char.characterId];
                if (charProgs) {
                    const oChecklists: any = charProgs.checklists;
                    Object.keys(oChecklists).forEach((key) => {
                        const vals: any = oChecklists[key];
                        const desc: any = this.destinyCacheService.cache.Checklist[key];

                        let checklist: CharChecklist = null;
                        for (const c of checklists) {
                            if (c.hash === key) {
                                checklist = c;
                            }
                        }
                        if (checklist == null) {
                            let checklistName = desc.displayProperties.name;

                            if (checklistName === 'Forsaken Item Collection - Preview, Character Specific Items') {
                                checklistName = 'Forsaken - Char';
                                return;
                            }

                            checklist = {
                                hash: key,
                                name: checklistName,
                                totals: [],
                                entries: []
                            }
                            checklists.push(checklist);
                        }

                        let cntr = 0, cntChecked = 0;
                        for (const entry of desc.entries) {
                            cntr++;
                            const hash = entry.hash;

                            let checklistItem: CharChecklistItem = null;
                            for (const cl of checklist.entries) {
                                if (cl.hash === hash) {
                                    checklistItem = cl;
                                }
                            }
                            if (checklistItem == null) {
                                const name = entry.displayProperties.name;
                                checklistItem = {
                                    hash: hash,
                                    name: name,
                                    allDone: false,
                                    // weird adventures that are only once per account
                                    oncePerAccount: (hash === '844419501' || hash === '1942564430') ? true : false,
                                    lowLinks: this.lowlineService.buildChecklistLink(hash),
                                    checked: []
                                };
                                checklist.entries.push(checklistItem);
                            }

                            const checked = vals[entry.hash];
                            checklistItem.checked.push({
                                char: char,
                                checked: checked
                            });

                            // if this is once per account, mark everything true
                            // if (checklistItem.oncePerAccount){
                            //     let anyChecked = false;
                            //     for (let c of checklistItem.checked){
                            //         anyChecked = anyChecked || c.checked;
                            //     }
                            //     if (anyChecked){
                            //         for (let c of checklistItem.checked){
                            //             c.checked = true;
                            //         }
                            //     }
                            // }

                            checklistItem.allDone = !checklistItem.oncePerAccount;
                            for (const c of checklistItem.checked) {
                                if (checklistItem.oncePerAccount) {
                                    checklistItem.allDone = c.checked || checklistItem.allDone;
                                } else {
                                    checklistItem.allDone = c.checked && checklistItem.allDone;
                                }

                            }
                            if (!checklistItem.oncePerAccount && checked) {
                                cntChecked++;
                            }
                        }

                        const charTotal = {
                            char: char,
                            complete: cntChecked,
                            total: cntr
                        }
                        checklist.totals.push(charTotal);
                    });
                }
            }
        }
        // post-process once per account to get proper totals
        for (const checklist of checklists) {
            for (const entry of checklist.entries) {
                if (entry.oncePerAccount) {
                    if (entry.allDone) {
                        for (const total of checklist.totals) {
                            total.complete++;
                        }
                    }
                }
            }
        }
        return checklists;
    }



    public parsePlayer(resp: any, publicMilestones: PublicMilestone[]): Player {
        if (resp.profile != null && resp.profile.privacy === 2) {
            throw new Error('Privacy settings disable viewing this player\'s profile.');
        }
        if (resp.characters != null && resp.characters.privacy === 2) {
            throw new Error('Privacy settings disable viewing this player\'s characters.');
        }

        let profile: Profile;
        if (resp.profile != null) {
            profile = resp.profile.data;
        }

        let superprivate = false;

        const charsDict: { [key: string]: Character } = {};
        const milestoneList: MileStoneName[] = [];
        const milestonesByKey: any = {};
        let currentActivity: CurrentActivity = null;
        const chars: Character[] = [];
        let hasWellRested = false;

        if (publicMilestones != null) {
            for (const p of publicMilestones) {
                // 2986584050  eater
                // 2683538554  spire
                // 3660836525 raid
                // 534869653  xur
                // 4253138191 weekly clan engrams
                if (
                    '2986584050' === p.hash ||  // eater
                    '2683538554' === p.hash ||  // spire
                    '3660836525' === p.hash ||  // raid
                    '534869653' === p.hash ||   // xur
                    '1342567285' === p.hash ||   // scourge
                    '4128810957' === p.hash ||   // eva return
                    '4253138191' === p.hash    // weekly clan engrams
                ) {
                    continue;
                }

                try {
                    p.end = new Date(p.end).toISOString();
                } catch (e) {
                    p.end = null;
                }
                const ms: MileStoneName = {
                    key: p.hash,
                    resets: p.end,
                    rewards: p.rewards,
                    name: p.summary == null ? p.name : p.summary,
                    desc: p.desc,
                    hasPartial: false
                };
                // Fix heroic advenstures
                if (ms.resets === '1970-01-01T00:00:00.000Z') {
                    ms.resets = null;
                }
                milestoneList.push(ms);
                milestonesByKey[p.hash] = ms;
            }
        }

        if (resp.characters != null) {
            const oChars: any = resp.characters.data;
            Object.keys(oChars).forEach((key) => {
                charsDict[key] = this.parseCharacter(oChars[key]);
            });
            if (resp.characterProgressions) {
                if (resp.characterProgressions.data) {
                    const oProgs: any = resp.characterProgressions.data;
                    Object.keys(oProgs).forEach((key) => {
                        const curChar: Character = charsDict[key];
                        this.populateProgressions(curChar, oProgs[key], milestonesByKey);
                        hasWellRested = curChar.wellRested || hasWellRested;
                    });
                } else {
                    superprivate = true;
                }
            }
            if (resp.characterActivities) {
                // turned on activity privacy
                if (resp.characterActivities.data == null) {
                    superprivate = true;
                } else if (resp.characterActivities.data) {
                    const oActs: any = resp.characterActivities.data;
                    Object.keys(oActs).forEach((key) => {
                        const curChar: Character = charsDict[key];
                        this.populateActivities(curChar, oActs[key]);
                        if (curChar.currentActivity != null) {
                            currentActivity = curChar.currentActivity;
                        }
                    });
                }
            }


            Object.keys(charsDict).forEach((key) => {
                chars.push(charsDict[key]);
            });

            chars.sort((a, b) => {
                const aD: number = Date.parse(a.dateLastPlayed);
                const bD: number = Date.parse(b.dateLastPlayed);
                if (aD < bD) { return 1; }
                if (aD > bD) { return -1; }
                return 0;

            });
        }

        let recordTree = [];
        let colTree = [];
        let triumphScore = null;
        const currencies: Currency[] = [];
        const rankups: Rankup[] = [];
        const bounties: InventoryItem[] = [];
        let checklists: Checklist[] = [];
        let charChecklists: CharChecklist[] = [];
        if (!superprivate) {
            checklists = this.parseProfileChecklists(resp);
            charChecklists = this.parseCharChecklists(resp, chars);
            // hit with a hammer
            if (resp.profileCurrencies != null && resp.profileCurrencies.data != null && 
                resp.profileCurrencies.data.items != null && this.destinyCacheService.cache != null) {
                resp.profileCurrencies.data.items.forEach(x => {
                    const desc: any = this.destinyCacheService.cache.InventoryItem[x.itemHash];
                    if (desc != null) {
                        currencies.push(new Currency(x.itemHash, desc.displayProperties.name, desc.displayProperties.icon, x.quantity));
                    }
                });
            }
            const vault: Character = new Character();
            vault.className = 'Vault';
            const shared: Character = new Character();
            shared.className = 'Shared';
            if (resp.characterInventories != null && resp.characterInventories.data != null) {
                Object.keys(resp.characterInventories.data).forEach((key) => {
                    const char: Character = charsDict[key];
                    const items: PrivInventoryItem[] = resp.characterInventories.data[key].items;
                    items.forEach(itm => {
                        const parsed: InventoryItem = this.parseInvItem(itm, false, char, vault, resp.itemComponents);
                        if (parsed != null) {
                            parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                            bounties.push(parsed);
                        }
                    });
                });
            }

            bounties.sort(function (a, b) {
                return b.aggProgress - a.aggProgress;
            });

            const nodes: any[] = [];
            const records: any[] = [];
            const collections: any[] = [];
            if (resp.profilePresentationNodes != null && resp.profileRecords != null) {
                if (resp.profilePresentationNodes.data != null && resp.profilePresentationNodes.data.nodes != null) {
                    nodes.push(resp.profilePresentationNodes.data.nodes);
                    records.push(resp.profileRecords.data.records);
                    collections.push(resp.profileCollectibles.data.collectibles);
                    triumphScore = resp.profileRecords.data.score;
                }
            }
            if (resp.characterPresentationNodes != null && resp.characterRecords != null) {
                for (const char of chars) {
                    const presentationNodes = resp.characterPresentationNodes.data[char.characterId].nodes;
                    const _records = resp.characterRecords.data[char.characterId].records;
                    const _coll = resp.characterCollectibles.data[char.characterId].collectibles;
                    nodes.push(presentationNodes);
                    records.push(_records);
                    collections.push(_coll);
                }
            }

            if (records.length > 0) {
                recordTree = this.handleRecPresNode('1024788583', nodes, records).children;
            }

            if (collections.length > 0) {
                colTree = this.handleColPresNode('3790247699', nodes, collections).children;
            }
        }
        return new Player(profile, chars, currentActivity, milestoneList, currencies, bounties,
            rankups, superprivate, hasWellRested, checklists, charChecklists, triumphScore, recordTree, colTree);
    }

    private getBestPres(aNodes: any[], key: string): any {
        let bestNode = null;
        for (const nodes of aNodes) {
            const v = nodes[key];
            if (v == null) { continue; }
            if (bestNode == null || v.progress > bestNode.progress) {
                bestNode = v;
            }
        }
        return bestNode;
    }

    private handleRecPresNode(key: string, pres: any[], records: any[]): TriumphPresentationNode {
        const val = this.getBestPres(pres, key);
        const pDesc = this.destinyCacheService.cache.PresentationNode[key];
        if (pDesc == null) { return null; }
        const children = [];
        let unredeemedCount = 0;
        if (pDesc.children != null) {
            for (const child of pDesc.children.presentationNodes) {
                const oChild = this.handleRecPresNode(child.presentationNodeHash, pres, records);
                if (oChild == null) { continue; }
                children.push(oChild);
                unredeemedCount += oChild.unredeemedCount;
            }
            for (const child of pDesc.children.records) {
                const oChild = this.handleRecordNode(child.recordHash, records);
                if (oChild == null) { continue; }
                children.push(oChild);

                if (oChild.complete && !oChild.redeemed) {
                    unredeemedCount++;
                }
            }
        }
        children.sort(function (a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return {
            type: 'presentation',
            hash: key,
            name: pDesc.displayProperties.name,
            desc: pDesc.displayProperties.description,
            icon: pDesc.displayProperties.icon,
            index: pDesc.index,
            progress: val.objective == null ? 0 : val.objective.progress,
            completionValue: val.objective == null ? 1 : val.objective.completionValue,
            complete: val.objective == null ? false : val.objective.complete,
            children: children,
            unredeemedCount: unredeemedCount
        }
    }

    private handleRecordNode(key: string, records: any[]): TriumphRecordNode {
        const rDesc = this.destinyCacheService.cache.Record[key];
        if (rDesc == null) { return null; }
        const val = this.getBestRec(records, key);
        if (val == null) { return null; }

        let objs = [];
        let totalProgress = 0;
        for (const o of val.objectives) {
            const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
            if (oDesc == null) { continue; }
            const iObj: ItemObjective = {
                completionValue: oDesc.completionValue,
                progressDescription: oDesc.progressDescription,
                progress: o.progress == null ? 0 : o.progress,
                complete: o.complete
            }
            totalProgress += oDesc.completionValue;
            objs.push(iObj);
        }
        if (totalProgress < 2) { objs = []; }
        let complete = false;
        let redeemed = false;
        let title = false;
        if (val != null && val.state != null) {
            if (val.state === 0) {
                complete = true;
            }
            if ((val.state & 1) === 1) {
                redeemed = true;
                complete = true;
            }
            if ((val.state & 64) === 65) {
                title = true;
            }
        }

        return {
            type: 'record',
            hash: key,
            name: rDesc.displayProperties.name,
            desc: rDesc.displayProperties.description,
            icon: rDesc.displayProperties.icon,
            index: rDesc.index,
            objectives: objs,
            complete: complete,
            redeemed: redeemed,
            title: title,
            children: null,
            lowLinks: this.lowlineService.buildRecordLink(key),
            score: rDesc.completionInfo == null ? 0 : rDesc.completionInfo.ScoreValue
        }
    }

    private getBestRec(aNodes: any[], key: string): any {
        let bestNode = null;
        for (const nodes of aNodes) {
            const v = nodes[key];
            if (v == null) { continue; }
            if (bestNode == null || this.recAvg(v) > this.recAvg(bestNode)) {
                bestNode = v;
            }
        }
        return bestNode;
    }

    private getBestCol(aNodes: any[], key: string): any {
        let bestNode = null;
        for (const nodes of aNodes) {
            const v = nodes[key];
            if (v == null) { continue; }
            if (bestNode == null || (v.state != null && (v.state & 1) === 0)) {
                bestNode = v;
            }
        }
        return bestNode;
    }

    private handleColPresNode(key: string, pres: any[], collectibles: any[]): TriumphPresentationNode {
        const val = this.getBestPres(pres, key);
        if (val == null) {
            return null;
        }
        const pDesc = this.destinyCacheService.cache.PresentationNode[key];
        if (pDesc == null) { return null; }
        const children = [];
        if (pDesc.children != null) {
            for (const child of pDesc.children.presentationNodes) {
                const oChild = this.handleColPresNode(child.presentationNodeHash, pres, collectibles);
                if (oChild == null) { continue; }
                children.push(oChild);
            }
            for (const child of pDesc.children.collectibles) {
                const oChild = this.handleCollectibleNode(child.collectibleHash, collectibles);
                if (oChild != null) {
                    children.push(oChild);
                }
            }
        }
        children.sort(function (a, b) {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });

        return {
            type: 'presentation',
            hash: key,
            name: pDesc.displayProperties.name,
            desc: pDesc.displayProperties.description,
            icon: pDesc.displayProperties.icon,
            index: pDesc.index,
            progress: val.objective == null ? 0 : val.objective.progress,
            completionValue: val.objective == null ? 1 : val.objective.completionValue,
            complete: val.objective == null ? false : val.objective.complete,
            children: children,
            unredeemedCount: 0
        }
    }

    private recAvg(rec: any): number {
        if (rec.objectives == null) { return 0; }
        let sum = 0;
        for (const o of rec.objectives) {
            if (o.completionValue != null && o.completionValue > 0) {
                sum += o.progress / o.completionValue;
            }
        }
        return sum;
    }

    private handleCollectibleNode(key: string, collectibles: any[]): TriumphCollectibleNode {
        const cDesc = this.destinyCacheService.cache.Collectible[key];
        if (cDesc == null) { return null; }
        const val = this.getBestCol(collectibles, key);
        let acquired = false;
        if (val != null && val.state != null && (val.state & 1) === 0) {
            acquired = true;
        }
        return {
            type: 'collectible',
            hash: key,
            name: cDesc.displayProperties.name,
            desc: cDesc.displayProperties.description,
            icon: cDesc.displayProperties.icon,
            index: cDesc.index,
            acquired: acquired,
            complete: acquired,
            sourceString: cDesc.sourceString,
            children: null
        }
    }

    private parseInvItem(itm: PrivInventoryItem, equipped: boolean, owner: Character, vaultChar: Character, itemComp: any): InventoryItem {
        try {
            // vault bucket
            if (itm.bucketHash === 138197802) {
                owner = vaultChar;
            }

            const desc: any = this.destinyCacheService.cache.InventoryItem[itm.itemHash];
            if (desc == null) {
                return null;
                // return new InventoryItem(""+itm.itemHash, "Classified", equipped, owner, null, ItemType.None, "Classified");
            }

            // if (
            //     desc.itemType != ItemType.Weapon
            //     && desc.itemType != ItemType.Armor
            //     && desc.itemType != ItemType.Mod
            //     && (desc.inventory.bucketTypeHash != 1469714392)
            //     ) {
            //     return null;
            // }


            if (desc.itemType !== ItemType.Bounty) { return null; }

            const type: ItemType = desc.itemType;
            // if (desc.inventory.bucketTypeHash == 1469714392) {
            //     type = ItemType.Consumable;
            // }
            // let rank: number = null;
            const objectives: ItemObjective[] = [];
            let progTotal = 0, progCnt = 0;
            if (itemComp != null) {
                if (itemComp.objectives != null && itemComp.objectives.data != null) {
                    const objs: any = itemComp.objectives.data[itm.itemInstanceId];
                    for (const o of objs.objectives) {
                        const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                        const iObj: ItemObjective = {
                            completionValue: oDesc.completionValue,
                            progressDescription: oDesc.progressDescription,
                            progress: o.progress == null ? 0 : o.progress,
                            complete: o.complete
                        }

                        if (iObj.completionValue != null && iObj.completionValue > 0) {
                            progTotal += 100 * iObj.progress / iObj.completionValue;
                            progCnt++;
                        }
                        objectives.push(iObj);
                    }
                }
            }
            let aggProgress = 0;
            if (progCnt > 0) {
                aggProgress = progTotal / progCnt;
            }


            const classAvail: any = {};
            if (desc.itemCategoryHashes != null) {
                for (const hash of desc.itemCategoryHashes) {
                    if (hash === 21) {
                        classAvail['2'] = true;
                        // warlock 2
                    } else if (hash === 22) {
                        classAvail['0'] = true;
                        // titan 0
                    } else if (hash === 23) {
                        classAvail['1'] = true;
                        // hunter 1
                    }
                }
            }

            const power = 0;
            const damageType: DamageType = DamageType.None;
            const perks: Perk[] = [];
            const stats: InventoryStat[] = [];
            const sockets: InventorySocket[] = [];

            const values = [];
            if (desc.value != null && desc.value.itemValue != null) {
                for (const val of desc.value.itemValue) {
                    if (val.itemHash === 0) { continue; }
                    const valDesc: any = this.destinyCacheService.cache.InventoryItem[val.itemHash];
                    if (valDesc != null) {
                        values.push({
                            name: valDesc.displayProperties.name,
                            quantity: val.quantity
                        });
                    }

                }
            }

            const bucketOrder = null;
            return new InventoryItem('' + itm.itemHash, desc.displayProperties.name,
                equipped, owner, desc.displayProperties.icon, type, desc.itemTypeDisplayName, itm.quantity,
                power, damageType, perks, stats, sockets, objectives, desc.displayProperties.description,
                classAvail, bucketOrder, aggProgress, values, itm.expirationDate
            );
        } catch (exc) {
            console.dir(itemComp);
            console.error(exc);
            return null;
        }
    }

    public parseClanInfo(j: any): ClanInfo {

        const c: ClanInfo = new ClanInfo();
        c.groupId = j.groupId;
        c.about = j.about;
        c.name = j.name;
        c.creationDate = j.creationDate;
        c.memberCount = j.memberCount;
        c.avatarPath = j.avatarPath;
        c.bannerPath = j.bannerPath;
        const progs: Progression[] = [];
        if (j.clanInfo != null && j.clanInfo.d2ClanProgressions != null) {
            Object.keys(j.clanInfo.d2ClanProgressions).forEach((key) => {

                const p: PrivProgression = j.clanInfo.d2ClanProgressions[key];
                const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                if (prog != null) {
                    if (key === '584850370') {
                        c.primaryProgression = prog;
                    }
                    progs.push(prog);
                }
            });

        }
        c.progressions = progs;
        return c;
    }

    public parseClanMembers(members: any[]): BungieGroupMember[] {
        if (members == null) { return []; }
        const returnMe: BungieGroupMember[] = [];
        members.forEach(x => {
            const b: BungieGroupMember = new BungieGroupMember();
            b.groupId = x.groupId;
            b.isOnline = x.isOnline;
            b.memberType = x.memberType;
            b.destinyUserInfo = this.parseUserInfo(x.destinyUserInfo);
            b.bungieNetUserInfo = x.bungieNetUserInfo;
            returnMe.push(b);
        });


        returnMe.sort(function (a, b) {
            const bs: string = b.destinyUserInfo.displayName;
            const as: string = a.destinyUserInfo.displayName;
            if (bs < as) { return 1; }
            if (bs > as) { return -1; }
            return 0;
        });

        return returnMe;
    }

    private parsePGCREntry(e: any): PGCREntry {
        const r: PGCREntry = new PGCREntry();
        r.bungieNetUserInfo = e.player.bungieNetUserInfo;
        r.characterId = e.characterId;
        r.standing = e.standing;
        r.score = ParseService.getBasicValue(e.score);
        if (e.values != null) {

            r.kills = ParseService.getBasicValue(e.values.kills);
            r.deaths = ParseService.getBasicValue(e.values.deaths);

            if (r.deaths === 0) {
                r.kd = r.kills;
            } else {
                r.kd = r.kills / r.deaths;
            }



            r.assists = ParseService.getBasicValue(e.values.assists);
            r.fireteamId = ParseService.getBasicValue(e.values.fireteamId);
            r.team = ParseService.getBasicDisplayValue(e.values.team);

            r.startSeconds = ParseService.getBasicValue(e.values.startSeconds);
            r.activityDurationSeconds = ParseService.getBasicValue(e.values.activityDurationSeconds);
            r.timePlayedSeconds = ParseService.getBasicValue(e.values.timePlayedSeconds);
            r.completionReason = ParseService.getBasicValue(e.values.completionReason);
            r.weapons = [];
            if (e.extended != null && e.extended.weapons != null) {
                e.extended.weapons.forEach(w => {
                    const data = new PGCRWeaponData();

                    data.hash = w.referenceId;
                    data.kills = ParseService.getBasicValue(w.values.uniqueWeaponKills);
                    data.precPct = ParseService.getBasicValue(w.values.uniqueWeaponKillsPrecisionKills);

                    const desc: any = this.destinyCacheService.cache.InventoryItem[data.hash];
                    if (desc != null) {
                        data.type = desc.itemTypeAndTierDisplayName;
                        data.name = desc.displayProperties.name;
                    } else {
                        data.type = 'Classified';
                        data.name = 'Classified';
                    }
                    r.weapons.push(data);

                });
            }
        }

        r.weapons.sort(function (a, b) {
            return b.kills - a.kills;
        });
        r.characterClass = e.player.characterClass;
        r.characterLevel = e.player.characterLevel;
        r.lightLevel = e.player.lightLevel;
        if (!r.fireteamId) { r.fireteamId = -1; }
        if (!r.score) { r.score = 0; }

        r.user = this.parseUserInfo(e.player.destinyUserInfo);
        return r;
    }

    public parseUserInfo(i: any): UserInfo {
        let platformName = '';
        if (i.membershipType === 1) {
            platformName = 'XBL';
        } else if (i.membershipType === 2) {
            platformName = 'PSN';
        } else if (i.membershipType === 4) {
            platformName = 'BNET';
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
        const r: PGCR = new PGCR();
        r.period = p.period;
        r.referenceId = p.activityDetails.referenceId;
        r.instanceId = p.activityDetails.instanceId;
        r.mode = ParseService.lookupMode(p.activityDetails.mode);

        const desc: any = this.destinyCacheService.cache.Activity[r.referenceId];
        if (desc) {
            r.name = desc.displayProperties.name;
            r.level = desc.activityLevel;
            r.ll = desc.activityLightLevel + 1;
        } else {
            r.name = 'redacted';
        }

        r.isPrivate = p.activityDetails.isPrivate;
        r.entries = [];
        const fireTeamCounts: any = {};

        let teamPveSuccess = false;
        r.pve = !desc.isPvP;

        p.entries.forEach((ent) => {
            const entry = this.parsePGCREntry(ent);

            // pve
            if (r.pve) {
                if (entry.completionReason === 0) {
                    teamPveSuccess = true;
                }
            }


            if (entry.activityDurationSeconds != null) {
                r.activityDurationSeconds = entry.activityDurationSeconds;
                // TODO fix this, period is start, not finish
                r.finish = new Date(Date.parse(r.period) + r.activityDurationSeconds * 1000).toISOString();
            }
            if (fireTeamCounts[entry.fireteamId] == null) {
                fireTeamCounts[entry.fireteamId] = 0;
            }
            fireTeamCounts[entry.fireteamId] = fireTeamCounts[entry.fireteamId] + 1;
            r.entries.push(entry);
        });
        r.pveSuccess = teamPveSuccess;

        r.entries.forEach(e => {
            e.fireteamSize = fireTeamCounts[e.fireteamId];
        });

        if (p.teams != null) {
            r.teams = [];
            p.teams.forEach(t => {
                const team = new PGCRTeam();
                team.name = t.teamName;
                team.standing = ParseService.getBasicDisplayValue(t.standing);
                team.score = ParseService.getBasicValue(t.score);
                r.teams.push(team);
            });
            r.teams.sort(function (a, b) {
                return b.score - a.score;
            });
        }

        const fireTeamList = {};

        r.entries.forEach((ent) => {
            let list = fireTeamList[ent.fireteamId];
            if (list == null) {
                fireTeamList[ent.fireteamId] = [];
                list = fireTeamList[ent.fireteamId];
            }
            list.push(ent);
        });

        let cntr = 0;
        Object.keys(fireTeamList).forEach((key) => {
            cntr++;

            const list = fireTeamList[key];
            list.forEach((ent) => {
                ent.fireteam = cntr;
            });
        });
        r.entries.sort(function (a, b) {
            let returnMe = b.score - a.score;
            if (returnMe === 0) {
                returnMe = b.kills - a.kills;
            }
            return returnMe;
        });


        return r;

    }

    public static lookupMode(mode: number): string {
        if (mode === 0) { return 'None'; }
        if (mode === 2) { return 'Story'; }
        if (mode === 3) { return 'Strike'; }
        if (mode === 4) { return 'Raid'; }
        if (mode === 5) { return 'All PvP'; }
        if (mode === 6) { return 'Patrol'; }
        if (mode === 7) { return 'All PvE'; }
        if (mode === 9) { return 'Reserved9'; }
        if (mode === 10) { return 'Control'; }
        if (mode === 11) { return 'Reserved11'; }
        if (mode === 12) { return 'Clash'; }
        if (mode === 13) { return 'Reserved13'; }
        if (mode === 15) { return 'Crimson Doubles'; }
        if (mode === 16) { return 'Nightfall'; }
        if (mode === 17) { return 'Heroic Nightfall'; }
        if (mode === 18) { return 'All Strikes'; }
        if (mode === 19) { return 'Iron Banner'; }
        if (mode === 20) { return 'Reserved20'; }
        if (mode === 21) { return 'Reserved21'; }
        if (mode === 22) { return 'Reserved22'; }
        if (mode === 24) { return 'Reserved24'; }
        if (mode === 25) { return 'All Mayhem'; }
        if (mode === 26) { return 'Reserved26'; }
        if (mode === 27) { return 'Reserved27'; }
        if (mode === 28) { return 'Reserved28'; }
        if (mode === 29) { return 'Reserved29'; }
        if (mode === 30) { return 'Reserved30'; }
        if (mode === 31) { return 'Supremacy'; }
        if (mode === 32) { return 'Private Matches All'; }
        if (mode === 37) { return 'Survival'; }
        if (mode === 38) { return 'Countdown'; }
        if (mode === 39) { return 'Trials'; }
        if (mode === 40) { return 'Social'; }
        if (mode === 43) { return 'Iron Banner Control'; }
        if (mode === 44) { return 'Iron Banner Clash'; }
        if (mode === 45) { return 'Iron Banner Supremacy'; }
        if (mode === 46) { return 'Nightfall (Scored)'; }
        if (mode === 47) { return 'Heroic NightFall (Scored)'; }
        if (mode === 48) { return 'Rumble'; }
        if (mode === 49) { return 'All Doubles'; }
        if (mode === 50) { return 'Doubles'; }
        if (mode === 51) { return 'Clash (Private)'; }
        if (mode === 52) { return 'Control (Private)'; }
        if (mode === 53) { return 'Supremacy (Private)'; }
        if (mode === 54) { return 'Countdown (Private)'; }
        if (mode === 55) { return 'Survival (Private)'; }
        if (mode === 56) { return 'Mayhem (Private)'; }
        if (mode === 57) { return 'Rumble (Private)'; }
        if (mode === 58) { return 'Heroic Adventure'; }
        if (mode === 59) { return 'Showdown'; }
        if (mode === 60) { return 'Lockdown'; }
        if (mode === 61) { return 'Scorched'; }
        if (mode === 62) { return 'Scorched Team'; }
        if (mode === 63) { return 'Gambit'; }
        if (mode === 64) { return 'All PvE Competitive'; }
        if (mode === 65) { return 'Breakthrough'; }
        return 'Unknown' + mode;
    }

    public parseBungieMembership(resp: any) {

        const returnMe: BungieMembership = new BungieMembership();
        returnMe.bungieId = resp.bungieNetUser.membershipId;
        const aUser: UserInfo[] = [];
        resp.destinyMemberships.forEach(u => {
            aUser.push(this.parseUserInfo(u));
        });
        returnMe.destinyMemberships = aUser;
        return returnMe;

    }

    public parseBungieMember(r: PrivBungieMember): BungieMember {
        if (r.isDeleted === true) { return; }
        let xbl: BungieMemberPlatform;
        let psn: BungieMemberPlatform;
        let bnet: BungieMemberPlatform;
        if (r.xboxDisplayName != null) {
            xbl = new BungieMemberPlatform(r.xboxDisplayName, Const.XBL_PLATFORM);
        }
        if (r.psnDisplayName != null) {
            psn = new BungieMemberPlatform(r.psnDisplayName, Const.PSN_PLATFORM);
        }
        if (r.blizzardDisplayName != null) {

            bnet = new BungieMemberPlatform(r.blizzardDisplayName, Const.BNET_PLATFORM);
        }
        if (xbl == null && psn == null && bnet == null) { return null; }
        return new BungieMember(r.displayName, r.membershipId, xbl, psn, bnet);

    }

    public parseBungieMembers(results: PrivBungieMember[]): BungieMember[] {
        if (results == null) { return null; }
        const returnMe: BungieMember[] = [];
        results.forEach(r => {
            const mem = this.parseBungieMember(r);
            if (mem != null) {
                returnMe.push(mem);
            }

        });
        return returnMe;
    }

    public parseRaidHistory(msNames: MileStoneName[], c: Character, hist: Activity[]) {
        let totalRaid = 0;
        let totalNormal = 0;
        let totalPrestige = 0;
        let totalEater = 0;
        let totalSpire = 0;
        let totalLwNormal = 0;
        let totalSpNormal = 0;
        hist.forEach(a => {
            // ignore not completed
            if (!a.completed) { return; }

            const desc: any = this.destinyCacheService.cache.Activity[a.referenceId];
            let name: string = null;
            let tier: number = null;
            if (desc) {
                name = desc.displayProperties.name;
                tier = desc.tier;
            } else {
                console.log('No entry found for activity hash: ' + a.referenceId);
            }

            const d: Date = new Date(a.period);

            if (name === 'Leviathan') {
                if (tier < 2) {
                    totalNormal++;
                    // if after reset?
                    if (d.getTime() > c.startWeek.getTime()) {
                        c.hasLevNm = true;
                    }
                } else {
                    totalPrestige++;
                    // if after reset?
                    if (d.getTime() > c.startWeek.getTime()) {
                        c.hasLevHm = true;
                    }
                }
            } else if (name === 'Leviathan, Eater of Worlds') {
                totalEater++;
                // if after reset?
                if (d.getTime() > c.startWeek.getTime()) {
                    c.hasEater = true;
                }
            } else if (name === 'Leviathan, Spire of Stars') {
                totalSpire++;
                // if after reset?
                if (d.getTime() > c.startWeek.getTime()) {
                    c.hasSpire = true;
                }
            } else if (name.indexOf('Last Wish') === 0) {
                totalLwNormal++;
                // if after reset?
                if (d.getTime() > c.startWeek.getTime()) {
                    c.hasLwNm = true;
                }
            } else if (name.indexOf('Scourge of the Past') === 0) {
                totalSpNormal++;
                // if after reset?
                if (d.getTime() > c.startWeek.getTime()) {
                    c.hasSpNm = true;
                }
            }
            
            totalRaid++;
        });
        c.lifetimeRaid = totalRaid;
        c.lifetimeRaidNormal = totalNormal;
        c.lifetimeRaidPrestige = totalPrestige;
        c.lifetimeEater = totalEater;
        c.lifetimeSpire = totalSpire;
        c.lifetimeLwNormal = totalLwNormal;
        c.lifetimeSpNormal = totalSpNormal;


        const EATER_KEY = '1234';
        const SPIRE_KEY = '2345';
        const LEV_NM_KEY = '1235';
        const LEV_HM_KEY = '1236';
        const LW_NM_KEY = '3456';
        const SP_NM_KEY = '4567';
        // add psuedo milestone for eater
        let foundEater = false;
        let foundSpire = false;
        let foundNm = false;
        let foundHm = false;
        let foundLwNm = false;
        let foundSpNm = false;
        for (const msName of msNames) {
            if (msName.key === EATER_KEY) {
                foundEater = true;
            } else if (msName.key === SPIRE_KEY) {
                foundSpire = true;
            } else if (msName.key === LEV_NM_KEY) {
                foundNm = true;
            } else if (msName.key === LEV_HM_KEY) {
                foundHm = true;
            } else if (msName.key === LW_NM_KEY) {
                foundLwNm = true;
            } else if (msName.key === SP_NM_KEY) {
                foundSpNm = true;
            }
        }

        if (!foundLwNm) {
            msNames.unshift({
                key: LW_NM_KEY,
                resets: c.endWeek.toISOString(),
                rewards: 'Raid Gear (580-600)',
                name: 'Last Wish',
                desc: 'Forsaken DLC Raid',
                hasPartial: false,
                neverDisappears: true
            });
        }
        if (!foundSpNm) {
            msNames.unshift({
                key: SP_NM_KEY,
                resets: c.endWeek.toISOString(),
                rewards: 'Raid Gear (600+)',
                name: 'Scourge of the Past',
                desc: 'Newest Raid Lair',
                hasPartial: false,
                neverDisappears: true
            });
        }

        // if (!foundEater) {
        //     msNames.push({
        //         key: EATER_KEY,
        //         resets: c.endWeek.toISOString(),
        //         rewards: "Raid Gear",
        //         name: "Leviathan, Eater of Worlds",
        //         desc: "Complete the Leviathan Raid Lair from CoO",
        //         hasPartial: false,
        //        neverDisappears: true
        //     });
        // }
        // if (!foundSpire) {
        //     msNames.push({
        //         key: SPIRE_KEY,
        //         resets: c.endWeek.toISOString(),
        //         rewards: "Raid Gear",
        //         name: "Leviathan, Spire of Stars",
        //         desc: "Complete the Leviathan Raid Lair from Warmind",
        //         hasPartial: false,
        //        neverDisappears: true
        //     });
        // }
        // if (!foundNm) {
        //     msNames.push({
        //         key: LEV_NM_KEY,
        //         resets: c.endWeek.toISOString(),
        //         rewards: "Raid Gear",
        //         name: "Leviathan, Raid",
        //         desc: "Normal mode raid",
        //         hasPartial: false,
        //        neverDisappears: true
        //     });
        // }
        // if (!foundHm) {
        //     msNames.push({
        //         key: LEV_HM_KEY,
        //         resets: c.endWeek.toISOString(),
        //         rewards: "Raid Gear",
        //         name: "Leviathan, Prestige",
        //         desc: "Prestige mode raid",
        //         hasPartial: false,
        //            neverDisappears: true
        //     });
        // }

        const eaterPsuedoMs: MilestoneStatus = new MilestoneStatus(EATER_KEY, c.hasEater, c.hasEater ? 1 : 0, null);
        c.milestones[EATER_KEY] = eaterPsuedoMs;
        const spirePsuedoMs: MilestoneStatus = new MilestoneStatus(SPIRE_KEY, c.hasSpire, c.hasSpire ? 1 : 0, null);
        c.milestones[SPIRE_KEY] = spirePsuedoMs;
        const levNmPsuedoMs: MilestoneStatus = new MilestoneStatus(LEV_NM_KEY, c.hasLevNm, c.hasLevNm ? 1 : 0, null);
        c.milestones[LEV_NM_KEY] = levNmPsuedoMs;
        const levHmPsuedoMs: MilestoneStatus = new MilestoneStatus(LEV_HM_KEY, c.hasLevHm, c.hasLevHm ? 1 : 0, null);
        c.milestones[LEV_HM_KEY] = levHmPsuedoMs;
        const lwNmPsuedoMs: MilestoneStatus = new MilestoneStatus(LW_NM_KEY, c.hasLwNm, c.hasLwNm ? 1 : 0, null);
        c.milestones[LW_NM_KEY] = lwNmPsuedoMs;
        const spNmPsuedoMs: MilestoneStatus = new MilestoneStatus(SP_NM_KEY, c.hasSpNm, c.hasSpNm ? 1 : 0, null);
        c.milestones[SP_NM_KEY] = spNmPsuedoMs;

    }

    public parsePrestigeNfHistory(msNames: MileStoneName[], c: Character, hist: Activity[]) {

        hist.forEach(a => {
            // ignore not completed
            if (!a.completed) { return; }

            const desc: any = this.destinyCacheService.cache.Activity[a.referenceId];
            let name: string = null;
            let tier: number = null;
            if (desc) {
                name = desc.displayProperties.name;
                tier = desc.tier;
            } else {
                console.log('No entry found for activity hash: ' + a.referenceId);
            }
            const d: Date = new Date(a.period);
            if (d.getTime() > c.startWeek.getTime()) {
                c.hasPrestigeNf = true;
            }
        });
        const NF_HM_KEY = '1237';
        // add psuedo milestone for eater
        let foundNfHmKey = false;

        for (const msName of msNames) {
            if (msName.key === NF_HM_KEY) {
                foundNfHmKey = true;
            }
        }
        // prestige nightfall is gone
        // if (!foundNfHmKey) {
        //     msNames.unshift({
        //         key: NF_HM_KEY,
        //         type: "Weekly",
        //         name: "Prestige Nightfall",
        //         desc: "Complete the Prestige Nightfall",
        //         hasPartial: false
        //     });
        // }

        const prestigeNfPsuedoMs: MilestoneStatus = new MilestoneStatus(NF_HM_KEY, c.hasPrestigeNf, c.hasPrestigeNf ? 1 : 0, null);
        c.milestones[NF_HM_KEY] = prestigeNfPsuedoMs;

    }
}




interface PrivCharacter {
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

interface PrivMilestone {
    milestoneHash: number;
    availableQuests: PrivAvailableQuest[];
    rewards: any; // special for clan
    startDate: string;
    endDate: string;
    order: number;
    activities: PrivMilestoneActivityInstance[];
}

interface PrivMilestoneActivityInstance {
    activityHash: number;
    challenges: Challenge[];
    phases: any[];
}


interface Challenge {
    objective: Objective;
}

interface Objective {
    objectiveHash: number;
    activityHash: number;
    progress: number;
    complete: boolean;
    visible: boolean;
}

interface PrivAvailableQuest {
    questItemHash: number;
    status: PrivQuestStatus;
}


interface PrivQuestStatus {
    questHash: number;
    stepHash: number;
    stepObjectives: any[];
    tracked: boolean;
    itemInstanceId: string;
    completed: boolean;
    redeemed: boolean;
    started: boolean;
}

interface PrivProgression {
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


interface PrivBungieMember {
    membershipId: string;
    uniqueName: string;
    displayName: string;
    profilePicture: number;
    profileTheme: number;
    userTitle: number;
    successMessageFlags: string;
    isDeleted: boolean;
    about: string;
    firstAccess: string;
    lastUpdate: string;
    psnDisplayName: string;
    xboxDisplayName: string;
    showActivity: boolean;
    locale: string;
    localeInheritDefault: boolean;
    showGroupMessaging: boolean;
    profilePicturePath: string;
    profileThemeName: string;
    userTitleDisplay: string;
    statusText: string;
    statusDate: string;
    blizzardDisplayName: string;
}

interface PrivInventoryItem {
    itemHash: number;
    itemInstanceId: string;
    quantity: number;
    bindStatus: number;
    location: number;
    bucketHash: number;
    transferStatus: number;
    lockable: boolean;
    state: number;
    expirationDate: string;
}

interface PrivInventoryInstanceData {
    damageType: number; // YES
    damageTypeHash: number; // YES
    primaryStat: PrivInventoryStat; // YES
    itemLevel: number;
    quality: number;
    isEquipped: boolean; // YES
    canEquip: boolean;
    equipRequiredLevel: number;
    unlockHashesRequiredToEquip: number[];
    cannotEquipReason: number;
}

interface PrivInventoryStat {
    statHash: number;
    value: number;
    maximumValue: number;
}

// interface _InventoryPerk {
//     perkHash: number;
//     iconPath: string;
//     isActive: boolean;
//     visible: boolean;
// }

// interface _InventorySocket {
//     plugHash: number;
//     isEnabled: boolean;
//     reusablePlugHashes: number[];
// }
