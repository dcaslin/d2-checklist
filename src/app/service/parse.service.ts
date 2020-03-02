
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { DestinyCacheService, Season, SeasonPass } from './destiny-cache.service';
import { LowLineService } from './lowline.service';
import { Activity, AggHistoryEntry, ApiInventoryBucket, Badge, BadgeClass, BountySet, BungieGroupMember, BungieMember, BungieMemberPlatform, BungieMembership, Character, CharacterStat, CharChecklist, CharChecklistItem, Checklist, ChecklistItem, ClanInfo, ClanMilestoneResult, Const, Currency, CurrentActivity, CurrentPartyActivity, DamageType, DestinyAmmunitionType, EnergyType, InventoryItem, InventoryPlug, InventorySocket, InventoryStat, ItemObjective, ItemState, ItemType, Joinability, MastworkInfo, MilestoneActivity, MileStoneName, MilestoneStatus, Mission, NameDesc, NameQuantity, PathEntry, PGCR, PGCREntry, PGCRExtraData, PGCRTeam, PGCRWeaponData, Player, PrivPublicMilestone, Profile, ProfileTransitoryData, Progression, PublicMilestone, PublicMilestonesAndActivities, Questline, QuestlineStep, Rankup, RecordSeason, SaleItem, Seal, SearchResult, Shared, SpecialAccountProgressions, TAG_WEIGHTS, Target, TriumphCollectibleNode, TriumphNode, TriumphPresentationNode, TriumphRecordNode, UserInfo, Vault, Vendor } from './model';




@Injectable()
export class ParseService {
    MAX_LEVEL = 50;

    ARTIFACT_POINT_PROG_HASH = '2691820383';
    ARTIFACT_POWER_PROG_HASH = '2046159590';

    HIDE_PROGRESSIONS = [
        '3468066401', // The Nine
        '1714509342', // Future War Cult
        '2105209711', // New Monarchy
        '3398051042', // Dead Orbit

    ];

    ACCOUNT_LEVEL = [
        '2126988316', // Obelisk: Mars
        '2468902004', // Obelisk: Nessus
        '3258748553', // Obelisk: Tangled Shore
        // '1482334108', // Leviathan
        '185244751', // Obelisk: EDZ
        // '3468066401', // The Nine
        // '1714509342', // Future War Cult
        // '2105209711', // New Monarchy
        // '3398051042', // Dead Orbit

    ];

    constructor(private destinyCacheService: DestinyCacheService, private lowlineService: LowLineService) {
        this.lowlineService.init();
    }

    private static dedupeArray(arr: any[]): any[] {
        const unique_array = Array.from(new Set(arr));
        return unique_array;
    }

    private parseCharacter(c: PrivCharacter): Character {
        const char: Character = new Character(c.membershipType, c.membershipId,
            this.destinyCacheService.cache.Class[c.classHash].displayProperties.name, c.light, c.characterId);

        char.dateLastPlayed = c.dateLastPlayed;
        char.minutesPlayedThisSession = c.minutesPlayedThisSession;
        char.minutesPlayedTotal = c.minutesPlayedTotal;

        char.emblemBackgroundPath = c.emblemBackgroundPath;
        char.emblemPath = c.emblemPath;
        char.title = '';
        if (c.titleRecordHash != null) {
            const rDesc = this.destinyCacheService.cache.Record[c.titleRecordHash];
            if (rDesc != null) {
                if (rDesc.titleInfo != null) {
                    char.title = rDesc.titleInfo.titlesByGenderHash[c.genderHash];
                } else {
                    char.title = 'Secret';
                }

            }

        }

        char.gender = this.destinyCacheService.cache.Gender[c.genderHash].displayProperties.name;
        char.race = this.destinyCacheService.cache.Race[c.raceHash].displayProperties.name;
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
            if (act.name != null && act.name.trim().length > 0) {
                c.currentActivity = act;
            }
        }
    }

    // Valor and glory have progressions working together
    private parseProgression(p: PrivProgression, desc: any, suppProg?: PrivProgression): Progression {
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
            if (p.progressionHash === +this.ARTIFACT_POINT_PROG_HASH) { name = 'Artifact Points'; }
            if (p.progressionHash === +this.ARTIFACT_POWER_PROG_HASH) { name = 'Artifact Power Bonus'; }


            prog.name = name;
            if ('Resonance Rank' == prog.name) {
                try {
                    if (desc.vendors && desc.vendors.length > 0) {
                        const vendorHash = desc.vendors[0].vendorHash;
                        const vDesc: any = this.destinyCacheService.cache.Vendor[vendorHash];
                        const vName = vDesc.displayProperties.name;
                        if (vName) {
                            prog.name = vName;
                        }
                    }
                } catch (x) {
                    console.dir(x);
                }
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
                prog.currentResetCount = suppProg.currentResetCount;
            }
            return prog;
        } else {
            return null;
        }
    }


    private addPsuedoMilestone(key: string, milestonesByKey: any, milestoneList: MileStoneName[]) {
        if (milestonesByKey[key] == null && key != '534869653') {
            const skipDesc = this.destinyCacheService.cache.Milestone[key];
            if (skipDesc != null && (skipDesc.milestoneType == 3 || skipDesc.milestoneType == 4)) {
                let name = skipDesc.displayProperties.name;
                let descRewards = this.parseMilestoneRewards(skipDesc);
                if (descRewards == null || descRewards.trim().length == 0) {
                    // weekly pinnacle challenge
                    if (key == '3881226684') {
                        name = 'Nightmare Hunt: Master';
                        descRewards = 'Pinnacle Gear';
                    } else if (key == '95049884') { // sundial
                        descRewards = 'Powerful Gear (Tier 2)';

                    } else {
                        descRewards = 'Unknown';
                    }
                }
                const ms2: MileStoneName = {
                    key: skipDesc.hash + '',
                    resets: milestonesByKey['3603098564'].resets, // use weekly clan XP
                    rewards: descRewards,
                    pl: this.parseMilestonePl(descRewards),
                    name: name,
                    desc: skipDesc.displayProperties.description,
                    hasPartial: false
                };
                milestoneList.push(ms2);
                milestonesByKey[ms2.key] = ms2;
            } else if (skipDesc != null) {

            } else {
                console.log('Skipping unknown milestone: ' + key);
            }
        }
    }

    private populateProgressions(c: Character, _prog: any, milestonesByKey: any, milestoneList: MileStoneName[], accountProgressions: Progression[]): void {
        c.milestones = {};
        c.notReady = false;
        if (_prog.milestones != null) {
            if (c.light < 900) {
                c.notReady = true;
            }
            for (const key of Object.keys(_prog.milestones)) {
                const ms: PrivMilestone = _prog.milestones[key];
                // special case for clan rewards
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
                            });
                        }
                    });

                    c.clanMilestones = clanMilestones;
                } else {
                    // add this milestone if not already there
                    this.addPsuedoMilestone(key, milestonesByKey, milestoneList);
                }

                // if they finished all, then force them in anyway

                // nightmare hunt pinnacle
                this.addPsuedoMilestone('3881226684', milestonesByKey, milestoneList);
                // weekly nightmare hunt
                this.addPsuedoMilestone('2246196133', milestonesByKey, milestoneList);
                // weekly strikes
                this.addPsuedoMilestone('1437935813', milestonesByKey, milestoneList);

                // sundial
                this.addPsuedoMilestone('95049884', milestonesByKey, milestoneList);



                let total = 0;
                let complete = 0;
                let phases = [];
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
                            if (q.status.stepObjectives != null) {
                                q.status.stepObjectives.forEach(o => {
                                    const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                                    if (oDesc.completionValue != null && oDesc.completionValue > 0) {
                                        oPct = o.progress / oDesc.completionValue;
                                        if (suppInfo == null && oDesc.completionValue > 1) {
                                            suppInfo = o.progress + ' / ' + oDesc.completionValue;
                                        }
                                    }
                                });
                            }
                        }

                    });
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
                                if (suppInfo == null && oDesc.completionValue > 1) {
                                    suppInfo = obj.progress + ' / ' + oDesc.completionValue;
                                }
                            }
                        }

                    }
                    if (act.phases != null && act.phases.length > 0) {
                        for (const p of act.phases) {

                            phases.push(p.complete);
                            if (p.complete) {
                                complete++;
                            }
                            total++;
                        }
                    }
                }
                if (total === 0) { total++; }
                let pct: number = complete / total;
                if (pct === 0) {
                    pct = oPct;
                }
                if (pct > 0 && pct < 1) {
                    info = Math.floor(100 * pct) + '% complete';
                    if (milestonesByKey[key] != null) {
                        milestonesByKey[key].hasPartial = true;
                    }
                }

                if (phases.length == 0) { phases = null; }
                const m: MilestoneStatus = new MilestoneStatus(key, complete === total, pct, info, suppInfo, phases);
                c.milestones[key] = m;
            }
        }

        const factions: Progression[] = [];
        if (_prog.factions != null) {
            Object.keys(_prog.factions).forEach((key) => {
                const p: PrivProgression = _prog.factions[key];
                const prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Faction[p.factionHash]);
                if (prog != null) {
                    if (this.HIDE_PROGRESSIONS.indexOf(prog.hash) >= 0) {
                        return;
                    }
                    if (this.ACCOUNT_LEVEL.indexOf(prog.hash) < 0) {
                        factions.push(prog);
                    } else {
                        const found = accountProgressions.find(x => x.hash == prog.hash);
                        if (!found) {
                            ParseService.cookAccountProgression(prog);
                            accountProgressions.push(prog);
                        }
                    }

                }

            });
        }
        c.maxLevel = this.MAX_LEVEL;

        // only progression we care about right now are Legend, Glory, Valor, and Season Pass
        if (_prog.progressions) {
            const sp = this.getSeasonProgression();
            Object.keys(_prog.progressions).forEach((key) => {
                if (key === '2626549951' || key === '2000925172' || key === '2772425241'
                    || key == sp.rewardProgressionHash
                    || key == sp.prestigeProgressionHash) {
                    const p: PrivProgression = _prog.progressions[key];
                    let suppProg: PrivProgression = null;
                    if (key === '2626549951') { // VALOR
                        suppProg = _prog.progressions['3882308435'];
                    } else if (key === '2772425241') { // INFAMY is itself
                        suppProg = p;
                    } else if (key === '2000925172') { // GLORY
                        suppProg = _prog.progressions['2679551909'];
                    }
                    let progDesc = this.destinyCacheService.cache.Progression[p.progressionHash];
                    // SEE SEASON PASS TABLE FOR THESE
                    if (key == sp.rewardProgressionHash) { // Season of dawn
                        progDesc = {
                            'displayProperties': {
                                'description': 'Current Season Progress',
                                'displayUnitsName': '',
                                'hasIcon': true,
                                'icon': '/common/destiny2_content/icons/DestinySeasonDefinition_b5a0daa606e06eb6ec2bca66c7572a26.png"',
                                'name': 'Season Rank'
                            }
                        };
                    }
                    if (key == sp.prestigeProgressionHash) { // Season of Dawn prestige
                        progDesc = {
                            'displayProperties': {
                                'description': 'Season Prestige Progress',
                                'displayUnitsName': '',
                                'hasIcon': true,
                                'icon': '/common/destiny2_content/icons/e9a8cf9f7df5b792d34c67df0fc85fe5.png',
                                'name': 'Season Prestige'
                            }
                        };
                    }


                    const prog: Progression = this.parseProgression(p, progDesc, suppProg);
                    if (prog != null) {
                        const found = accountProgressions.find(x => x.hash == prog.hash);
                        if (!found) {
                            ParseService.cookAccountProgression(prog);
                            accountProgressions.push(prog);
                        }
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
        });
        c.factions = factions;
    }

    private static cookAccountProgression(prog: Progression) {
        prog.completeProgress = prog.currentProgress;
        if (!prog.steps || prog.steps.length === 0) {
            return;
        }
        if (prog.currentResetCount == null || prog.currentResetCount == 0) {
            return;
        }
        const resetValue = prog.steps[prog.steps.length - 1].cumulativeTotal;
        prog.completeProgress += prog.currentResetCount * resetValue;
    }

    private getSeasonProgression(): SeasonPass {
        const s: Season = this.destinyCacheService.cache.Season['2007338097'];
        const sp: SeasonPass = this.destinyCacheService.cache.SeasonPass[s.seasonPassHash];
        return sp;
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
            act.teamScore = ParseService.getBasicValue(a.values.teamScore);
            act.kd = ParseService.getBasicValue(a.values.killsDeathsRatio);
            act.completionReason = ParseService.getBasicValue(a.values.completionReason);
            if (desc && desc.isPvP) {
                act.success = act.standing === 0;
            } else {
                act.success = act.completionReason === 0;
            }


        }
        act.isPrivate = a.activityDetails.isPrivate;
        if (desc && desc.isPvP) {
            act.pvType = 'PvP';
        } else {
            act.pvType = 'PvE';
        }

        act.desc = act.mode + ': ' + act.name;
        if (act.isPrivate) {
            act.desc += '(Private)';
        }
        // act.values = a.values;
        // if (!desc) {
        //     console.dir(act);
        // }

        return act;

    }

    private parseModifier(hash: string): NameDesc {
        const jDesc = this.destinyCacheService.cache.ActivityModifier[hash];
        let name: string = null;
        let desc: string = null;
        let icon: string = null;
        if (jDesc != null) {
            name = jDesc.displayProperties.name;
            desc = jDesc.displayProperties.description;
            icon = jDesc.displayProperties.icon;
        }
        if (name != null && name !== '' && name !== 'Classified') {
            return new NameDesc(name, desc, icon, hash);
        }
        return new NameDesc('Classified', 'Keep it secret, keep it safe');
    }

    public static mergeAggHistory2(charAggHistDicts: { [key: string]: AggHistoryEntry }[], nf: Mission[]): AggHistoryEntry[] {
        const returnMe: AggHistoryEntry[] = [];
        let aKeys = [];
        for (const c of charAggHistDicts) {
            if (c != null) {
                aKeys = aKeys.concat(Object.keys(c));
            }
        }
        aKeys = ParseService.dedupeArray(aKeys);

        const nfHashes = [];
        const nfDict = {};
        for (const n of nf) {
            nfHashes.push(n.hash);
            nfDict[n.hash] = {
                found: false,
                mission: n
            };
        }

        for (const key of aKeys) {
            let model: AggHistoryEntry = null;
            for (const c of charAggHistDicts) {
                if (c == null) {
                    continue;
                }
                if (c[key] == null) {
                    continue;
                } if (model == null) {
                    model = c[key];
                } else {
                    model = ParseService.mergeAggHistoryEntry(model, c[key]);
                }
            }
            if (model != null) {
                if (model.type == 'nf') {
                    const match = nfHashes.filter(x => model.hash.includes(x));
                    for (const m of match) {
                        nfDict[m].found = true;
                    }
                    model.special = match.length > 0;

                }
                const nfPrefix = 'Nightfall: ';
                if (model.name.startsWith(nfPrefix)) {
                    model.name = model.name.substr(nfPrefix.length);
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
                model.hash = ParseService.dedupeArray(model.hash);
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
                    activityBestSingleGameScore: null,
                    fastestCompletionMsForActivity: null,
                    activityCompletions: 0,
                    charCompletions: [],
                    activityKills: null,
                    activityAssists: null,
                    activityDeaths: null,
                    activityPrecisionKills: null,
                    activitySecondsPlayed: null,
                    efficiency: null
                };
                returnMe.push(addMe);

            }
        }
        returnMe.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            } else if (a.name < b.name) {
                return -1;
            } else {
                return 0;
            }
        });
        return returnMe;

    }

    public parseAggHistory2(char: Character, resp: any): { [key: string]: AggHistoryEntry } {
        if (resp.activities == null) {
            return;
        }

        const dict: { [key: string]: AggHistoryEntry } = {};
        for (const a of resp.activities) {
            if (!a.activityHash) { continue; }
            const vDesc: any = this.destinyCacheService.cache.Activity[a.activityHash];
            if (vDesc == null || (vDesc.activityModeHashes == null) && vDesc.activityTypeHash == null) { continue; }
            const name = vDesc.displayProperties.name;
            if (name == null) {
                continue;
            }

            const nf = ParseService.isActivityType(vDesc, 547513715) && vDesc.tier >= 2;
            const raid = ParseService.isActivityType(vDesc, 2043403989);
            if (nf || raid) {
                const entry = this.parseAggHistoryEntry(char, name, a, nf ? 'nf' : 'raid');
                if (dict[name] == null) {
                    dict[name] = entry;
                } else {
                    dict[name] = ParseService.mergeAggHistoryEntry(dict[name], entry);
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
        let fastest: number = null;
        if (a.fastestCompletionMsForActivity && b.fastestCompletionMsForActivity) {
            fastest = Math.min(a.fastestCompletionMsForActivity, b.fastestCompletionMsForActivity);
        } else if (a.fastestCompletionMsForActivity) {
            fastest = a.fastestCompletionMsForActivity;
        } else if (a.fastestCompletionMsForActivity) {
            fastest = b.fastestCompletionMsForActivity;
        }
        const timePlayed = a.activitySecondsPlayed + b.activitySecondsPlayed;
        const efficiency = 0;
        if (timePlayed == 0) {

        }
        const charCompDict = {};

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
            fastestCompletionMsForActivity: fastest,
            activityCompletions: a.activityCompletions + b.activityCompletions,
            charCompletions: charCompletions,
            activityKills: a.activityKills + b.activityKills,
            activityAssists: a.activityAssists + b.activityAssists,
            activityDeaths: a.activityDeaths + b.activityDeaths,
            activityPrecisionKills: a.activityPrecisionKills + b.activityPrecisionKills,
            activitySecondsPlayed: timePlayed,
            efficiency: 0
        };
        ParseService.setEfficiency(returnMe);
        return returnMe;
    }

    private parseAggHistoryEntry(char: Character, name: string, a: any, type: string): AggHistoryEntry {
        let fastest = ParseService.getBasicValue(a.values.fastestCompletionMsForActivity);
        if (fastest == 0) {
            fastest = null;
        }
        const total = ParseService.getBasicValue(a.values.activityCompletions);

        const returnMe: AggHistoryEntry = {
            name: name,
            type,
            hash: [a.activityHash],
            activityBestSingleGameScore: ParseService.getBasicValue(a.values.activityBestSingleGameScore),
            fastestCompletionMsForActivity: fastest,
            activityCompletions: total,
            charCompletions: [{
                char: char,
                count: total
            }],
            activityKills: ParseService.getBasicValue(a.values.activityKills),
            activityAssists: ParseService.getBasicValue(a.values.activityAssists),
            activityDeaths: ParseService.getBasicValue(a.values.activityDeaths),

            activityPrecisionKills: ParseService.getBasicValue(a.values.activityPrecisionKills),
            activitySecondsPlayed: ParseService.getBasicValue(a.values.activitySecondsPlayed),
            efficiency: 0
        };
        ParseService.setEfficiency(returnMe);
        return returnMe;
    }

    private groupBounties(type: string, bounties: SaleItem[] | InventoryItem[]): BountySet[] {
        const tags = this.destinyCacheService.cache.PursuitTags!;
        const tagSet: { [key: string]: (SaleItem | InventoryItem)[] } = {};
        const used = {};
        for (const s of bounties) {
            if (!tags[s.hash]) {
                continue;
            }
            // don't double count bounties, werner-99 has an issue with this
            if (used[s.hash]) {
                continue;
            }
            // ignore expired bounties
            if ((s as InventoryItem).expired) {
                continue;
            }
            used[s.hash] = true;
            const itemTags = tags[s.hash];
            s.tags = itemTags.slice(0);
            for (const t of itemTags) {
                if (!tagSet[t]) {
                    tagSet[t] = [];
                }
                tagSet[t].push(s);
            }
        }
        const returnMe: BountySet[] = [];
        for (const key of Object.keys(tagSet)) {
            let score = tagSet[key].length;
            if (TAG_WEIGHTS[key]) {
                score *= TAG_WEIGHTS[key];
            }
            returnMe.push({
                type: type,
                tag: key,
                bounties: tagSet[key],
                score: score
            });
        }
        returnMe.sort((a, b) => {
            if (a.score > b.score) {
                return -1;
            } else if (a.score < b.score) {
                return 1;
            }
            if (a.tag < b.tag) {
                return -1;
            }
            if (b.tag < a.tag) {
                return 1;
            }
            return 0;
        });
        return returnMe;
    }

    public buildShoppingList(tracked: { [key: string]: boolean }, bountySets: BountySet[]): SaleItem[] {
        if (!tracked) {
            return [];
        }
        if (bountySets.length == 0 || bountySets == null) {
            return [];
        }
        const used = {};
        const returnMe: SaleItem[] = [];
        for (const bountySet of bountySets) {
            for (const bounty of bountySet.bounties) {
                if (tracked[bounty.hash] && !used[bounty.hash]) {
                    returnMe.push(bounty as SaleItem);
                    used[bounty.hash] = true;
                }
            }
        }
        returnMe.sort((a, b) => {
            if (a.vendor.name > b.vendor.name) {
                return 1;
            }
            if (a.vendor.name < b.vendor.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
        });
        // we can use used to prune missing entries
        return returnMe;
    }

    public groupCharBounties(player: Player, char: Character): BountySet[] {
        const bounties = [];
        for (const i of player.bounties) {
            if (i.owner.getValue().id === char.id) {
                bounties.push(i);
            }
        }
        return this.groupBounties('held', bounties);
    }

    public groupVendorBounties(resp: any): BountySet[] {
        let saleItems = this.parseVendorData(resp);
        saleItems = saleItems.filter(x => x.status != 'Already completed');
        return this.groupBounties('sale', saleItems);
    }

    public applyTags(items: SaleItem[]) {
        const tags = this.destinyCacheService.cache.PursuitTags!;
        const used = {};
        for (const s of items) {
            if (!tags[s.hash]) {
                continue;
            }
            // don't double count bounties, werner-99 has an issue with this
            if (used[s.hash]) {
                continue;
            }
            used[s.hash] = true;
            const itemTags = tags[s.hash];
            s.tags = itemTags.slice(0);
        }
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
        if (resp.vendors.data[vendorKey] == null) {
            // vendor isn't here right now;
            return [];
        }
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
                if (iDesc.sockets == null) {
                    continue;
                }
                const socketTemplate = iDesc.sockets.socketEntries[cntr];

                if (socketTemplate != null) {

                    // 2846385770
                    if (socketTemplate.reusablePlugItems != null && socketTemplate.reusablePlugItems.length > 0) {
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
                            rolledPerks.push(perkSet);
                        }
                    }

                    if (socketTemplate.randomizedPlugItems != null && socketTemplate.randomizedPlugItems.length > 0) {
                        const perkSet = [];
                        if (socketVal.reusablePlugs != null) {

                            // TODO fix this? might be ok, need to wait on xur, or do we even care about perks on vendor guns anymore?
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
                        hash: val.itemHash,
                        name: valDesc.displayProperties.name,
                        quantity: val.quantity
                    });
                    searchText += valDesc.displayProperties.name + ' ';
                }

            }
        }

        let itemType = iDesc.itemType;
        if (iDesc.itemType === ItemType.Mod && iDesc.itemTypeDisplayName.indexOf('Mod') >= 0) {
            itemType = ItemType.GearMod;
        } else if (iDesc.itemType === ItemType.Dummy && iDesc.itemTypeDisplayName.indexOf('Forge Vessel') >= 0) {
            itemType = ItemType.ForgeVessel;
        } else if (iDesc.itemType === ItemType.None && iDesc.itemTypeDisplayName != null && iDesc.itemTypeDisplayName.endsWith('Bounty')) {
            itemType = ItemType.Bounty;
        } else if (iDesc.itemType === ItemType.None && iDesc.itemTypeDisplayName == 'Invitation of the Nine') {
            itemType = ItemType.Bounty;
        }


        searchText += iDesc.displayProperties.name + ' ';
        searchText += vendor.name + ' ';
        if (vendor.hash === '2190858386') {
            searchText += 'Xur ';
        }
        searchText += iDesc.itemTypeAndTierDisplayName + ' ';

        return {
            vendor: vendor,
            hash: i.itemHash,
            name: iDesc.displayProperties.name,
            desc: iDesc.displayProperties.description,
            icon: iDesc.displayProperties.icon,
            type: itemType,
            tierType: iDesc.customTierType != null ? iDesc.customTierType : -1,
            status: this.parseSaleItemStatus(i.saleStatus),
            itemTypeAndTierDisplayName: iDesc.itemTypeAndTierDisplayName,
            itemTypeDisplayName: iDesc.itemTypeDisplayName,
            quantity: i.quantity,
            objectives: objectives,
            rolledPerks: rolledPerks,
            values: values,
            costs: costs,
            searchText: searchText.toLowerCase()
        };
    }

    private parseSaleItemStatus(s: number): string {
        if ((s & 8) > 0) {
            return 'Already completed';
        } else if ((s & 32) > 0) {
            return 'Not for sale right now';
        } else if ((s & 64) > 0) {
            return 'Not available';
        } else if ((s & 128) > 0) {
            return 'Already held';
        }
        return null;
    }

    private parseMilestoneRewards(desc: any): string {
        if (desc == null) { return ''; }
        let rewards = '';
        let rewCnt = 0;
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
                                    if (reI.quantity > 1) {
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
        return rewards;
    }

    private parseMilestonePl(rewards: string): number {
        let pl = Const.UNKNOWN_BOOST;
        if (rewards) {
            if (rewards.startsWith('Powerful')) {
                if (rewards.endsWith('2)')) {
                    pl = Const.MID_BOOST;

                } else {
                    pl = Const.LOW_BOOST;
                }
            } else if (rewards.startsWith('Pinnacle')) {
                pl = Const.HIGH_BOOST;

            } else if (rewards.startsWith('Legendary')) {
                pl = Const.NO_BOOST;
            }
        }
        return pl;
    }

    private static hasChallenge(act: any, hash: string): boolean {
        if (!act.challenges) { return false; }
        if (!act.challenges.length) { return false; }
        for (const c of act.challenges) {
            if (c.objective && c.objective.objectiveHash == hash) {
                return true;
            }
        }
        return false;
    }

    private buildMilestoneActivity(aa: any): MilestoneActivity {
        const desc: any = this.destinyCacheService.cache.Activity[aa.activityHash];
        if (!desc || !desc.displayProperties || !desc.displayProperties.name) {
            return null;
        }
        const modifiers: NameDesc[] = [];
        if (aa.modifierHashes && aa.modifierHashes.length > 0) {
            for (const modHash of aa.modifierHashes) {
                const mod: NameDesc = this.parseModifier(modHash);
                modifiers.push(mod);
            }
        }
        const msa: MilestoneActivity = {
            hash: aa.activityHash,
            name: desc.displayProperties.name,
            desc: desc.displayProperties.description,
            ll: aa.recommendedLight,
            tier: aa.difficultyTier,
            icon: desc.displayProperties.icon,
            modifiers: modifiers
        };
        return msa;
    }

    private addNightmareLoot(msa: MilestoneActivity) {
        let lootHash = null;
        if (msa.name.indexOf('Insanity') >= 0) {
            lootHash = '3690523502'; // love and death
        } else if (msa.name.indexOf('Rage') >= 0) {
            lootHash = '1016668089'; // one small step
        } else if (msa.name.indexOf('Servitude') >= 0) {
            lootHash = '2931957300'; // Dream breaker
        } else if (msa.name.indexOf('Pride') >= 0) {
            lootHash = '760455599'; // helmet
        } else if (msa.name.indexOf('Isolation') >= 0) {
            lootHash = '2874010934'; // Gauntlets
        } else if (msa.name.indexOf('Fear') >= 0) {
            lootHash = '2568538788'; // chest
        } else if (msa.name.indexOf('Anguish') >= 0) {
            lootHash = '4086393232'; // lets
        } else if (msa.name.indexOf('Despair') >= 0) {
            lootHash = '3312368889'; // class
        }
        if (lootHash) {
            msa.specialLoot = this.destinyCacheService.cache.InventoryItem[lootHash];
        }
    }

    private addNightfallLoot(msa: MilestoneActivity) {
        let lootHash = null;
        if (msa.name.indexOf('Lake of Shadows') >= 0) {
            lootHash = '3745974521'; // Militia's birthright
        } else if (msa.name.indexOf('Savathûn\'s Song') >= 0) {
            lootHash = '1457979868'; // Duty Bound
        } else if (msa.name.indexOf('Garden World') >= 0) {
            lootHash = '1174053886'; // Universal Wavefunction
        } else if (msa.name.indexOf('Arms Dealer') >= 0) {
            lootHash = '2757144092'; // The	Tilt Fuse
        } else if (msa.name.indexOf('Corrupted') >= 0) {
            lootHash = '1071542914'; // Horror's Least
        } else if (msa.name.indexOf('Exodus Crash') >= 0) {
            lootHash = '2757144093'; // Impact Velocity
        } else if (msa.name.indexOf('Hollowed Lair') >= 0) {
            lootHash = '4117693024'; // Mindbender's Amibition
        } else if (msa.name.indexOf('Insight Terminus') >= 0) {
            lootHash = '2154059444'; // Long Goodbye
        } else if (msa.name.indexOf('Inverted Spire') >= 0) {
            lootHash = '953357968'; // Trichromatic
        } else if (msa.name.indexOf('Pyramidion') >= 0) {
            lootHash = '990416096'; // Silicon Neuroma
        } else if (msa.name.indexOf('Savathun’s Song') >= 0) {
            lootHash = '1457979868'; // Duty Bound
        } else if (msa.name.indexOf('Strange Terrain') >= 0) {
            lootHash = '1929278169'; // Braytech Osprey
        } else if (msa.name.indexOf('Tree of Probabilities') >= 0) {
            lootHash = '4238497225'; // D.F.A.
        } else if (msa.name.indexOf('Warden of Nothing') >= 0) {
            lootHash = '233423981'; // Warden's Law
        } else if (msa.name.indexOf('Will of the Thousands') >= 0) {
            lootHash = '1311389413'; // Worm God Incarnation
        }
        if (lootHash) {
            msa.specialLoot = this.destinyCacheService.cache.InventoryItem[lootHash];
        }
    }

    public parsePublicMilestones(resp: any, profileCharAct: any): PublicMilestonesAndActivities {
        const msMilestones: PrivPublicMilestone[] = [];
        const returnMe: PublicMilestone[] = [];
        Object.keys(resp).forEach(key => {
            const ms: any = resp[key];
            msMilestones.push(ms);
        });
        let sample: PublicMilestone = null;
        for (const ms of msMilestones) {
            let activityRewards = '';
            const desc = this.destinyCacheService.cache.Milestone[ms.milestoneHash];
            if (desc == null) {
                continue;
            }
            // skip broken Garden of Salvation
            if (ms.milestoneHash == 2712317338 && desc.displayProperties.name.startsWith('###')) {
                continue;
            }
            let icon = desc.displayProperties.icon;
            const activities: MilestoneActivity[] = [];
            if (ms.activities != null) {
                for (const act of ms.activities) {
                    const aDesc = this.destinyCacheService.cache.Activity[act.activityHash];
                    const modifiers: NameDesc[] = [];
                    if (act.modifierHashes != null && act.modifierHashes.length > 0) {
                        for (const n of act.modifierHashes) {
                            const mod: NameDesc = this.parseModifier(n);
                            modifiers.push(mod);
                        }
                    }
                    if (activityRewards == null && aDesc.rewards != null && aDesc.rewards.length > 0 && aDesc.rewards[0].rewardItems.length > 0) {
                        const rewDesc: any = this.destinyCacheService.cache.InventoryItem[aDesc.rewards[0].rewardItems[0].itemHash];
                        if (rewDesc != null) {
                            activityRewards = rewDesc.displayProperties.name;
                        }
                    }
                    activities.push({
                        hash: act.activityHash,
                        name: aDesc.displayProperties.name,
                        desc: aDesc.displayProperties.description,
                        ll: aDesc.activityLightLevel,
                        tier: aDesc.tier,
                        icon: aDesc.displayProperties.icon,
                        modifiers: modifiers
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
                                        activityRewards += rewDesc.displayProperties.name;
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
                            modifiers: []
                        });
                    }
                }
            }


            const dAct = {};

            for (const a of activities) {
                const key = a.name + ' ' + a.modifiers.length;
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
                aggAct.lls = ParseService.dedupeArray(aggAct.lls);
                if (aggAct.activity.modifiers.length > 0) {
                    nothingInteresting = false;
                }
                aggActivities.push(aggAct);
            }
            aggActivities.sort(function (a, b) {
                return a.activity.ll - b.activity.ll;
            });


            let summary = null;
            if (nothingInteresting && aggActivities.length > 0 && aggActivities.length < 2) {
                summary = '';
                for (const a of aggActivities) {
                    summary += a.activity.name + ' ';
                }
            }

            const descRewards = this.parseMilestoneRewards(desc);
            let rewards = '';
            if (descRewards && descRewards.trim().length > 0) {
                rewards = descRewards;
            } else if (activityRewards && activityRewards.trim().length > 0) {
                rewards = activityRewards;
            } else {
                let checkMe = '' + desc.displayProperties.name + desc.displayProperties.description;
                checkMe = checkMe.toLowerCase();
                if (checkMe.indexOf('raid') >= 0) {
                    rewards = 'Legendary Gear';
                } else {
                    rewards = '???';
                }
            }
            // garden of salvation
            if (ms.milestoneHash == 2712317338 && rewards == '???') {
                rewards = 'Pinnacle Gear';
            }
            // // weekly pinnacle challenge, not in list yet, but just in case
            // if (ms.milestoneHash == 3881226684) {
            //     rewards = 'Pinnacle Gear';
            // }
            const pl = this.parseMilestonePl(rewards);
            const sDesc = desc.displayProperties.description;
            const pushMe = {
                hash: ms.milestoneHash + '',
                name: desc.displayProperties.name,
                desc: sDesc,
                start: ms.startDate,
                end: ms.endDate,
                order: ms.order,
                icon: icon,
                activities: activities,
                aggActivities: aggActivities,
                rewards: rewards,
                pl: pl,
                summary: summary,
                milestoneType: desc.milestoneType
            };
            if (pushMe.hash == '4253138191') {
                sample = pushMe;
            }
            returnMe.push(pushMe);
        }
        // we're still missing nightfalls and heroic menagerie and some other fun stuff we need to get from a character
        let charAct = null;
        if (sample && profileCharAct && profileCharAct.characterActivities && profileCharAct.characterActivities.data) {
            charAct = profileCharAct.characterActivities.data['2305843009264730899'];
        }
        const crucibleCore: MilestoneActivity[] = [];
        const crucibleRotator: MilestoneActivity[] = [];
        const nightfalls: MilestoneActivity[] = [];
        const nightmareHunts: MilestoneActivity[] = [];
        let herMenag: MilestoneActivity = null;
        let heroicStrikes: MilestoneActivity = null;
        let reckoning: MilestoneActivity = null;
        let sundialLegend: MilestoneActivity = null;

        if (sample && profileCharAct && profileCharAct.characterActivities && profileCharAct.characterActivities.data) {
            for (const key of Object.keys(profileCharAct.characterActivities.data)) {
                const charAct = profileCharAct.characterActivities.data[key];
                if (charAct && charAct.availableActivities && charAct.availableActivities.length > 0) {
                    if (crucibleCore.length == 0) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if (ParseService.hasChallenge(aa, '3118376466')) { //  455756300
                                if (!msa.icon) {

                                    const labDesc = this.destinyCacheService.cache.Activity['1709912095'];
                                    if (labDesc && labDesc.displayProperties && labDesc.displayProperties.icon) {
                                        msa.icon = labDesc.displayProperties.icon;
                                    }
                                }
                                crucibleCore.push(msa);
                            }
                        }
                    }
                    if (crucibleRotator.length == 0) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if (ParseService.hasChallenge(aa, '1607758693')) { // 978034479
                                crucibleRotator.push(msa);
                            }
                        }
                    }
                    if (nightfalls.length == 0) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if (msa.name.indexOf('Nightfall: ') >= 0) {
                                const desc: any = this.destinyCacheService.cache.Activity[aa.activityHash];
                                if (desc.modifiers.length > 10 && aa.displayLevel >= 50) {
                                    msa.name = msa.name.replace('Nightfall: ', '');
                                    if (msa.name.indexOf('The Ordeal') >= 0) {
                                        msa.name = msa.name.replace('The Ordeal', 'Ordeal');
                                        msa.name = msa.name.replace(': Master', '');
                                        msa.name += ': ' + msa.desc;
                                    }
                                    this.addNightfallLoot(msa);
                                    nightfalls.push(msa);
                                }
                            }

                        }
                    }
                    if (nightmareHunts.length == 0) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if (msa.name.indexOf('Nightmare Hunt: ') >= 0) {
                                const desc: any = this.destinyCacheService.cache.Activity[aa.activityHash];
                                if (desc.modifiers.length > 10 && aa.displayLevel >= 50) {
                                    msa.name = msa.name.replace('Nightmare Hunt: ', '');
                                    msa.name = msa.name.replace(': Master', '');
                                    this.addNightmareLoot(msa);
                                    nightmareHunts.push(msa);
                                }
                            }
                        }
                    }
                    if (herMenag == null) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if (msa.name.indexOf('The Menagerie (Heroic)') >= 0) {
                                herMenag = msa;
                            }
                        }
                    }
                    if (heroicStrikes == null) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if (msa.hash == '4252456044') {
                                heroicStrikes = msa;
                            }
                        }
                    }
                    if (reckoning == null) {
                        for (const aa of charAct.availableActivities) {
                            const msa = this.buildMilestoneActivity(aa);
                            if (msa == null) {
                                continue;
                            }
                            if ('1446606128' == aa.activityHash) {
                                reckoning = msa;
                            }
                        }
                    }
                    if (sundialLegend == null) {
                        for (const aa of charAct.availableActivities) {
                            if ('3611556688' == aa.activityHash) {
                                const msa = this.buildMilestoneActivity(aa);
                                if (msa == null) {
                                    continue;
                                }
                                sundialLegend = msa;
                            }
                        }
                    }
                }

            }
        }
        returnMe.sort((a, b) => {
            if (a.pl < b.pl) { return 1; }
            if (a.pl > b.pl) { return -1; }
            if (a.rewards < b.rewards) { return 1; }
            if (a.rewards > b.rewards) { return -1; }
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });

        let flashpoint: string = null;
        let weekStart: moment.Moment = null;

        // grab special milestones to have them for the home screen and such
        for (const m of returnMe) {

            if ('463010297' === m.hash) {
                let name = m.summary;
                name = name.replace('FLASHPOINT: ', '');
                name = name.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
                flashpoint = name;
                weekStart = moment(m.start);
            }
        }

        return {
            publicMilestones: returnMe,
            crucibleCore: crucibleCore,
            crucibleRotator: crucibleRotator,
            herMenag: herMenag,
            heroicStrikes: heroicStrikes,
            reckoning: reckoning,
            sundial: sundialLegend,
            nightfalls: nightfalls,
            nightmareHunts: nightmareHunts,
            flashpoint: flashpoint,
            weekStart: weekStart
        };
    }

    public parseActivities(a: any[]): Activity[] {
        const returnMe: any[] = [];
        a.forEach((act) => {
            const parsed = this.parseActivity(act);
            if (parsed != null) {
                returnMe.push(parsed);
            }
        });
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
                };

                checklists.push(checklist);
            });
        }
        return checklists;
    }

    private getSpecificCharProg(resp: any, chars: Character[], hash: string) {
        if (resp.characterProgressions && resp.characterProgressions.data && chars && chars.length > 0) {
            for (const char of chars) {
                const charProg = resp.characterProgressions.data[char.characterId];
                if (charProg && charProg.progressions && charProg.progressions[hash]) {
                    return charProg.progressions[hash];
                }
            }
        }
        return null;
    }
    private parseArtifactProgressions(resp: any, chars: Character[], accountProgressions: Progression[]): number {
        if (resp.profileProgression == null || resp.profileProgression.data == null
            || resp.profileProgression.data.seasonalArtifact == null) {
            return null;
        }
        const _art = resp.profileProgression.data.seasonalArtifact;

        let pointProg = _art.pointProgression;
        if (pointProg == null) {
            pointProg = this.getSpecificCharProg(resp, chars, this.ARTIFACT_POINT_PROG_HASH);
            if (pointProg == null) {
                console.log('doh');
                return null;
            }
        }
        let powerProg = _art.powerBonusProgression;
        if (powerProg == null) {
            powerProg = this.getSpecificCharProg(resp, chars, this.ARTIFACT_POWER_PROG_HASH);
            if (powerProg == null) {
                console.log('doh');
                return null;
            }
        }

        let parsedProg: Progression = this.parseProgression(pointProg,
            this.destinyCacheService.cache.Progression[pointProg.progressionHash], pointProg);
        if (parsedProg != null) {
            accountProgressions.push(parsedProg);
        }
        parsedProg = this.parseProgression(powerProg,
            this.destinyCacheService.cache.Progression[powerProg.progressionHash], powerProg);
        if (parsedProg != null) {
            accountProgressions.push(parsedProg);
        }
        // return _art.powerBonus;
        return powerProg.level;

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
                        if (desc == null) {
                            return;
                        }

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
                            };
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
                                    oncePerAccount: (hash === 844419501 || hash === 1942564430) ? true : false,
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
                        };
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

    private buildBadge(node: TriumphNode): Badge {
        const pDesc = this.destinyCacheService.cache.PresentationNode[node.hash];
        if (pDesc == null) { return null; }
        const badgeClasses: BadgeClass[] = [];
        let badgeComplete = false;
        let bestProgress = 0;
        let total = 0;
        for (const c of node.children) {
            let complete = 0;
            for (const coll of c.children) {
                const co = coll as TriumphCollectibleNode;
                if (co.acquired) {
                    complete++;
                }
            }
            if (complete > bestProgress) {
                bestProgress = complete;
                total = c.children.length;
            }
            badgeClasses.push({
                hash: c.hash,
                name: c.name,
                complete: complete,
                total: c.children.length,
                children: c.children as TriumphCollectibleNode[]
            });
            badgeComplete = badgeComplete || complete === c.children.length;
        }
        return {
            hash: node.hash,
            name: node.name,
            desc: node.desc,
            icon: node.icon,
            complete: badgeComplete,
            bestProgress: bestProgress,
            total: total,
            percent: 100 * bestProgress / (total ? total : 1),
            classes: badgeClasses
        };
    }

    private buildSeal(node: TriumphNode, badges: Badge[]): Seal {
        const pDesc = this.destinyCacheService.cache.PresentationNode[node.hash];
        if (pDesc == null) { return null; }
        const completionRecordHash = pDesc.completionRecordHash;
        const cDesc = this.destinyCacheService.cache.Record[completionRecordHash];
        if (cDesc == null) { return null; }
        let title = 'Secret';
        if (cDesc.titleInfo != null) {
            title = cDesc.titleInfo.titlesByGenderHash[2204441813];
        }
        let progress = 0;
        for (const c of node.children) {
            if (c.complete) {
                progress++;
            }
            const trn = c as TriumphRecordNode;
            if (trn.pointsToBadge === true) {
                for (const b of badges) {
                    if (b.name === trn.name) {
                        trn.badge = b;
                    } else if (trn.hash == '52802522' && b.hash == '2759158924') {
                        trn.badge = b;
                    }
                }
            }
        }
        const percent = Math.floor((100 * progress) / node.children.length);
        return {
            hash: node.hash,
            name: node.name,
            desc: node.desc,
            icon: node.icon,
            children: node.children,
            title: title,
            percent: percent,
            progress: progress,
            complete: progress >= node.children.length,
            completionValue: node.children.length
        };
    }



    private handleChalice(char: Character, chalice: InventoryItem, milestoneList: MileStoneName[], milestonesByKey: { [id: string]: MileStoneName }, currencies: Currency[]) {

        let imperials: number;
        let powerfulDropsRemaining: number;
        let perfected = false;
        if (chalice.sockets != null && chalice.sockets.length > 0) {
            const lastSocket = chalice.sockets[chalice.sockets.length - 1];
            if (lastSocket.plugs != null && lastSocket.plugs.length == 1) {
                perfected = lastSocket.plugs[0].enabled;
            }
        }


        // TODO fix this item objective
        for (const obj of chalice.objectives) {
            if (obj.progressDescription.indexOf('rewards') > 0) {
                powerfulDropsRemaining = obj.progress;
            }
            if (obj.progressDescription === 'Imperials') {
                imperials = obj.progress;
            }
        }

        if (char != null) {
            if (milestonesByKey[Const.CHALICE_KEY] == null) {
                const reward = 'Legendary Gear';
                const ms: MileStoneName = {
                    key: Const.CHALICE_KEY,
                    resets: char.endWeek.toISOString(),
                    rewards: reward,
                    pl: this.parseMilestonePl(reward),
                    name: 'Menagerie',
                    desc: 'Pleasure and delight await you. Your chalice gives a fixed number of powerful drops per week.',
                    hasPartial: false,
                    suppInfo: !perfected ? imperials + ' Imperials' : 'Perfected'
                };
                milestoneList.push(ms);
                milestonesByKey[Const.CHALICE_KEY] = ms;
            }
            // constructor(hash, complete, pct, info, suppInfo, phases) {
            const complete = powerfulDropsRemaining === 0;
            char.milestones[Const.CHALICE_KEY] = new MilestoneStatus(Const.CHALICE_KEY, complete, complete ? 1 : 0, null, complete ? null : powerfulDropsRemaining + ' left', null);
        }

    }

    public parsePlayer(resp: any, publicMilestones: PublicMilestone[], detailedInv?: boolean, showZeroPtTriumphs?: boolean, showInvisTriumphs?: boolean): Player {
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
        const accountProgressions: Progression[] = [];
        const milestoneList: MileStoneName[] = [];
        let currentActivity: CurrentActivity = null;
        const chars: Character[] = [];
        let hasWellRested = false;
        let weekEnd: string = null;

        const milestonesByKey: { [id: string]: MileStoneName } = {};
        if (publicMilestones != null) {
            for (const p of publicMilestones) {
                // things to skip
                if (
                    '534869653' === p.hash ||   // xur
                    '4253138191' === p.hash ||  // weekly clan engrams
                    p.milestoneType == 5 || // special
                    p.type != null   // fake milestones
                ) {
                    if ('4253138191' === p.hash) {
                        weekEnd = p.end;
                    }

                    continue;
                }
                try {
                    p.end = new Date(p.end).toISOString();
                } catch (e) {
                    p.end = null;
                }
                const ms: MileStoneName = {
                    key: p.hash + '',
                    resets: p.end,
                    rewards: p.rewards,
                    pl: p.pl,
                    name: p.summary == null ? p.name : p.summary,
                    desc: p.desc,
                    hasPartial: false
                };
                // Fix heroic adventures
                if (ms.resets === '1970-01-01T00:00:00.000Z') {
                    ms.resets = null;
                }
                milestoneList.push(ms);
            }

            // // add crown of sorrows manually
            // if (milestonesByKey['2590427074'] == null) {
            //     const raidDesc = this.destinyCacheService.cache.Milestone['2590427074'];
            //     const ms: MileStoneName = {
            //         key: raidDesc.hash + '',
            //         resets: weekEnd,
            //         rewards: 'Powerful Gear',
            //         pl: Const.HIGHEST_BOOST,
            //         name: raidDesc.displayProperties.name,
            //         neverDisappears: true,
            //         desc: raidDesc.displayProperties.description,
            //         hasPartial: false
            //     };
            //     milestoneList.push(ms);
            //     milestonesByKey[ms.key] = ms;
            // }
            // add Last wish if its missing, as it has been from public milestones for a while
            // if (milestonesByKey['3181387331'] == null) {
            //     const raidDesc = this.destinyCacheService.cache.Milestone['3181387331'];
            //     const ms: MileStoneName = {
            //         key: raidDesc.hash + '',
            //         resets: weekEnd,
            //         rewards: 'Powerful Gear',
            //         pl: Const.LOW_BOOST,
            //         name: raidDesc.displayProperties.name,
            //         desc: raidDesc.displayProperties.description,
            //         hasPartial: false
            //     };
            //     milestoneList.push(ms);
            //     milestonesByKey[ms.key] = ms;
            // }
            for (const milestone of milestoneList) {
                milestonesByKey[milestone.key] = milestone;
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
                    // load progs for chars
                    for (const key of Object.keys(oProgs)) {
                        const curChar: Character = charsDict[key];
                        this.populateProgressions(curChar, oProgs[key], milestonesByKey, milestoneList, accountProgressions);
                        hasWellRested = curChar.wellRested || hasWellRested;
                    }

                    // do a second pass for any missing milestones
                    for (const key of Object.keys(oProgs)) {
                        const c: Character = charsDict[key];
                        for (const key of Object.keys(milestonesByKey)) {
                            if (c.milestones[key] == null) {
                                const placeholder: MilestoneStatus = new MilestoneStatus(key, true, 1, null, null, [], c.notReady);
                                c.milestones[key] = placeholder;
                            }
                        }
                    }



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
                    let lastActKey = null;
                    for (const key of Object.keys(oActs)) {
                        const val = oActs[key];
                        if (lastActKey == null) {
                            lastActKey = key;
                        } else if (val.dateActivityStarted > oActs[lastActKey].dateActivityStarted) {
                            lastActKey = key;
                        }
                    }
                    if (lastActKey != null) {
                        const curChar: Character = charsDict[lastActKey];
                        this.populateActivities(curChar, oActs[lastActKey]);
                        currentActivity = curChar.currentActivity;
                    }
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
        const seals: Seal[] = [];
        const badges: Badge[] = [];
        const seasons: RecordSeason[] = [];
        let lowHangingTriumphs: TriumphRecordNode[] = [];
        let searchableTriumphs: TriumphRecordNode[] = [];
        let searchableCollection: TriumphCollectibleNode[] = [];
        const dictSearchableTriumphs: any = {};

        let colTree = [];
        let triumphScore = null;
        const currencies: Currency[] = [];
        const rankups: Rankup[] = [];
        const bounties: InventoryItem[] = [];
        const quests: InventoryItem[] = [];
        let privateGear = true;
        const gear: InventoryItem[] = [];
        let checklists: Checklist[] = [];

        let charChecklists: CharChecklist[] = [];
        let vault: Vault = null;
        let shared: Shared = null;
        let hasHiddenClosest = false;
        let artifactPowerBonus = 0;

        if (!superprivate) {
            checklists = this.parseProfileChecklists(resp);
            charChecklists = this.parseCharChecklists(resp, chars);
            artifactPowerBonus = this.parseArtifactProgressions(resp, chars, accountProgressions);
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
            vault = new Vault();
            shared = new Shared();

            if (resp.characterInventories != null && resp.characterInventories.data != null) {
                privateGear = false;
                Object.keys(resp.characterInventories.data).forEach((key) => {
                    const char: Character = charsDict[key];
                    const options: Target[] = chars.filter(c => c !== char);
                    options.push(vault);
                    const items: PrivInventoryItem[] = resp.characterInventories.data[key].items;
                    items.forEach(itm => {
                        const parsed: InventoryItem = this.parseInvItem(itm, char, resp.itemComponents, detailedInv, options, resp.characterProgressions);
                        if (parsed != null) {
                            // don't deal with chalice if there are no milestones
                            if (parsed.type === ItemType.Chalice && resp.characterProgressions) {
                                this.handleChalice(char, parsed, milestoneList, milestonesByKey, currencies);
                            } else if (parsed.type === ItemType.Bounty || parsed.type === ItemType.ForgeVessel) {
                                // ignore expired
                                if (!parsed.expired) {
                                    parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                                    bounties.push(parsed);
                                }
                            } else if (parsed.type === ItemType.Quest || parsed.type === ItemType.QuestStep) {
                                parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                                quests.push(parsed);
                            } else {
                                if (parsed.objectives && parsed.objectives.length > 0) {
                                    parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                                    quests.push(parsed);


                                }
                                gear.push(parsed);
                            }
                        }
                    });
                });
            }
            if (detailedInv === true) {
                if (resp.characterEquipment != null && resp.characterEquipment.data != null) {
                    Object.keys(resp.characterEquipment.data).forEach((key) => {
                        const char: Character = charsDict[key];
                        const options: Target[] = chars.filter(c => c !== char);
                        options.push(vault);
                        const items: PrivInventoryItem[] = resp.characterEquipment.data[key].items;
                        items.forEach(itm => {
                            const parsed: InventoryItem = this.parseInvItem(itm, char, resp.itemComponents, detailedInv, options, null);
                            if (parsed != null) {
                                gear.push(parsed);
                            }
                        });
                    });

                }
                if (resp.profileInventory != null && resp.profileInventory.data != null) {
                    const items: PrivInventoryItem[] = resp.profileInventory.data.items;
                    items.forEach(itm => {

                        // shared inv bucket from "Vault"
                        let owner = vault;
                        let options: Target[];
                        if (itm.bucketHash != 138197802) {
                            owner = shared;
                            options = [vault];
                        } else {
                            options = [shared];
                        }
                        const parsed: InventoryItem = this.parseInvItem(itm, owner, resp.itemComponents, detailedInv, options, null);
                        if (parsed != null) {
                            if (parsed.type == ItemType.Weapon || parsed.type == ItemType.Armor || parsed.type == ItemType.Ghost || parsed.type == ItemType.Vehicle || parsed.type == ItemType.Subclass) {
                                parsed.options.pop();
                                for (const c of chars) {
                                    parsed.options.push(c);
                                }

                            }
                            gear.push(parsed);
                        }
                    });
                }
            }
            const nodes: any[] = [];
            const records: any[] = [];
            const collections: any[] = [];
            if (resp.profileRecords != null) {
                triumphScore = resp.profileRecords.data.score;
            }
            if (resp.profilePresentationNodes != null && resp.profileRecords != null) {
                if (resp.profilePresentationNodes.data != null && resp.profilePresentationNodes.data.nodes != null) {
                    if (resp.profilePresentationNodes && resp.profilePresentationNodes.data) {
                        nodes.push(resp.profilePresentationNodes.data.nodes);
                    }
                    if (resp.profileRecords && resp.profileRecords.data) {
                        records.push(resp.profileRecords.data.records);
                    }
                    if (resp.profileCollectibles && resp.profileCollectibles.data) {
                        collections.push(resp.profileCollectibles.data.collectibles);
                    }
                }
            }
            if (resp.characterPresentationNodes != null && resp.characterRecords != null) {
                for (const char of chars) {
                    if (resp.characterPresentationNodes && resp.characterPresentationNodes.data) {
                        const presentationNodes = resp.characterPresentationNodes.data[char.characterId].nodes;
                        nodes.push(presentationNodes);
                    }
                    if (resp.characterRecords && resp.characterRecords.data) {
                        const _records = resp.characterRecords.data[char.characterId].records;
                        records.push(_records);
                    }
                    if (resp.characterCollectibles && resp.characterCollectibles.data) {
                        const _coll = resp.characterCollectibles.data[char.characterId].collectibles;
                        collections.push(_coll);
                    }

                }
            }

            if (collections.length > 0) {
                const tempBadges = this.handleColPresNode([], '498211331', nodes, collections, []).children;
                for (const ts of tempBadges) {
                    const badge = this.buildBadge(ts);
                    if (badge != null) {
                        badges.push(badge);
                    }
                }
                badges.sort((a, b) => {
                    const aP = a.percent;
                    const bP = b.percent;
                    if (aP > bP) {
                        return -1;
                    }
                    if (aP < bP) {
                        return 1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                });

                const collLeaves: TriumphCollectibleNode[] = [];
                colTree = this.handleColPresNode([], '3790247699', nodes, collections, collLeaves).children;
                searchableCollection = collLeaves.sort((a, b) => {
                    if (a.name < b.name) { return -1; }
                    if (a.name < b.name) { return 0; }
                    return 0;
                });
                searchableCollection = searchableCollection.filter(x => {
                    return (x.name != null) && (x.name.trim().length > 0);
                });
            }


            if (records.length > 0) {
                let triumphLeaves: TriumphRecordNode[] = [];
                const tempSeals = this.handleRecPresNode([], '1652422747', nodes, records, triumphLeaves, true, true).children;
                for (const ts of tempSeals) {
                    const seal = this.buildSeal(ts, badges);
                    if (seal != null) {
                        seals.push(seal);
                    }
                }

                recordTree = this.handleRecPresNode([], '1024788583', nodes, records, triumphLeaves, showZeroPtTriumphs, showInvisTriumphs).children;
                const leafSet = {};
                for (const t of triumphLeaves) {
                    leafSet[t.hash] = t;
                }
                triumphLeaves = [];
                for (const key of Object.keys(leafSet)) {
                    triumphLeaves.push(leafSet[key]);
                }
                lowHangingTriumphs = triumphLeaves.filter((l) => { return !l.complete; });
                if (showZeroPtTriumphs != true) {
                    lowHangingTriumphs = lowHangingTriumphs.filter((l) => { return l.score > 0; });
                }
                if (showInvisTriumphs != true) {
                    lowHangingTriumphs = lowHangingTriumphs.filter((l) => { return !l.invisible; });
                }
                lowHangingTriumphs.sort((a, b) => {
                    if (a.percent > b.percent) { return -1; }
                    if (a.percent < b.percent) { return 1; }
                    return 0;
                });
                searchableTriumphs = triumphLeaves.filter(x => {
                    return (x.name != null) && (x.name.trim().length > 0);
                });
                const mmxix = this.handleRecordNode([], '2254764897', records, showZeroPtTriumphs, showInvisTriumphs);
                const highScore = this.handleRecordNode([], '2884099200', records, showZeroPtTriumphs, showInvisTriumphs);
                searchableTriumphs.push(mmxix);
                searchableTriumphs.push(highScore);
                searchableTriumphs = searchableTriumphs.sort((a, b) => {
                    if (a.name < b.name) { return -1; }
                    if (a.name < b.name) { return 0; }
                    return 0;
                });
                for (const r of searchableTriumphs) {
                    dictSearchableTriumphs[r.hash] = r;
                }

                // filter any hidden
                try {
                    const sHideMe = localStorage.getItem('hidden-closest-triumphs');
                    if (sHideMe != null) {
                        const hideMe: string[] = JSON.parse(sHideMe);

                        lowHangingTriumphs = lowHangingTriumphs.filter((l) => {
                            return hideMe.indexOf(l.hash) < 0;
                        });
                        hasHiddenClosest = true;
                    }

                } catch (exc) {
                    console.dir(exc);
                }


                lowHangingTriumphs = lowHangingTriumphs.slice(0, 10);

                const seasonDescs: any[] = this.destinyCacheService.cache.RecordSeasons;
                for (const seasonDesc of seasonDescs) {

                    const seasonRecords: TriumphRecordNode[] = [];
                    for (const hash of seasonDesc.hashes) {
                        if (dictSearchableTriumphs[hash] == null) {
                            // ignore
                        }
                        seasonRecords.push(dictSearchableTriumphs[hash]);
                    }
                    seasons.push({
                        name: seasonDesc.name,
                        records: seasonRecords
                    });
                }

            }
        }
        let title = '';
        for (const char of chars) {
            if (char.title != null && char.title.trim().length > 0) {
                title = char.title;
                break;
            }
        }

        let transitoryData: ProfileTransitoryData = null;

        // enhance current activity with transitory profile data
        if (resp.profileTransitoryData != null && resp.profileTransitoryData.data != null) {
            const _transData: PrivProfileTransitoryData = resp.profileTransitoryData.data;
            const partyMembers: SearchResult[] = [];
            for (const p of _transData.partyMembers) {
                if (!p.status) {
                    continue;
                }
                const sr: SearchResult = {
                    iconPath: null,
                    membershipType: 0,
                    membershipId: p.membershipId,
                    displayName: p.displayName
                };
                partyMembers.push(sr);
            }
            transitoryData = {
                partyMembers: partyMembers,
                currentActivity: _transData.currentActivity,
                joinability: _transData.joinability
            };
        }

        const specialPgoressions = this.cookSpecialAccountProgression(accountProgressions);


        accountProgressions.sort(function (a, b) {
            if (a.name > b.name) { return 1; }
            if (a.name < b.name) { return -1; }
            return 0;
        });
        return new Player(profile, chars, currentActivity, milestoneList, currencies, bounties, quests,
            rankups, superprivate, hasWellRested, checklists, charChecklists, triumphScore, recordTree, colTree,
            gear, vault, shared, lowHangingTriumphs, searchableTriumphs, searchableCollection,
            seals, badges, title, seasons, hasHiddenClosest, accountProgressions, artifactPowerBonus,
            transitoryData, specialPgoressions);
    }

    private cookSpecialAccountProgression(accountProgressions: Progression[]): SpecialAccountProgressions {
        const returnMe = {
            glory: null,
            seasonRank: null,
            valor: null,
            infamy: null
        };
        if (accountProgressions != null) {
            let prestige: Progression = null;
            const sp = this.getSeasonProgression();
            for (const ap of accountProgressions) {
                // valor
                if (ap.hash == '2626549951') {
                    returnMe.valor = ap;
                } else if (ap.hash == '2772425241') {
                    returnMe.infamy = ap;
                } else if (ap.hash == '2000925172') {
                    returnMe.glory = ap;
                } else if (ap.hash == sp.rewardProgressionHash) {
                    returnMe.seasonRank = ap;
                } else if (ap.hash == sp.prestigeProgressionHash) {
                    prestige = ap;
                }
            }
            if (prestige != null && returnMe.seasonRank != null) {
                prestige.level += returnMe.seasonRank.level;
                prestige.weeklyProgress += returnMe.seasonRank.weeklyProgress;
                prestige.dailyProgress += returnMe.seasonRank.dailyProgress;
                returnMe.seasonRank = prestige;
            }
        }
        return returnMe;
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

    private handleRecPresNode(path: PathEntry[], key: string, pres: any[], records: any[], triumphLeaves: TriumphRecordNode[], showZeroPtTriumphs: boolean, showInvisTriumphs: boolean): TriumphPresentationNode {
        const val = this.getBestPres(pres, key);
        const pDesc = this.destinyCacheService.cache.PresentationNode[key];
        if (pDesc == null) {
            return null;
        }
        path.push({
            path: pDesc.displayProperties.name,
            hash: key
        });
        const children = [];
        let unredeemedCount = 0;
        let pts = 0;
        let total = 0;
        if (pDesc.children != null) {
            for (const child of pDesc.children.presentationNodes) {
                const oChild = this.handleRecPresNode(path.slice(), child.presentationNodeHash, pres, records, triumphLeaves, showZeroPtTriumphs, showInvisTriumphs);
                if (oChild == null) { continue; }
                children.push(oChild);
                unredeemedCount += oChild.unredeemedCount;
                total += oChild.totalPts;
                pts += oChild.pts;
            }
            for (const child of pDesc.children.records) {
                const oChild = this.handleRecordNode(path.slice(), child.recordHash, records, showZeroPtTriumphs, showInvisTriumphs);
                if (oChild == null) { continue; }
                triumphLeaves.push(oChild);
                if (oChild.invisible && !showInvisTriumphs) { continue; }
                if (oChild.score == 0 && !showZeroPtTriumphs) { continue; }
                children.push(oChild);
                if (oChild.complete && !oChild.redeemed) {
                    unredeemedCount++;
                }
                pts += oChild.earned;
                // if (oChild.complete && oChild.redeemed) {
                //     pts += oChild.score;
                // }
                total += oChild.score;
            }
        }
        if (children == null || children.length == 0) {
            return null;
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
            path: path,
            unredeemedCount: unredeemedCount,
            pts: pts,
            totalPts: total
        };
    }

    private handleRecordNode(path: PathEntry[], key: string, records: any[], showZeroPtTriumphs: boolean, showInvisTriumphs: boolean): TriumphRecordNode {
        const rDesc = this.destinyCacheService.cache.Record[key];
        if (rDesc == null) { return null; }
        let pointsToBadge = false;
        if (rDesc.displayProperties != null && rDesc.displayProperties.description != null) {
            if (rDesc.displayProperties.description.indexOf('Complete the associated badge') == 0) {
                pointsToBadge = true;
            }
        }
        if (key == '52802522') {
            pointsToBadge = true;
        }

        const val = this.getBestRec(records, key);
        if (val == null) { return null; }

        path.push({
            path: rDesc.displayProperties.name,
            hash: key
        });


        let searchText = rDesc.displayProperties.name + ' ' + rDesc.displayProperties.description;

        let isInterval = false;
        let iterateMe = val.objectives;
        let intervalsRedeemedCount = null;
        if (!val.objectives && val.intervalObjectives) {
            isInterval = true;
            iterateMe = val.intervalObjectives;
            intervalsRedeemedCount = val.intervalsRedeemedCount;
            searchText += ' interval';
        }
        if (!iterateMe) {
            console.log('Missing objs');
            console.dir(val);
            return null;
        }
        let objs: ItemObjective[] = [];
        let totalProgress = 0;
        let earnedPts = 0;
        let totalPts = 0;
        if (rDesc.completionInfo && rDesc.completionInfo.ScoreValue) {
            totalPts = rDesc.completionInfo.ScoreValue;
        } else if (rDesc.intervalInfo && rDesc.intervalInfo.intervalObjectives) {
            let intervalIndex = 0;
            for (const intervalObj of rDesc.intervalInfo.intervalObjectives) {
                if (intervalObj.intervalScoreValue) {
                    totalPts += intervalObj.intervalScoreValue;
                }
                if (val.intervalObjectives.length > intervalIndex) {
                    const intervalVal = val.intervalObjectives[intervalIndex];
                    if (intervalVal.complete) {
                        earnedPts += intervalObj.intervalScoreValue;
                    }
                }
                // if (val.)
                intervalIndex++;
            }

        }


        let objIndex = -1;
        let incompIntPercent = null;
        for (const o of iterateMe) {
            objIndex++;
            const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
            if (oDesc == null) { continue; }

            let score = null;
            if (isInterval && objIndex < rDesc.intervalInfo.intervalObjectives.length) {
                score = rDesc.intervalInfo.intervalObjectives[objIndex].intervalScoreValue;
            }

            const iObj: ItemObjective = {
                hash: o.objectiveHash,
                completionValue: oDesc.completionValue,
                progressDescription: oDesc.progressDescription,
                progress: o.progress == null ? 0 : o.progress,
                complete: o.complete,
                score: score,
                percent: 0
            };

            let max = iObj.completionValue;
            if (iObj.completionValue == null || iObj.completionValue <= 0) {
                max = 1;
            }
            let objPercent = 100 * iObj.progress / max;
            if (objPercent > 100) { objPercent = 100; }
            iObj.percent = Math.floor(objPercent);

            totalProgress += oDesc.completionValue;
            objs.push(iObj);
            if (incompIntPercent == null && !o.complete) {
                incompIntPercent = iObj.percent;
            }
        }
        if (totalProgress < 2) { objs = []; }
        let complete = false;
        let redeemed = false;
        let title = false;
        let invisible = false;
        if (val != null && val.state != null) {
            if (val.state === 0) {
                complete = true;
            }
            if ((val.state & 1) > 0) {
                redeemed = true;
                complete = true;
            }
            if ((val.state & 16) > 0) {
                invisible = true;
            }
            if ((val.state & 64) > 0) {
                title = true;
            }
        }

        let percent = 0;
        if (objs.length > 0) {
            let sum = 0;
            for (const o of objs) {
                sum += o.percent;
                searchText += ' ' + o.progressDescription;
            }
            percent = Math.floor(sum / objs.length);
        }
        // interval or not, if it's done they got all the points
        if (complete) {
            earnedPts = totalPts;
        }
        return {
            type: 'record',
            hash: key,
            name: rDesc.displayProperties.name,
            desc: rDesc.displayProperties.description,
            icon: rDesc.displayProperties.icon,
            index: rDesc.index,
            objectives: objs,
            intervalsRedeemedCount: intervalsRedeemedCount,
            complete: complete,
            redeemed: redeemed,
            title: title,
            children: null,
            path: path,
            lowLinks: this.lowlineService.buildRecordLink(key),
            interval: isInterval,
            earned: earnedPts,
            score: totalPts,
            percent: complete ? 100 : incompIntPercent ? incompIntPercent : percent,
            searchText: searchText.toLowerCase(),
            invisible: invisible,
            pointsToBadge: pointsToBadge
        };
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

    private handleColPresNode(path: PathEntry[], key: string, pres: any[], collectibles: any[], collLeaves: TriumphCollectibleNode[]): TriumphPresentationNode {
        const val = this.getBestPres(pres, key);
        if (val == null) {
            return null;
        }
        const pDesc = this.destinyCacheService.cache.PresentationNode[key];
        if (pDesc == null) { return null; }
        path.push({
            path: pDesc.displayProperties.name,
            hash: key
        });
        const children = [];
        if (pDesc.children != null) {
            for (const child of pDesc.children.presentationNodes) {
                const oChild = this.handleColPresNode(path.slice(0),
                    child.presentationNodeHash, pres, collectibles, collLeaves);
                if (oChild == null) { continue; }
                children.push(oChild);
            }
            for (const child of pDesc.children.collectibles) {
                const oChild = this.handleCollectibleNode(path.slice(0), child.collectibleHash, collectibles);
                if (oChild != null) {
                    children.push(oChild);
                    collLeaves.push(oChild);
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
            path: path,
            unredeemedCount: 0,
            pts: 0,
            totalPts: 0
        };
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

    private handleCollectibleNode(path: PathEntry[], key: string, collectibles: any[]): TriumphCollectibleNode {
        const cDesc = this.destinyCacheService.cache.Collectible[key];
        if (cDesc == null) { return null; }
        const val = this.getBestCol(collectibles, key);
        if (val != null && val.state != null && (val.state & 4) > 0) {
            return null;
        }
        path.push({
            path: cDesc.displayProperties.name,
            hash: key
        });

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
            searchText: cDesc.displayProperties.name.toLowerCase(),
            children: null,
            path: path
        };
    }

    private parseQuestStep(stepHash: number, currentStepHash: number): QuestlineStep {
        const desc: any = this.destinyCacheService.cache.InventoryItem[stepHash];
        if (desc == null) { return null; }
        const values = [];
        if (desc.value != null && desc.value.itemValue != null) {
            for (const val of desc.value.itemValue) {
                if (val.itemHash === 0) { continue; }
                const valDesc: any = this.destinyCacheService.cache.InventoryItem[val.itemHash];
                if (valDesc != null) {
                    values.push({
                        hash: valDesc.hash,
                        name: valDesc.displayProperties.name,
                        quantity: val.quantity
                    });
                }
            }
        }
        const objectives = [];
        if (desc.objectives != null && desc.objectives.objectiveHashes != null) {
            for (const objectiveHash of desc.objectives.objectiveHashes) {
                const oDesc = this.destinyCacheService.cache.Objective[objectiveHash];
                const iObj: ItemObjective = {
                    hash: objectiveHash,
                    completionValue: oDesc.completionValue,
                    progressDescription: oDesc.progressDescription,
                    progress: 0,
                    complete: false,
                    percent: 0
                };
                objectives.push(iObj);
            }
        }
        return {
            name: desc.displayProperties.displayName,
            desc: desc.displayProperties.description,
            objectives: objectives,
            values: values,
            current: currentStepHash == stepHash
        };
    }

    private parseQuestLine(qli: number, stepHash: number): Questline {
        const qdesc: any = this.destinyCacheService.cache.InventoryItem[qli];
        if (qdesc == null) { return null; }
        if (qdesc.setData != null) {}
        if (qdesc.setData == null) { return null; }
        // wtf was this doing anyway?
        const qType = qdesc.setData.setType;
        // this is a milestone, don't show it here
        if ('challenge' == qType) {
            return null;
        }
        // if (qType != 'quest_global') {
        //     return null;
        // }
        const steps = qdesc.setData.itemList;
        let cntr = 0;
        const oSteps = [];
        let progress = '';
        for (const step of steps) {
            cntr++;
            const oStep = this.parseQuestStep(step.itemHash, stepHash);
            if (oStep != null) {
                oSteps.push(oStep);
                if (oStep.current) {
                    progress = cntr + '/' + steps.length;
                }
            }

        }
        return {
            hash: qdesc.hash,
            name: qdesc.displayProperties.name,
            steps: oSteps,
            progress: progress
        };
    }

    private cookDamageType(damageType: DamageType): string {
        if (damageType == DamageType.None) {
            return 'None';
        } else if (damageType == DamageType.Kinetic) {
            return 'Kinetic';
        } else if (damageType == DamageType.Arc) {
            return 'Arc';
        } else if (damageType == DamageType.Thermal) {
            return 'Solar';
        } else if (damageType == DamageType.Void) {
            return 'Void';
        } else {
            return '';
        }
    }

    private isEnergyType(damageType: DamageType): boolean {
        if (damageType == DamageType.Arc) {
            return true;
        } else if (damageType == DamageType.Thermal) {
            return true;
        } else if (damageType == DamageType.Void) {
            return true;
        } else {
            return false;
        }
    }


    private cookEnergyType(energyType: EnergyType): string {
        if (energyType == EnergyType.Any) {
            return 'Any';
        } else if (energyType == EnergyType.Arc) {
            return 'Arc';
        } else if (energyType == EnergyType.Thermal) {
            return 'Solar';
        } else if (energyType == EnergyType.Void) {
            return 'Void';
        } else {
            return '';
        }
    }


    private parseMasterwork(plugDesc: any): MastworkInfo {
        if (plugDesc.plug == null) { return null; }
        if (plugDesc.plug.plugCategoryIdentifier == null) { return null; }
        if (plugDesc.plug.plugCategoryIdentifier.indexOf('masterworks.stat.') < 0) {
            return null;
        }
        // from here on out we know its MW
        if (plugDesc.investmentStats == null || plugDesc.investmentStats.length == 0) {
            console.log('Missing investment stats?');
            return null;
        }
        const invStats = plugDesc.investmentStats[0];
        const tier = invStats.value;
        const statHash = invStats.statTypeHash;
        const statDesc: any = this.destinyCacheService.cache.Stat[statHash];
        if (statDesc == null) {
            console.log('Missing statsDesc for ' + statHash);
            return null;
        }
        const name = statDesc.displayProperties.name;
        const desc = statDesc.displayProperties.description;

        return {
            hash: plugDesc.hash,
            name: name,
            desc: desc,
            icon: plugDesc.displayProperties.icon,
            tier: tier
        };
    }

    private parseMod(plugDesc: any, itemComp: any, id: string, socketDesc: any): InventoryPlug {
        if (plugDesc.displayProperties.name == 'Empty Mod Socket') { return null; }
        if (plugDesc.displayProperties.name == 'Default Ornament') { return null; }
        if (plugDesc.itemTypeDisplayName != null && plugDesc.itemTypeDisplayName.indexOf('Ornament') >= 0) {
            return null;
        }
        if (plugDesc.displayProperties.name.indexOf('Catalyst') >= 0) {
            if (plugDesc.perks.length > 0) {
                let catName = plugDesc.displayProperties.name;
                let catDesc = plugDesc.displayProperties.description;
                for (const p of plugDesc.perks) {
                    if (p.perkVisibility == 1) {
                        const perkDesc: any = this.destinyCacheService.cache.Perk[p.perkHash];
                        if (perkDesc != null) {
                            catName = 'Catalyst: ' + perkDesc.displayProperties.name;
                            catDesc = perkDesc.displayProperties.description;
                        }
                    }
                }
                const itemObjs: ItemObjective[] = [];
                let plugObjectives = null;
                if (itemComp.plugObjectives && itemComp.plugObjectives.data && itemComp.plugObjectives.data[id]) {
                    const itemObj = itemComp.plugObjectives.data[id];
                    if (itemObj.objectivesPerPlug && itemObj.objectivesPerPlug[plugDesc.hash]) {
                        plugObjectives = itemObj.objectivesPerPlug[plugDesc.hash];
                    }
                }

                if (plugObjectives) {
                    for (const o of plugObjectives) {
                        const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                        if (oDesc == null) { continue; }
                        const iObj: ItemObjective = {
                            hash: o.objectiveHash,
                            completionValue: oDesc.completionValue,
                            progressDescription: oDesc.progressDescription,
                            progress: o.progress == null ? 0 : o.progress,
                            complete: o.complete,
                            percent: 0
                        };
                        itemObjs.push(iObj);
                    }
                }
                return new InventoryPlug(plugDesc.hash,
                    catName, catDesc,
                    plugDesc.displayProperties.icon, true, false, itemObjs);
            }

            return null;
        }
        // if (plugDesc.displayProperties.name.indexOf('Upgrade Masterwork') >= 0) {
        //     let plugObjectives = null;
        //     if (itemComp.plugObjectives && itemComp.plugObjectives.data && itemComp.plugObjectives.data[id]) {
        //         const itemObj = itemComp.plugObjectives.data[id];
        //         console.log('Objectives');
        //         console.dir(itemObj);
        //         if (itemObj.objectivesPerPlug && itemObj.objectivesPerPlug[plugDesc.hash]){
        //             plugObjectives = itemObj.objectivesPerPlug[plugDesc.hash];
        //         }
        //     }
        //     const itemObjs: ItemObjective[] = [];
        //     for (const o of plugObjectives) {
        //         const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
        //         if (oDesc == null) { continue; }
        //         const iObj: ItemObjective = {
        //             hash: o.objectiveHash,
        //             completionValue: oDesc.completionValue,
        //             progressDescription: oDesc.progressDescription,
        //             progress: o.progress == null ? 0 : o.progress,
        //             complete: o.complete,
        //             percent: 0
        //         };
        //         itemObjs.push(iObj);
        //     }
        //     return new InventoryPlug(plugDesc.hash,
        //         'Catalyst in-progress', plugDesc.displayProperties.description,
        //         plugDesc.displayProperties.icon, true, false, itemObjs);

        // }
        if (plugDesc.hash == 3786277607) { // legacy MW armor slot
            return null;
        }
        if (plugDesc.hash == 3876796314) {  // base radiance
            return null;
        }
        if (plugDesc.hash == 2667900317) {  // crucible  mw
            return null;
        }
        if (plugDesc.hash == 2946649456) {  // vanguard  mw
            return null;
        }
        if (plugDesc.hash == 1961001474) {  // rework weapon
            return null;
        }
        if (plugDesc.hash == 3612467353) {  // rework weapon
            return null;
        }

        if (plugDesc.plug != null) {
            const ch = plugDesc.plug.plugCategoryHash;
            if (ch == 2973005342 || // shader
                ch == 2947756142) { // masterwork tracker
                return null;
            }
        }

        let desc = plugDesc.displayProperties.description;
        if (desc == null || desc.trim().length == 0) {
            if (plugDesc.perks != null && plugDesc.perks.length >= 1) {
                const perkHash = plugDesc.perks[0].perkHash;
                const perkDesc: any = this.destinyCacheService.cache.Perk[perkHash];
                if (perkDesc != null) {
                    desc = perkDesc.displayProperties.description;
                }
            }
        }
        const name = plugDesc.displayProperties.name.replace('_', ' ');
        const returnMe = new InventoryPlug(plugDesc.hash,
            name, desc,
            plugDesc.displayProperties.icon, true);

        if (plugDesc.investmentStats && plugDesc.investmentStats.length > 0) {
            for (const invStat of plugDesc.investmentStats) {

                const statHash = invStat.statTypeHash;
                const statDesc: any = this.destinyCacheService.cache.Stat[statHash];
                if (statDesc == null) {
                    continue;
                }
                const stat = new InventoryStat(statHash, statDesc.displayProperties.name,
                    statDesc.displayProperties.description, invStat.value, null);
                returnMe.inventoryStats.push(stat);
            }
        }
        return returnMe;
    }

    private getPlugName(plugDesc: any): string {
        const name = plugDesc.displayProperties.name;
        if (name == null) { return null; }
        if (name.trim().length == 0) { return null; }
        if (plugDesc.plug == null) { return null; }
        if (plugDesc.plug.plugCategoryIdentifier == null) { return null; }
        if (plugDesc.plug.plugCategoryHash == null) { return null; }
        const ch = plugDesc.plug.plugCategoryHash;
        if (ch == 2947756142) { // hide trackers
            return null;
        }

        return name;
    }

    private getSeasonalMod(plugDesc: any): number | null {
        if (plugDesc && plugDesc.plug && plugDesc.plug.plugCategoryHash) {
            const h = plugDesc.plug.plugCategoryHash;
            if (h == 1081029832) { // undying
                return 8;
            }
            if (h == 208760563) { // dawn
                return 9;
            }
            if (h == 2149155760 || h == 13646368) { // outlaw
                return 4;
            }
            if (h == 1962317640 || h == 2712224971 || h == 1202876185) { // opulence
                return 7;
            }
            if (h == 65589297) { // forge
                return 5;
            }

        }
        return null;
    }

    private parseInvItem(itm: PrivInventoryItem, owner: Target, itemComp: any, detailedInv: boolean, options: Target[], characterProgressions: any): InventoryItem {
        try {
            const desc: any = this.destinyCacheService.cache.InventoryItem[itm.itemHash];
            if (desc == null) {
                return null;
                // return new InventoryItem(""+itm.itemHash, "Classified", equipped, owner, null, ItemType.None, "Classified");
            }
            // anything with no type goes away too
            if (desc.itemTypeDisplayName == null) {
                return null;
            }
            const postmaster = (itm.bucketHash == 215593132);
            let type: ItemType = desc.itemType;
            let ammoType: DestinyAmmunitionType;
            if (desc.equippingBlock != null) {
                ammoType = desc.equippingBlock.ammoType;
            }
            let description = desc.displayProperties.description;

            if (type === ItemType.None && desc.itemTypeDisplayName != null && desc.itemTypeDisplayName.indexOf('Bounty') >= 0) {
                type = ItemType.Bounty;
            }
            if (type === ItemType.None && desc.itemTypeDisplayName != null && desc.itemTypeDisplayName.indexOf('Key Mold') >= 0) {
                type = ItemType.Quest;
            }
            if (type === ItemType.None && desc.itemTypeDisplayName != null && desc.itemTypeDisplayName.indexOf('Forge Vessel') >= 0) {
                type = ItemType.ForgeVessel;
            }
            if (itm.itemHash === 1115550924) {
                type = ItemType.Chalice;
            } else if (desc.itemType === ItemType.None && desc.itemTypeDisplayName == 'Invitation of the Nine') {
                type = ItemType.Bounty;
            }

            if (!detailedInv) {
                if (type !== ItemType.Bounty
                    && type !== ItemType.ForgeVessel
                    && type !== ItemType.Quest
                    && type !== ItemType.QuestStep
                    && type !== ItemType.Chalice) {
                    return null;
                }
            } else {
                if (desc.itemType === ItemType.Mod && desc.itemTypeDisplayName.indexOf('Mod') >= 0) {
                    type = ItemType.GearMod;
                    // mods we use the perk desc
                    if (desc.perks != null && desc.perks.length > 0) {
                        const pHash = desc.perks[0].perkHash;

                        const pDesc: any = this.destinyCacheService.cache.Perk[pHash];
                        if (pDesc != null) {
                            description = pDesc.displayProperties.description;
                        }
                    }
                } else if (desc.itemType === ItemType.None && desc.itemTypeDisplayName.indexOf('Material') >= 0) {
                    type = ItemType.ExchangeMaterial;
                } else if (desc.itemType === ItemType.Ship) {
                    type = ItemType.Vehicle;
                } else if (
                    type != ItemType.Weapon
                    && type != ItemType.Armor
                    && type != ItemType.GearMod
                    && type != ItemType.Ghost
                    && type != ItemType.Vehicle
                    && type != ItemType.ExchangeMaterial
                    && type != ItemType.Subclass
                    && type != ItemType.Consumable) {
                    return null;
                }

                if (type == ItemType.Consumable) {
                    if (desc.hash == 3487922223 || // datalattice
                        desc.hash == 2014411539 || // alkane dust
                        desc.hash == 950899352 || // dusklight shard
                        desc.hash == 1305274547 || // phaseglass
                        desc.hash == 49145143 || // simulation seeds
                        desc.hash == 31293053 || // seraphite
                        desc.hash == 1177810185) { // etheric spiral
                        type = ItemType.ExchangeMaterial;
                    }
                }
            }
            const objectives: ItemObjective[] = [];
            let progTotal = 0, progCnt = 0;
            if (itemComp != null) {
                if (itemComp.objectives != null && itemComp.objectives.data != null) {
                    const parentObj: any = itemComp.objectives.data[itm.itemInstanceId];
                    let objs: any[] = null;
                    if (parentObj != null) {
                        objs = parentObj.objectives;

                    }
                    if (objs == null && characterProgressions != null && characterProgressions.data != null &&
                        owner != null && characterProgressions.data[owner.id] != null) {
                        objs = characterProgressions.data[owner.id].uninstancedItemObjectives[itm.itemHash];
                    }
                    if (objs != null) {
                        for (const o of objs) {
                            const oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                            const iObj: ItemObjective = {
                                hash: o.objectiveHash,
                                completionValue: oDesc.completionValue,
                                progressDescription: oDesc.progressDescription,
                                progress: o.progress == null ? 0 : o.progress,
                                complete: o.complete,
                                percent: 0
                            };


                            if (iObj.completionValue != null && iObj.completionValue > 0) {
                                progTotal += 100 * iObj.progress / iObj.completionValue;
                                progCnt++;
                                iObj.percent = Math.floor(100 * iObj.progress / iObj.completionValue);
                            }
                            objectives.push(iObj);
                        }
                    }

                }
            }
            let aggProgress = 0;
            if (progCnt > 0) {
                aggProgress = progTotal / progCnt;
            }
            let power = 0;
            let damageType: DamageType = DamageType.None;
            let energyType: EnergyType = EnergyType.Any;
            let energyCapacity: number = null;
            let energyUsed: number = null;
            let totalStatPoints: number = null;
            let equipped = false;
            let canEquip = false;
            let searchText = '';
            let seasonalModSlot = null;
            const stats: InventoryStat[] = [];
            const sockets: InventorySocket[] = [];
            let mw: MastworkInfo = null;
            const mods: InventoryPlug[] = [];

            let inventoryBucket: ApiInventoryBucket = null;
            let tier = null;
            let isRandomRoll = false;

            // || type === ItemType.Chalice for the future?
            if (detailedInv || type === ItemType.Chalice) {

                if (desc.inventory != null) {
                    tier = desc.inventory.tierTypeName;
                    const bucketHash = desc.inventory.bucketTypeHash;
                    if (bucketHash != null) {
                        const bDesc = this.destinyCacheService.cache.InventoryBucket[bucketHash];
                        if (bDesc != null) {
                            inventoryBucket = bDesc;
                        }
                    }
                }
                if (itemComp.instances != null && itemComp.instances.data != null) {
                    const instanceData = itemComp.instances.data[itm.itemInstanceId];
                    if (instanceData != null) {
                        if (instanceData.primaryStat != null) {
                            power = instanceData.primaryStat.value;
                        }
                        damageType = instanceData.damageType;
                        equipped = instanceData.isEquipped;
                        canEquip = instanceData.canEquip;
                        if (instanceData.energy != null) {
                            const itmEnergy: PrivItemEnergy = instanceData.energy;
                            energyType = itmEnergy.energyType;
                            energyCapacity = itmEnergy.energyCapacity;
                            energyUsed = itmEnergy.energyUsed;

                        }
                    }
                }
                if (itemComp.stats != null && itemComp.stats.data != null) {
                    const statDict: { [hash: string]: InventoryStat; } = {};
                    const instanceData = itemComp.stats.data[itm.itemInstanceId];
                    if (instanceData != null && instanceData.stats != null) {
                        Object.keys(instanceData.stats).forEach(key => {
                            const val: any = instanceData.stats[key];
                            const jDesc: any = this.destinyCacheService.cache.Stat[key];
                            statDict[key] = new InventoryStat(key, jDesc.displayProperties.name,
                                jDesc.displayProperties.description, val.value, null);
                        });
                        const ostats = desc.stats.stats;
                        Object.keys(ostats).forEach(key => {
                            const val: any = ostats[key];
                            const baseValue = val.value;
                            if (statDict[key] == null) {
                                const jDesc: any = this.destinyCacheService.cache.Stat[key];
                                statDict[key] = new InventoryStat(key, jDesc.displayProperties.name,
                                    jDesc.displayProperties.description, null, baseValue);
                            } else {
                                statDict[key].baseValue = baseValue;
                            }
                        });
                        Object.keys(statDict).forEach(key => {
                            const val = statDict[key];
                            if (val.baseValue > 0 || val.value > 0) {
                                if (val.name != 'Defense' && val.name != 'Power' && val.name.length > 0) {
                                    stats.push(val);
                                }
                            }
                        });



                        stats.sort(function (a, b) {
                            const bs: string = b.name;
                            const as: string = a.name;
                            if (bs < as) { return 1; }
                            if (bs > as) { return -1; }
                            return 0;
                        });
                    }
                }

                if (itemComp.sockets != null && itemComp.sockets.data != null && desc.sockets != null) {
                    const itemSockets = itemComp.sockets.data[itm.itemInstanceId];
                    if (itemSockets != null && desc.sockets != null && desc.sockets.socketCategories != null) {
                        let reusablePlugs = null;
                        if (itemComp.reusablePlugs && itemComp.reusablePlugs.data && itemComp.reusablePlugs.data[itm.itemInstanceId] && itemComp.reusablePlugs.data[itm.itemInstanceId].plugs) {
                            reusablePlugs = itemComp.reusablePlugs.data[itm.itemInstanceId].plugs;
                        }
                        for (const jCat of desc.sockets.socketCategories) {

                            // skip ghost mods
                            if (jCat.socketCategoryHash == 3379164649) {
                                continue;
                            }
                            // skip cosmetics
                            if (jCat.socketCategoryHash == 2048875504 || jCat.socketCategoryHash == 1926152773) {
                                continue;
                            }
                            // read armor tier info from the item instance instead
                            if (760375309 == jCat.socketCategoryHash) {
                                continue;
                            }
                            const isMod = jCat.socketCategoryHash == 590099826 || jCat.socketCategoryHash == 2685412949;
                            const socketArray = itemSockets.sockets;
                            if (jCat.socketIndexes == null) { continue; }
                            for (const index of jCat.socketIndexes) {
                                const socketDesc = desc.sockets.socketEntries[index];
                                const socketVal = socketArray[index];
                                const plugs: InventoryPlug[] = [];
                                const possiblePlugs: InventoryPlug[] = [];
                                isRandomRoll = isRandomRoll || socketDesc.randomizedPlugSetHash != null;
                                // we do !isMod b/c for masterworks the "unselected" perk is actually the next tier (except for masterworks where they're the same and selected)
                                // for those we just skip down to the socketVal
                                if (!isMod && reusablePlugs && reusablePlugs[index]) {
                                    for (const plug of reusablePlugs[index]) {
                                        const plugDesc: any = this.destinyCacheService.cache.InventoryItem[plug.plugItemHash];
                                        if (plugDesc == null) { continue; }
                                        const name = this.getPlugName(plugDesc);
                                        if (name == null) { continue; }
                                        const oPlug = new InventoryPlug(plugDesc.hash,
                                            name, plugDesc.displayProperties.description,
                                            plugDesc.displayProperties.icon, socketVal.plugHash == plug.plugItemHash);
                                        plugs.push(oPlug);
                                    }
                                } else if (socketVal.plugHash != null) {  // only show plughash if there is no reusable, otherwise we'll dupe perks
                                    const plug = socketVal;
                                    const plugDesc: any = this.destinyCacheService.cache.InventoryItem[plug.plugHash];
                                    if (plugDesc == null) { continue; }
                                    seasonalModSlot = seasonalModSlot || this.getSeasonalMod(plugDesc);

                                    if (isMod) {
                                        const mwInfo = this.parseMasterwork(plugDesc);
                                        if (mwInfo != null) {
                                            mw = mwInfo;
                                            continue;
                                        }
                                        const modInfo = this.parseMod(plugDesc, itemComp, itm.itemInstanceId, socketDesc);
                                        if (modInfo != null) {
                                            mods.push(modInfo);
                                            continue;
                                        }
                                        continue;
                                    }
                                    const name = this.getPlugName(plugDesc);
                                    if (name == null) { continue; }
                                    const oPlug = new InventoryPlug(plugDesc.hash,
                                        name, plugDesc.displayProperties.description,
                                        plugDesc.displayProperties.icon, true, plug.isEnabled);
                                    plugs.push(oPlug);
                                }
                                if (plugs.length > 0) {
                                    sockets.push(new InventorySocket(jCat.socketCategoryHash, plugs, possiblePlugs));
                                }
                                if (socketDesc.randomizedPlugSetHash) {
                                    const randomRollsDesc: any = this.destinyCacheService.cache.PlugSet[socketDesc.randomizedPlugSetHash];
                                    if (randomRollsDesc && randomRollsDesc.reusablePlugItems) {
                                        for (const option of randomRollsDesc.reusablePlugItems) {
                                            const plugDesc: any = this.destinyCacheService.cache.InventoryItem[option.plugItemHash];
                                            const name = this.getPlugName(plugDesc);
                                            if (name == null) { continue; }
                                            const oPlug = new InventoryPlug(plugDesc.hash,
                                                name, plugDesc.displayProperties.description,
                                                plugDesc.displayProperties.icon, false);
                                            possiblePlugs.push(oPlug);
                                        }
                                    }
                                }
                            }
                        }
                    }


                }
            }
            const values: NameQuantity[] = [];
            if (desc.value != null && desc.value.itemValue != null) {
                for (const val of desc.value.itemValue) {
                    if (val.itemHash === 0) { continue; }
                    const valDesc: any = this.destinyCacheService.cache.InventoryItem[val.itemHash];
                    if (valDesc != null) {
                        values.push({
                            hash: val.itemHash,
                            name: valDesc.displayProperties.name,
                            quantity: val.quantity
                        });
                    }

                }
            }
            const locked: boolean = (itm.state & ItemState.Locked) > 0;
            const masterworked = (itm.state & ItemState.Masterwork) > 0;
            const tracked = (itm.state & ItemState.Tracked) > 0;

            const bucketOrder = null;

            let questline: Questline = null;
            if (desc.objectives != null && type == ItemType.QuestStep) {
                const qli = desc.objectives.questlineItemHash;

                if (qli != null && qli != 0) {
                    questline = this.parseQuestLine(qli, itm.itemHash);
                    if (questline == null) {
                        console.log('Null questline for ' + desc.displayProperties.name);
                        return null;
                    }
                }
            }

            searchText = desc.displayProperties.name;
            if (mw != null) {
                searchText += ' ' + mw.name;
            }
            if (masterworked) {
                searchText += ' is:masterwork';
            }
            for (const mod of mods) {
                searchText += ' ' + mod.name;
            }
            if (mods.length > 0) {
                searchText += ' is:hasmod';
            }
            if (sockets != null) {
                for (const s of sockets) {
                    for (const p of s.plugs) {
                        searchText += ' ' + p.name;
                    }
                }
            }
            if (isRandomRoll == true) {
                searchText += ' is:random';
            } else {
                searchText += ' is:fixed';
            }
            if (damageType != null && damageType != DamageType.None) {
                searchText += ' ' + this.cookDamageType(damageType);
            }
            if (this.isEnergyType(damageType)) {
                searchText += ' energy';
            }
            if (energyType != null) {
                searchText += ' ' + this.cookEnergyType(energyType);
            }
            if (ammoType != null) {
                searchText += ' ' + DestinyAmmunitionType[ammoType];
            }
            if (postmaster) {
                searchText += ' mail is:postmaster';
            }
            if (type === ItemType.Bounty || type === ItemType.Quest || type === ItemType.QuestStep || type === ItemType.ForgeVessel) {
                searchText = desc.displayProperties.name + ' ';
                searchText += desc.displayProperties.description + ' ';
                // values
                for (const v of values) {
                    searchText += v.name + ' ';
                }
                if (questline != null) {
                    searchText += questline.name + ' ';
                }
                // vendor, fix xur
                if (desc.customVendorSourceHashes != null) {
                    for (const vendorHash of desc.customVendorSourceHashes) {
                        const vDesc: any = this.destinyCacheService.cache.Vendor[vendorHash];
                        if (vDesc != null) {
                            searchText += vDesc.displayProperties.name + ' ';
                        }
                        if (vendorHash == '2190858386') {
                            searchText += 'Xur ';
                        }
                    }
                }
                searchText += desc.itemTypeDisplayName + ' ';
                searchText += desc.displaySource + ' ';
            }
            if (desc.itemTypeDisplayName) {
                searchText += desc.itemTypeDisplayName;
            }
            searchText = searchText.toLowerCase();

            if (type === ItemType.Armor) {
                for (const s of stats) {
                    for (const m of mods) {
                        if (m.name.startsWith(s.name)) {
                            if (m.inventoryStats && m.inventoryStats.length > 0) {
                                for (const stat of m.inventoryStats) {
                                    if (stat.name == s.name && stat.value > 0) {
                                        s.enhancement = stat.value;
                                        s.value -= s.enhancement;
                                    }
                                }
                            }
                        }
                    }
                    totalStatPoints += s.value;
                }
            }
            if (seasonalModSlot) {
                searchText += 'is:seasonmod';
                if (seasonalModSlot == 9) {
                    searchText += 'season:dawn';
                }
                if (seasonalModSlot == 8) {
                    searchText += 'season:undying';
                }
                if (seasonalModSlot == 7) {
                    searchText += 'season:opulence';
                }
                if (seasonalModSlot == 5) {
                    searchText += 'season:forge';
                }
                if (seasonalModSlot == 4) {
                    searchText += 'season:outlaw';
                }
            }
            return new InventoryItem(itm.itemInstanceId, '' + itm.itemHash, desc.displayProperties.name,
                equipped, canEquip, owner, desc.displayProperties.icon, type, desc.itemTypeDisplayName,
                itm.quantity,
                power, damageType, energyType, stats, sockets, objectives,
                description,
                desc.classType, bucketOrder, aggProgress, values, itm.expirationDate,
                locked, masterworked, mw, mods, tracked, questline, searchText, inventoryBucket, tier, options.slice(),
                isRandomRoll, ammoType, postmaster
                , energyUsed, energyCapacity, totalStatPoints, seasonalModSlot
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
            b.lastOnlineStatusChange = x.lastOnlineStatusChange;
            b.isOnline = x.isOnline;
            b.memberType = x.memberType;
            b.destinyUserInfo = this.parseUserInfo(x.destinyUserInfo);
            b.bungieNetUserInfo = x.bungieNetUserInfo;
            b.joinDate = x.joinDate;
            returnMe.push(b);
        });

        returnMe.sort((a, b) => {
            if (a.lastOnlineStatusChange < b.lastOnlineStatusChange) {
                return 1;
            } else if (a.lastOnlineStatusChange > b.lastOnlineStatusChange) {
                return -1;
            }
            return 0;
        });
        return returnMe;
    }

    private camelKebab(prefix: string, s: string): string {
        if (prefix != null) {
            s = s.replace(prefix, '');
        }
        s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
        return s.charAt(0).toUpperCase() + s.slice(1);
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
            r.teamScore = ParseService.getBasicValue(e.values.teamScore);
            if (r.deaths === 0) {
                r.kd = r.kills;
            } else {
                r.kd = r.kills / r.deaths;
            }
            r.assists = ParseService.getBasicValue(e.values.assists);
            r.fireteamId = ParseService.getBasicValue(e.values.fireteamId);
            r.team = ParseService.getBasicDisplayValue(e.values.team);
            if (r.team == '18') {
                r.team = 'Alpha';
            }
            r.startSeconds = ParseService.getBasicValue(e.values.startSeconds);
            r.activityDurationSeconds = ParseService.getBasicValue(e.values.activityDurationSeconds);
            r.timePlayedSeconds = ParseService.getBasicValue(e.values.timePlayedSeconds);
            r.completionReason = ParseService.getBasicValue(e.values.completionReason);
            r.weapons = [];
            r.extra = [];

            if (e.extended != null) {
                if (e.extended.values != null) {
                    for (const key of Object.keys(e.extended.values)) {
                        const val = e.extended.values[key];
                        const basicVal = ParseService.getBasicValue(val);
                        if (key.startsWith('weaponKills')) {
                            if (basicVal > 0) {
                                const name = this.camelKebab('weaponKills', key);
                                const data = new PGCRWeaponData();
                                data.hash = '-1';
                                data.kills = basicVal;
                                data.name = name;
                                data.type = name;
                                r.weapons.push(data);
                            }
                        } else {
                            const desc: any = this.destinyCacheService.cache.HistoricalStats[key];
                            if (key.startsWith('medal')) {

                                const name = this.camelKebab('medal', key);
                                const extraEntry = new PGCRExtraData();
                                extraEntry.name = name;
                                extraEntry.value = basicVal;
                                extraEntry.desc = desc;
                                r.extra.push(extraEntry);
                            } else {
                                const extraEntry = new PGCRExtraData();
                                const name = this.camelKebab(null, key);
                                extraEntry.name = name;
                                extraEntry.value = basicVal;
                                extraEntry.desc = desc;
                                r.extra.push(extraEntry);
                            }
                        }

                    }

                }
                if (e.extended.weapons != null) {
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
        }
        r.weapons.sort(function (a, b) {
            return b.kills - a.kills;
        });
        r.extra.sort(function (a, b) {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
        r.characterClass = e.player.characterClass;
        r.characterLevel = e.player.characterLevel;
        r.lightLevel = e.player.lightLevel;
        if (!r.fireteamId) { r.fireteamId = -1; }
        if (!r.score) { r.score = 0; }
        r.user = this.parseUserInfo(e.player.destinyUserInfo);
        return r;
    }

    public parseUserProfile(i: any, iconPath: string): UserInfo {
        let platformName = '';
        if (i.membershipType === 1) {
            platformName = 'XBL';
        } else if (i.membershipType === 2) {
            platformName = 'PSN';
        } else if (i.membershipType === 4) {
            platformName = 'BNET';
        }
        return {
            membershipType: i.membershipType,
            membershipId: i.membershipId,
            crossSaveOverride: i.crossSaveOverride,
            displayName: i.displayName,
            icon: iconPath,
            platformName: platformName
        };
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
            membershipType: i.membershipType,
            membershipId: i.membershipId,
            crossSaveOverride: i.crossSaveOverride,
            displayName: i.displayName,
            icon: i.iconPath,
            platformName: platformName
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
        let scoreSum = 0;
        r.pve = desc && !desc.isPvP;

        p.entries.forEach((ent) => {
            const entry = this.parsePGCREntry(ent);

            // pve
            if (r.pve) {
                if (entry.completionReason === 0) {
                    teamPveSuccess = true;
                }
            }

            if (p.activityDetails.mode == 46) {
                if (entry.teamScore != null && (r.teamScore == null || entry.teamScore > r.teamScore)) {

                    r.teamScore = entry.teamScore;
                }
                if (entry.score != null) {
                    scoreSum += entry.score;
                }
            }
            if (entry.activityDurationSeconds != null) {
                r.activityDurationSeconds = entry.activityDurationSeconds;
                r.finish = new Date(Date.parse(r.period) + r.activityDurationSeconds * 1000).toISOString();
            }
            if (fireTeamCounts[entry.fireteamId] == null) {
                fireTeamCounts[entry.fireteamId] = 0;
            }
            fireTeamCounts[entry.fireteamId] = fireTeamCounts[entry.fireteamId] + 1;
            r.entries.push(entry);
        });
        r.pveSuccess = teamPveSuccess;
        if (scoreSum && r.teamScore) {
            r.timeLostPoints = scoreSum - r.teamScore;
        }
        r.entries.forEach(e => {
            e.fireteamSize = fireTeamCounts[e.fireteamId];
        });

        if (p.teams != null) {
            r.teams = [];
            p.teams.forEach(t => {
                const team = new PGCRTeam();
                team.name = '18' == t.teamName ? 'Alpha' : t.teamName;
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
        if (mode === 41) { return 'Trials Countdown'; }
        if (mode === 42) { return 'Trials Survival'; }
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
        if (mode === 66) { return 'Black Armory Forge'; } // BlackArmoryRun
        if (mode === 67) { return 'Salvage'; }
        if (mode === 68) { return 'Iron Banner Salvage'; }
        if (mode === 69) { return 'PvP Competitive'; }
        if (mode === 70) { return 'PvP Quickplay'; }
        if (mode === 71) { return 'Clash Quickplay'; }
        if (mode === 72) { return 'Clash Competitive'; }
        if (mode === 73) { return 'Control Quickplay'; }
        if (mode === 74) { return 'Control Competitive'; }
        if (mode === 75) { return 'Gambit Prime'; }
        if (mode === 76) { return 'Reckoning'; }
        if (mode === 77) { return 'Menagerie'; }
        if (mode === 78) { return 'Vex Offensive'; }
        if (mode === 79) { return 'Nightmare Hunt'; }
        if (mode === 80) { return 'Elimination'; }
        if (mode === 81) { return 'Momentum'; }
        if (mode === 82) { return 'Dungeon'; }
        return 'Unknown ' + mode;
    }


    public parseLinkedProfiles(resp: any) {
        if (resp.bnetMembership == null) {
            return null;
        }
        const returnMe: BungieMembership = new BungieMembership();
        returnMe.bungieId = resp.bnetMembership.membershipId;
        const aUser: UserInfo[] = [];
        for (const u of resp.profiles) {
            aUser.push(this.parseUserProfile(u, resp.bnetMembership.iconPath));
        }
        returnMe.destinyMemberships = aUser;
        return returnMe;

    }


    public parseBungieMember(r: PrivBungieMember): BungieMember {
        if (r.isDeleted === true) { return; }
        let xbl: BungieMemberPlatform;
        let psn: BungieMemberPlatform;
        let bnet: BungieMemberPlatform;
        let steam: BungieMemberPlatform;
        if (r.xboxDisplayName != null) {
            xbl = new BungieMemberPlatform(r.xboxDisplayName, Const.XBL_PLATFORM);
        }
        if (r.psnDisplayName != null) {
            psn = new BungieMemberPlatform(r.psnDisplayName, Const.PSN_PLATFORM);
        }
        if (r.blizzardDisplayName != null) {

            bnet = new BungieMemberPlatform(r.blizzardDisplayName, Const.BNET_PLATFORM);
        }
        if (r.steamDisplayName != null) {
            steam = new BungieMemberPlatform(r.steamDisplayName, Const.STEAM_PLATFORM);
        }
        if (xbl == null && psn == null && bnet == null && steam == null) { return null; }
        return new BungieMember(r.displayName, r.membershipId, xbl, psn, bnet, steam);

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
    titleRecordHash: number;
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
    currentResetCount?: number;
    seasonResets?: SeasonResets[];
}

interface SeasonResets {
    season: number;
    resets: number;
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
    steamDisplayName: string;
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
    transferStatus: number; // 0 can transfer, 1 equipped, 2 not transferrable, 4 no room in dest
    lockable: boolean;
    state: number;
    expirationDate: string;
}

interface PrivProfileTransitoryData {
    partyMembers: PrivPartyMember[];
    currentActivity: CurrentPartyActivity;
    joinability: Joinability;
    tracking: any[];
    lastOrbitedDestinationHash: number;
}

interface PrivPartyMember {
    membershipId: string;
    emblemHash: number;
    displayName: string;
    status: number;
}


interface PrivItemEnergy {
    energyCapacity: number;
    energyType: number;
    energyTypeHash: number;
    energyUnused: number;
    energyUsed: number;
}
