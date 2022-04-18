import { Injectable } from '@angular/core';
import { parseISO } from 'date-fns';
import { DestinyCacheService, ManifestInventoryItem, Season, SeasonPass } from './destiny-cache.service';
import { LowLineService } from './lowline.service';
import {
    Activity,
    AggHistoryEntry,
    ApiInventoryBucket,
    Badge,
    BadgeClass,
    BoostInfo,

    BUCKETS_ALL_POWER,
    BUCKETS_ARMOR,
    BUCKETS_WEAPON, Character,
    CharacterStat,
    CharChecklist,
    CharChecklistItem,
    Checklist,
    ChecklistItem,
    ClanInfo,
    ClanMilestoneResult,
    ClassAllowed,
    Const,
    Currency,
    CurrencyType,
    CurrentActivity,
    CurrentPartyActivity,
    DamageType,
    DestinyAmmunitionType,
    DestinyObjectiveUiStyle,
    DynamicStrings,
    EnergyType,
    Fraction,
    GearMetaData,
    InventoryItem,
    InventoryPlug,
    InventorySocket,
    InventoryStat,
    ItemObjective,
    ItemState,
    ItemType,
    Joinability,
    MasterworkInfo,
    MilestoneActivity,
    MileStoneName,
    MilestoneStatus,

    NameDesc,
    NameQuantity,
    PathEntry,
    Player, PrivPlugSetEntry, PrivPublicMilestone,
    Profile,
    ProfileTransitoryData,
    Progression,
    PublicMilestone,
    PublicMilestonesAndActivities,
    Questline,
    QuestlineStep,
    Rankup,

    Seal,
    SearchResult,
    SeasonalChallengeEntry,
    Shared,
    SpecialAccountProgressions, StatHashes, Target,
    TriumphCollectibleNode,
    TriumphNode,
    TriumphPresentationNode,
    TriumphRecordNode, Vault, WeaponShapeLevelObjective
} from './model';
import { SimpleParseService } from './simple-parse.service';

const IGNORE_WEAPON_PERK_STATS = [3511092054]; // Elemental capactor

const ARTIFACT_UNLOCK_PERK_PROG_HASH = '2779402444'; // #UPDATEME old 2779402444 2557524386 oldest 3094108685
const ARTIFACT_POWER_BONUS_PROG_HASH = '2214434133'; // #UPDATEME old 243419342 1793560787 oldest 978389300


export const INTERPOLATION_PATTERN = /\{var:\d+\}/g;


@Injectable()
export class ParseService {
    MAX_LEVEL = 50;


    HIDE_PROGRESSIONS = [
        '3468066401', // The Nine
        '1714509342', // Future War Cult
        '2105209711', // New Monarchy
        '3398051042', // Dead Orbit
        '3859807381', // Rasputin
        '1482334108', // Leviathan
        '2677528157', // "Follower of Osiris"

    ];

    // These are milestones that may show unavailable in Activity list upon completion
    // causing them to incorrectly show as "not unlocked" when they're actually done
    // ignoring this for now since it's even more widespread (VoG, NF, and more also affected)
    ALWAYS_AVAILABLE_MS = [
        '3312774044', // Crucible
        '3448738070', // Gambit
        '1437935813', // Vanguard
        '3831234800', // Wellspring
        '3007559996' // Trials
    ]

    ACCOUNT_LEVEL = [
        '4203877294', // Fynch
        // '1983115403', // House of light #UPDATEME
        // '3611983588', // CROW
        // '2126988316', // Obelisk: Mars
        // '2468902004', // Obelisk: Nessus
        // '3258748553', // Obelisk: Tangled Shore
        // // '1482334108', // Leviathan
        // '185244751', // Obelisk: EDZ
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

    private static decimalToFraction(value: number): Fraction {
        if (value === parseInt(value.toString(), 10)) {
            return null;
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
            const x = Math.abs(ParseService.greatestCommonDenominator(top, bottom));
            return {
                top: top / x,
                bottom: bottom / x
            };
        }
    }

    private static greatestCommonDenominator(a: number, b: number) {
        return (b) ? ParseService.greatestCommonDenominator(b, a % b) : a;
    }

    private calculateMaxLight(chars: Character[], gear: InventoryItem[], artifactBonus: number) {
        const tempGear = gear.slice(0);
        tempGear.sort((a, b) => {
            return a.power > b.power ? -1 : a.power < b.power ? 1 : 0;
        });
        for (const char of chars) {
            const powerLevels: number[] = [];
            for (const bucketHash of BUCKETS_ALL_POWER) {
                const best = tempGear.find((itm) => {
                    if (!itm.inventoryBucket) {
                        return false;
                    }
                    if (itm.inventoryBucket.hash !== bucketHash) {
                        return false;
                    }
                    if (itm.classAllowed == ClassAllowed.Any || itm.classAllowed == char.classType) {
                        return true;
                    }
                    return false;
                });
                if (best) {
                    powerLevels.push(best.power);
                    char.bestPlGear[bucketHash] = best;
                }
            }
            if (powerLevels.length > 0) {
                const basePL = powerLevels.reduce((sume, el) => sume + el, 0) / powerLevels.length;
                char.basePL = Math.floor(basePL);
                char.light = Math.floor(basePL) + artifactBonus;
                char.lightFraction = ParseService.decimalToFraction(basePL + artifactBonus);
                if (!char.lightFraction) {
                    char.basePLString = `${Math.floor(basePL)} Base PL`;
                } else {
                    char.basePLString = `${Math.floor(basePL)} ${char.lightFraction.top}/${char.lightFraction.bottom} Base PL`;
                }
            } else {
                // this account is weird, don't worry about it. probaby got this on the clan page when using invalid account combos
            }
        }
    }

    private async parseCharacter(c: PrivCharacter): Promise<Character> {
        const char: Character = new Character(c.membershipType, c.membershipId,
            this.destinyCacheService.cacheLite.Class[c.classHash].displayProperties.name, c.light, c.characterId);

        char.dateLastPlayed = c.dateLastPlayed;
        char.minutesPlayedThisSession = c.minutesPlayedThisSession;
        char.minutesPlayedTotal = +c.minutesPlayedTotal;

        char.emblemBackgroundPath = c.emblemBackgroundPath;
        char.emblemPath = c.emblemPath;
        if (char.emblemPath == '/img/misc/missing_icon_d2.png') {
            char.emblemPath = null;
        }
        char.title = '';
        if (c.titleRecordHash != null) {
            const rDesc = await this.destinyCacheService.getRecord(c.titleRecordHash);
            if (rDesc != null) {
                if (rDesc.titleInfo != null) {
                    char.title = rDesc.titleInfo.titlesByGenderHash[c.genderHash];
                } else {
                    char.title = 'Secret';
                }

            }

        }

        char.gender = this.destinyCacheService.cacheLite.Gender[c.genderHash].displayProperties.name;
        char.race = this.destinyCacheService.cacheLite.Race[c.raceHash].displayProperties.name;
        char.classType = c.classType;
        char.stats = [];
        Object.keys(c.stats).forEach(key => {
            const val: number = c.stats[key];
            const desc: any = this.destinyCacheService.cacheLite.Stat[key];
            const name = desc.displayProperties.name;
            const sDesc = desc.displayProperties.description;
            char.stats.push(new CharacterStat(name, sDesc, val));
        });
        return char;
    }

    private async populateActivities(c: Character, _act: any): Promise<void> {
        const hash: number = _act.currentActivityHash;
        const modeHash: number = _act.currentActivityModeHash;

        if (hash !== 0) {
            const act: CurrentActivity = new CurrentActivity();
            act.dateActivityStarted = _act.dateActivityStarted;

            const desc: any = await this.destinyCacheService.getActivity(hash);
            if (desc) {
                act.name = desc.displayProperties.name;
            }
            if (modeHash) {
                const modeDesc: any = await this.destinyCacheService.getActivityMode(modeHash);
                if (modeDesc) {
                    act.type = modeDesc.displayProperties.name;
                }
            }
            if (act.name != null && act.name.trim().length > 0) {
                c.currentActivity = act;
            }
        }
    }

    // Crucible and glory have progressions working together
    private static parseProgression(p: PrivProgression, desc: any, suppProg?: PrivProgression): Progression {
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
                name = 'Gunsmith';
                info = 'Banshee';
            } else if (name === 'Conscientious Objector')  {
                name = 'Fynch';
                info = 'Conscientious Objector';
            } else if (name === 'Purveyor of Strange Goods')  {
                name = 'Xur';
                info = 'Purveyor of Strange Goods';
            } else if (name === 'Hero of Six Fronts')  {
                name = 'Saint-14';
                info = 'Trials';
            } else if (name === 'Hero of Six Fronts')  {
                name = 'The Drifter';
                info = 'Gambit';
            } else if (name === 'Classified') {
                return null;
            }

            // fix names on clan progressions
            if (p.progressionHash === 3759191272) { name = 'Guided Trials'; }
            if (p.progressionHash === 1273404180) { name = 'Guided Nightfall'; }
            if (p.progressionHash === 3381682691) { name = 'Guided Raid'; }
            if (p.progressionHash === +ARTIFACT_UNLOCK_PERK_PROG_HASH) { name = 'Artifact Perk Unlocks'; }
            if (p.progressionHash === +ARTIFACT_POWER_BONUS_PROG_HASH) { name = 'Artifact Power Bonus'; }


            prog.name = name;
            if ('Resonance Rank' == prog.name) {
                return null;
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


    private async addPseudoMilestone(key: string, milestonesByKey: { [id: string]: MileStoneName }, milestoneList: MileStoneName[], dependsOn?: string[]) {
        if (milestonesByKey[key] == null && key != '534869653') {  // skip Xur
            const skipDesc = await this.destinyCacheService.getMilestone(key);
            if (skipDesc != null && (skipDesc.milestoneType == 3 || skipDesc.milestoneType == 4)) {
                let descRewards = await this.parseMilestoneRewards(skipDesc);
                if (descRewards == null || descRewards.trim().length == 0) {
                    descRewards = 'Unknown';
                }
                const ms2: MileStoneName = {
                    key: skipDesc.hash + '',
                    resets: milestonesByKey['3603098564'].resets, // use weekly clan XP
                    rewards: descRewards,
                    boost: this.parseMilestonePl(descRewards),
                    name: skipDesc.displayProperties.name,
                    desc: skipDesc.displayProperties.description,
                    hasPartial: false,
                    dependsOn: dependsOn==null ? []: dependsOn
                };
                milestoneList.push(ms2);
                milestonesByKey[ms2.key] = ms2;
            } else if (skipDesc != null) {
                // do nothing
            } else {
                console.log('Skipping unknown milestone: ' + key);
            }
        }
    }


    private async populateProgressions(c: Character, _prog: any, milestonesByKey: { [id: string]: MileStoneName }, milestoneList: MileStoneName[], accountProgressions: Progression[]): Promise<void> {
        c.milestones = {};
        c.notReady = false;

        if (_prog.milestones != null) {
            // milestones don't work properly when PL's are too low, try to account for this
            // specifically they tend to not show up, which makes it look like they're complete (rather than actually locked)
            if (c.light < Const.LIGHT_TOO_LOW) {
                c.notReady = true;
            }
            // repeat for each character
            for (const key of Object.keys(_prog.milestones)) {
                if (Const.HIDE_MILESTONES.includes(key)) {
                    continue;
                }
                const ms: PrivMilestone = _prog.milestones[key];

                // special case for clan rewards
                if (key === '4253138191') {
                    const desc = await this.destinyCacheService.getMilestone(ms.milestoneHash);
                    // grab weekly reset from this
                    c.startWeek = new Date(ms.startDate);
                    c.endWeek = new Date(ms.endDate);

                    const clanMilestones: ClanMilestoneResult[] = [];
                    ms.rewards.forEach(r => {
                        // last week, for testing
                        // if (r.rewardCategoryHash == 4258746474) {
                        // this week's clan rewards
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
                    await this.addPseudoMilestone(key, milestonesByKey, milestoneList);
                }

                // if they finished all, then force them in anyway, if the public milestones exist already this will do nothing
                // this is needed to fix disappearing weekly milestones that are also not in the public milestone list
                // weekly strikes
                // this.addPseudoMilestone('1437935813', milestonesByKey, milestoneList);


                let total = 0;
                let complete = 0;
                let phases = [];
                let info: string = null;
                let suppInfo: string = null;
                let readyToCollect = false;
                let oPct = 0;
                if (ms.availableQuests != null) {

                    for (const q of ms.availableQuests) {
                        total++;
                        if (key === '466653501') {
                            if (q.status.stepHash != null && q.status.stepHash > 0) {

                                const sDesc = await this.destinyCacheService.getInventoryItem(q.status.stepHash);
                                if (sDesc != null) {
                                    suppInfo = sDesc.displayProperties.description;
                                }
                            }
                        }
                        if (q.status.completed) { complete++; }
                        if (q.status.completed === false && q.status.started === true) {
                            if (q.status.stepObjectives != null) {
                                for (const o of q.status.stepObjectives) {
                                    const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
                                    if (oDesc.completionValue != null && oDesc.completionValue > 0) {
                                        oPct = o.progress / oDesc.completionValue;
                                        if (suppInfo == null && oDesc.completionValue > 1) {
                                            suppInfo = o.progress + ' / ' + oDesc.completionValue;
                                        } else if (oDesc.completionValue == 1) {
                                            if (oDesc.progressDescription) {
                                                if (
                                                    oDesc.progressDescription.endsWith(' visited')
                                                    || oDesc.progressDescription.toLowerCase().startsWith('speak with')
                                                    || oDesc.progressDescription.toLowerCase().startsWith('reward collected')
                                                    || oDesc.progressDescription.toLowerCase().endsWith('for a reward.')
                                                ) {
                                                    readyToCollect = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else if (ms.activities != null && ms.activities.length > 0) {
                    const act = ms.activities[0];
                    if (act.challenges != null && act.challenges.length > 0) {
                        const challenge = act.challenges[0];
                        if (challenge.objective != null) {
                            const obj = challenge.objective;
                            const oDesc = await this.destinyCacheService.getObjective(obj.objectiveHash);
                            if (oDesc != null) {
                                if (!oDesc.redacted) {
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
                const m: MilestoneStatus = new MilestoneStatus(key, complete === total, pct, info, [suppInfo], phases, false, false, readyToCollect);
                c.milestones[key] = m;
            }
        }

        const factions: Progression[] = [];
        if (_prog.factions != null) {
            for (const key2 of Object.keys(_prog.factions)) {
                const p: PrivProgression = _prog.factions[key2];
                const fDesc = await this.destinyCacheService.getFaction(p.factionHash);
                const prog: Progression = ParseService.parseProgression(p, fDesc);
                if (prog != null) {
                    if (this.HIDE_PROGRESSIONS.indexOf(prog.hash) >= 0) {
                        continue;
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
            }
        }
        c.maxLevel = this.MAX_LEVEL;

        // only progression we care about right now are Legend, Glory, Crucible, and Season Pass
        if (_prog.progressions) {
            const sp = await this.getSeasonProgression();
            const currentRankProgressionHashes: number[] = this.destinyCacheService.cacheLite.destiny2CoreSettings.currentRankProgressionHashes;
            for (const key of Object.keys(_prog.progressions)) {
                const iKey: number = parseInt(key, 10);
                if ((currentRankProgressionHashes.indexOf(iKey) >= 0) // crucible/gambit/glory
                    || key == sp.rewardProgressionHash
                    || key == sp.prestigeProgressionHash) {
                    const p: PrivProgression = _prog.progressions[key];
                    const suppProg: PrivProgression = p;
                    let progDesc = await this.destinyCacheService.getProgression(p.progressionHash);
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


                    const prog: Progression = ParseService.parseProgression(p, progDesc, suppProg);
                    if (prog != null) {
                        const found = accountProgressions.find(x => x.hash == prog.hash);
                        if (!found) {
                            ParseService.cookAccountProgression(prog);
                            accountProgressions.push(prog);
                        }
                    }
                } else if (key === '540048094') {
                    const p: PrivProgression = _prog.progressions[key];
                    const pDesc = await this.destinyCacheService.getProgression(p.progressionHash);
                    const prog: Progression = ParseService.parseProgression(p, pDesc);
                    prog.name = 'Personal Clan XP';
                    prog.currentProgress = prog.weeklyProgress;
                    prog.percentToNextLevel = prog.currentProgress / 5000;
                    if (prog != null) {
                        factions.push(prog);
                    }
                }
            }

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

    private async getSeasonProgression(): Promise<SeasonPass> {
        const hash = this.destinyCacheService.cacheLite.destiny2CoreSettings.currentSeasonHash;
        const s: Season = await this.destinyCacheService.getSeason(hash);
        const sp: SeasonPass = await this.destinyCacheService.getSeasonPass(s.seasonPassHash);
        return sp;
    }


    public static getBasicValue(val: any): number {
        if (val == null) { return null; }
        if (val.basic == null) { return; }
        return val.basic.value;
    }

    public static getBasicDisplayValue(val: any): string {
        if (val == null) { return null; }
        if (val.basic == null) { return; }
        return val.basic.displayValue;
    }

    private async parseActivity(a): Promise<Activity> {
        const act: Activity = new Activity();

        act.period = a.period;
        act.referenceId = a.activityDetails.referenceId;
        act.instanceId = a.activityDetails.instanceId;
        act.mode = SimpleParseService.lookupMode(a.activityDetails.mode);
        act.type = '';
        const desc: any = await this.destinyCacheService.getActivity(act.referenceId);
        if (desc) {
            act.name = desc.displayProperties.name;
            if (desc.activityTypeHash) {
                const typeDesc: any = await this.destinyCacheService.getActivityType(desc.activityTypeHash);
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
            const isGambit = desc?.activityModeTypes?.indexOf(63) >= 0;
            if (desc && (desc.isPvP || isGambit)) {
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

    public async parseModifier(hash: string): Promise<NameDesc> {
        const jDesc = await this.destinyCacheService.getActivityModifier(hash);
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

    public static mergeAggHistory2(charAggHistDicts: { [key: string]: AggHistoryEntry }[]): AggHistoryEntry[] {
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
                model.hash = ParseService.dedupeArray(model.hash);
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
                    activityBestSingleGameScore: null,
                    fastestCompletionMsForActivity: null,
                    activityCompletions: 0,
                    charCompletions: [],
                    activityKills: null,
                    activityAssists: null,
                    activityDeaths: null,
                    activityPrecisionKills: null,
                    activitySecondsPlayed: null,
                    activityLightLevel: null,
                    efficiency: null
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
            return;
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

            const nf = ParseService.isActivityType(vDesc, 547513715) && vDesc.tier >= 2;
            const raid = ParseService.isActivityType(vDesc, 2043403989);
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
        }
        const timePlayed = a.activitySecondsPlayed + b.activitySecondsPlayed;        
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
            activityLightLevel: Math.max(a.activityLightLevel, b.activityLightLevel),
            efficiency: 0
        };
        ParseService.setEfficiency(returnMe);
        return returnMe;
    }

    private parseAggHistoryEntry(char: Character, name: string, a: any, type: string, vDesc: any): AggHistoryEntry {
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
            activityLightLevel: vDesc.activityLightLevel,
            efficiency: 0
        };
        ParseService.setEfficiency(returnMe);
        return returnMe;
    }

    public applyTagsToItem(items: InventoryItem[]) {
        const tags = this.destinyCacheService.cacheLite.PursuitTags!;
        const used = {};
        for (const s of items) {
            if (!tags[s.hash] || tags[s.hash].length == 0) {
                continue;
            }
            // don't double count bounties, werner-99 has an issue with this
            if (used[s.hash]) {
                continue;
            }
            used[s.hash] = true;
            const itemTags = tags[s.hash];
            s.vendorItemInfo.tags = itemTags.slice(0);
        }
    }

    private async parseMilestoneRewards(desc: any): Promise<string> {
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
                                const iDesc: any = await this.destinyCacheService.getInventoryItem(reI.itemHash);
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

    private parseMilestonePl(rewards: string): BoostInfo {
        let boost = Const.BOOST_DROP_TABLE[Const.BOOST_UNKNOWN];
        if (rewards) {
            if (rewards.startsWith('Powerful')) {
                if (rewards.endsWith('3)')) {
                    boost = Const.BOOST_DROP_TABLE[Const.BOOST_POWERFUL_3];
                } else if (rewards.endsWith('2)')) {
                    boost = Const.BOOST_DROP_TABLE[Const.BOOST_POWERFUL_2];
                } else {
                    boost = Const.BOOST_DROP_TABLE[Const.BOOST_POWERFUL_1];
                }
            } else if (rewards.startsWith('Pinnacle Gear (Weak)')) {
                boost = Const.BOOST_DROP_TABLE[Const.BOOST_PINNACLE_WEAK];
            } else if (rewards.startsWith('Pinnacle')) {
                boost = Const.BOOST_DROP_TABLE[Const.BOOST_PINNACLE];

            } else if (rewards.startsWith('Legendary')) {
                boost = Const.BOOST_DROP_TABLE[Const.BOOST_LEGENDARY];
            }
        }
        return boost;
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

    // private addNightfallLoot(msa: MilestoneActivity) {
    //     let lootHash = null;
    //     if (msa.name.indexOf('Lake of Shadows') >= 0) {
    //         lootHash = '3745974521'; // Militia's birthright
    //     } else if (msa.name.indexOf('Savathûn\'s Song') >= 0) {
    //         lootHash = '1457979868'; // Duty Bound
    //     } else if (msa.name.indexOf('Garden World') >= 0) {
    //         lootHash = '1174053886'; // Universal Wavefunction
    //     } else if (msa.name.indexOf('Arms Dealer') >= 0) {
    //         lootHash = '2757144092'; // The	Tilt Fuse
    //     } else if (msa.name.indexOf('Corrupted') >= 0) {
    //         lootHash = '1071542914'; // Horror's Least
    //     } else if (msa.name.indexOf('Exodus Crash') >= 0) {
    //         lootHash = '2757144093'; // Impact Velocity
    //     } else if (msa.name.indexOf('Hollowed Lair') >= 0) {
    //         lootHash = '4117693024'; // Mindbender's Amibition
    //     } else if (msa.name.indexOf('Insight Terminus') >= 0) {
    //         lootHash = '2154059444'; // Long Goodbye
    //     } else if (msa.name.indexOf('Inverted Spire') >= 0) {
    //         lootHash = '953357968'; // Trichromatic
    //     } else if (msa.name.indexOf('Pyramidion') >= 0) {
    //         lootHash = '990416096'; // Silicon Neuroma
    //     } else if (msa.name.indexOf('Savathun’s Song') >= 0) {
    //         lootHash = '1457979868'; // Duty Bound
    //     } else if (msa.name.indexOf('Strange Terrain') >= 0) {
    //         lootHash = '1929278169'; // Braytech Osprey
    //     } else if (msa.name.indexOf('Tree of Probabilities') >= 0) {
    //         lootHash = '4238497225'; // D.F.A.
    //     } else if (msa.name.indexOf('Warden of Nothing') >= 0) {
    //         lootHash = '233423981'; // Warden's Law
    //     } else if (msa.name.indexOf('Will of the Thousands') >= 0) {
    //         lootHash = '1311389413'; // Worm God Incarnation
    //     }
    //     if (lootHash) {
    //         msa.specialLoot = await this.destinyCacheService.getInventoryItem(lootHash];
    //     }
    // }

    private isDoubled(activities: MilestoneActivity[]): boolean {
        if (activities==null){ 
            return false;
        }
        for (const a of activities) {
            if (!a.modifiers) {
                continue;
            }
            for (const m of a.modifiers) {
                if (m.name.toLowerCase().startsWith('double')) {
                    return true;
                }
            }
        }

        return false;
    }

    public async parsePublicMilestones(resp: any, sampleProfile: any): Promise<PublicMilestonesAndActivities> {
        const msMilestones: PrivPublicMilestone[] = [];
        const returnMe: PublicMilestone[] = [];
        Object.keys(resp).forEach(key => {
            const ms: any = resp[key];
            msMilestones.push(ms);
        });
        for (const ms of msMilestones) {
            let activityRewards = '';
            const desc = await this.destinyCacheService.getMilestone(ms.milestoneHash);
            if (desc == null) {
                continue;
            }
            // skip weird old master class milestone
            if (ms.milestoneHash == 480262465) {
                continue;
            }
            let icon = desc.displayProperties.icon;
            const activities: MilestoneActivity[] = [];
            if (ms.activities != null) {
                for (const act of ms.activities) {
                    const aDesc = await this.destinyCacheService.getActivity(act.activityHash);
                    const modifiers: NameDesc[] = [];
                    if (act.modifierHashes != null && act.modifierHashes.length > 0) {
                        for (const n of act.modifierHashes) {
                            const mod: NameDesc = await this.parseModifier(n);
                            modifiers.push(mod);
                        }
                    }
                    if (activityRewards == null && aDesc.rewards != null && aDesc.rewards.length > 0 && aDesc.rewards[0].rewardItems.length > 0) {
                        const rewDesc: any = await this.destinyCacheService.getInventoryItem(aDesc.rewards[0].rewardItems[0].itemHash);
                        if (rewDesc != null) {
                            activityRewards = rewDesc.displayProperties.name;
                        }
                    }
                    let activityIcon: string = aDesc.displayProperties.icon;
                    if (activityIcon == null || activityIcon.indexOf('missing_icon') >= 0) {
                        if (aDesc.activityModeHashes && aDesc.activityModeHashes.length > 0) {
                            const amHash = aDesc.activityModeHashes[0];
                            const amDesc = await this.destinyCacheService.getActivityMode(amHash);
                            activityIcon = amDesc.displayProperties.icon;
                        }
                    }
                    activities.push({
                        hash: act.activityHash,
                        name: aDesc.displayProperties.name,
                        desc: aDesc.displayProperties.description,
                        ll: aDesc.activityLightLevel,
                        tier: aDesc.tier,
                        icon: activityIcon,
                        modifiers: modifiers
                    });
                }
            } else if (ms.availableQuests) {
                for (const q of ms.availableQuests) {
                    const iDesc: any = await this.destinyCacheService.getInventoryItem(q.questItemHash);
                    if (iDesc != null) {
                        if (iDesc.value != null && iDesc.value.itemValue != null && iDesc.value.itemValue.length > 0) {
                            // use the first listed reward, even if there are more
                            // deadly venatiks lists pinnacle as reward 2 b/c it's weird
                            const v = iDesc.value.itemValue[0];
                            if (v.itemHash != null && v.itemHash > 0) {
                                const rewDesc: any = await this.destinyCacheService.getInventoryItem(v.itemHash);
                                if (rewDesc != null) {
                                    activityRewards += rewDesc.displayProperties.name;
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
            const descRewards = await this.parseMilestoneRewards(desc);
            let rewards = '';
            if (descRewards && descRewards.trim().length > 0) {
                rewards = descRewards;
            } else if (activityRewards && activityRewards.trim().length > 0) {
                rewards = activityRewards;
            } else {
                let checkMe = '' + desc.displayProperties.name + desc.displayProperties.description;
                checkMe = checkMe.toLowerCase();
                if (checkMe.indexOf('raid') >= 0 || checkMe.indexOf('garden of salvation') >= 0) {
                    rewards = 'Legendary Gear';
                } else {
                    // console.log(desc.displayProperties.name + ' - ' + desc.hash + ' is missing rewards');
                    rewards = '???';
                }
            }
            if (ms.milestoneHash == 541780856 && rewards == '???') { // Deepstone Crypt
                rewards = 'Powerful Gear (Tier 1)';
            } else if (ms.milestoneHash == 3312774044) { // Crucible Playlist
                rewards = 'Pinnacle Gear (Weak)';
            } else if (ms.milestoneHash == 3448738070) { // Weekly Gambit
                rewards = 'Pinnacle Gear (Weak)';
            } else if (ms.milestoneHash == 1437935813) { // Weekly Vanguard
                rewards = 'Pinnacle Gear (Weak)';
            } else if (ms.milestoneHash == 3603098564) { // override clan weekly
                rewards = 'Pinnacle Gear (Weak)';
            } else if (ms.milestoneHash == 3632712541 && rewards == '???') { // battlegrounds
                rewards = 'Powerful Gear (Tier 1)';
            } else if (ms.milestoneHash == 1888320892 && rewards == '???') { // VoG
                rewards = 'Powerful Gear (Tier 3)';
            }
            const boost = this.parseMilestonePl(rewards);
            const sDesc = desc.displayProperties.description;
            const pushMe: PublicMilestone = {
                hash: ms.milestoneHash + '',
                name: desc.displayProperties.name,
                desc: sDesc,
                start: ms.startDate,
                end: ms.endDate,
                order: ms.order,
                icon: icon,
                activities: activities,
                rewards: rewards,
                boost,
                milestoneType: desc.milestoneType,
                dependsOn: [],
                doubled: this.isDoubled(activities)
            };
            if (pushMe.hash == '3628293757') {
                pushMe.name = 'Trials Three Wins';
            } else if (pushMe.hash == '3628293755') {
                pushMe.name = 'Trials Five Wins';
                pushMe.dependsOn = ['3628293757'];
            } else if (pushMe.hash == '3628293753') {
                pushMe.name = 'Trials Seven Wins';
                pushMe.dependsOn = ['3628293757', '3628293755'];
            } else if (pushMe.hash == '3632712541') {
                pushMe.name = 'Battlegrounds Playlist';
            } else if (pushMe.hash == '3568317242') {
                pushMe.dependsOn = ['1639406072'];
            } else if (pushMe.hash == '1322124257') {
                pushMe.dependsOn = ['1639406072', '3568317242'];
            }

            returnMe.push(pushMe);
        }

        const empireHunts: MilestoneActivity[] = [];
        const empireHuntKeys: string[] = [];

        if (sampleProfile?.characterActivities?.data) {
            for (const key of Object.keys(sampleProfile.characterActivities.data)) {
                const charAct = sampleProfile.characterActivities.data[key];
                if (charAct?.availableActivities?.length > 0) {
                    for (const aa of charAct.availableActivities) {
                        const vDesc: any = await this.destinyCacheService.getActivity(aa.activityHash);
                        if (vDesc?.displayProperties?.name?.startsWith('Empire Hunt')) {
                            if (empireHuntKeys.includes(aa.activityHash)) {
                                continue;
                            }
                            if (aa.recommendedLight < 1150) {
                                continue;
                            }
                            empireHuntKeys.push(aa.activityHash);
                            const milestoneActivity = await this.buildMilestoneActivity(aa);
                            empireHunts.push(milestoneActivity);
                        }
                    }
                }
            }
        }

        returnMe.sort((a, b) => {
            if (a.boost.sortVal < b.boost.sortVal) { return 1; }
            if (a.boost.sortVal > b.boost.sortVal) { return -1; }
            if (a.rewards < b.rewards) { return 1; }
            if (a.rewards > b.rewards) { return -1; }
            if (a.name < b.name) { return -1; }
            if (a.name > b.name) { return 1; }
            return 0;
        });
        let weekStart: Date = null;

        // grab special milestones to have them for the home screen and such
        for (const m of returnMe) {
            if (m.milestoneType == 3 && m.start && weekStart == null) {
                weekStart = parseISO(m.start);
            }
        }
        const pmsa: PublicMilestonesAndActivities = {
            publicMilestones: returnMe,
            crucible: returnMe.find(x => x.hash == '3312774044'),
            nightfall: returnMe.find(x => x.hash == '2029743966'),
            strikes: returnMe.find(x => x.hash == '1437935813'),
            empireHunts,
            weekStart: weekStart
        };

        if (pmsa.nightfall?.activities) {
            pmsa.nightfall.activities = pmsa.nightfall.activities.filter(x => {
                return x.name.startsWith('Nightfall');
            });
            pmsa.nightfall.activities.sort((a, b) => {
                const mla = a?.modifiers?.length;
                const mlb = b?.modifiers?.length;
                if (mla > mlb) { return -1; }
                if (mla < mlb) { return 1; }
                return 0;
            });
            for (const nfa of pmsa.nightfall.activities) {
                if (nfa.name.endsWith('Grandmaster')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP + 40)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP + 40;
                    }
                } else if (nfa.name.endsWith('Master')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP + 20)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP + 20;
                    }
                } else if (nfa.name.endsWith('Legend')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP - 10)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP - 10;
                    }
                } else if (nfa.name.endsWith('Hero')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP - 40)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP - 40;
                    }
                } else if (nfa.name.endsWith('Adept')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP - 80)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP - 80;
                    }
                }
            }
        }
        if (pmsa.empireHunts) {
            pmsa.empireHunts.sort((a, b) => {
                const mla = a?.modifiers?.length;
                const mlb = b?.modifiers?.length;
                if (mla > mlb) { return -1; }
                if (mla < mlb) { return 1; }
                return 0;
            });
        }

        return pmsa;
    }

    public async parseActivities(a: any[]): Promise<Activity[]> {
        const returnMe: any[] = [];
        for (const act of a) {
            const parsed = await this.parseActivity(act);
            if (parsed != null) {
                returnMe.push(parsed);
            }
        }
        return returnMe;
    }

    private async buildMilestoneActivity(aa: any): Promise<MilestoneActivity> {
        const desc: any = await this.destinyCacheService.getActivity(aa.activityHash);
        if (!desc || !desc.displayProperties || !desc.displayProperties.name) {
            return null;
        }
        const modifiers: NameDesc[] = [];
        if (aa.modifierHashes && aa.modifierHashes.length > 0) {
            for (const modHash of aa.modifierHashes) {
                const mod: NameDesc = await this.parseModifier(modHash);
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

    private async parseCraftingMaterials(resp: any, currencies: Currency[]) { 
        // Name: Inv item Id | object id | profile var id
        // Neutral: 3491404510 | ?                 | 2747150405
        await this.parseCraftingMaterial(resp, '3491404510', 2747150405, currencies, 100);
        // Ruinous Element: 163842160| 2215515944  | 2653558736
        await this.parseCraftingMaterial(resp, '163842160', 2653558736, currencies, 100);
        // Adroit Element: 163842161 | 2215515945  | 2829303739
        await this.parseCraftingMaterial(resp, '163842161', 2829303739, currencies, 101);
        // Mutable  : 163842162 | 2215515946       | 1178490630
        await this.parseCraftingMaterial(resp, '163842162', 1178490630, currencies, 102);
        // Energetic: 163842163 | 2215515947       | 1238436609
        await this.parseCraftingMaterial(resp, '163842163', 1238436609, currencies, 103);
    }


    private async parseCraftingMaterial(resp: any, itemHash: string, varHash: number, currencies: Currency[], order: number) {

        const desc: any = await this.destinyCacheService.getInventoryItem(itemHash);
        const quantity: any = resp.profileStringVariables?.data?.integerValuesByHash[varHash];
        let maxStackSize = 99999;
        if (desc.inventory?.maxStackSize) {
            maxStackSize = desc.inventory.maxStackSize;
        }
        if (quantity!=null) { 
            currencies.push(new Currency(itemHash, desc.displayProperties.name, desc.displayProperties.icon, quantity, CurrencyType.Crafting, order, maxStackSize));
        }

    }


    private async parseProfileChecklists(resp: any): Promise<Checklist[]> {
        const checklists: Checklist[] = [];

        if (resp.profileProgression != null && resp.profileProgression.data != null && resp.profileProgression.data.checklists != null) {
            const oChecklists: any = resp.profileProgression.data.checklists;
            for (const key of Object.keys(oChecklists)) {
                // skip raid lair
                if (key === '110198094') { return; }
                const vals: any = oChecklists[key];
                const desc: any = await this.destinyCacheService.getChecklist(key);
                if (desc == null) {
                    continue;
                }
                let cntr = 0, cntChecked = 0;
                const checkListItems: ChecklistItem[] = [];
                let hasDescs = false;
                for (const entry of desc.entries) {
                    const hash = entry.hash;
                    const name = entry.displayProperties.name;
                    const checked = vals[entry.hash];
                    let cDesc = entry.displayProperties.description;
                    cntr++;
                    if (entry.itemHash) {
                        const iDesc: any = await this.destinyCacheService.getInventoryItem(entry.itemHash);
                        cDesc = iDesc.displayProperties.description;
                    }
                    if (entry.activityHash) {
                        const iDesc: any = await this.destinyCacheService.getActivity(entry.activityHash);
                        cDesc = iDesc.displayProperties.description;
                    }
                    if (cDesc == null || cDesc.length === 0) {
                        cDesc = null;
                    }
                    if (!hasDescs && cDesc != null) {
                        hasDescs = true;
                    }

                    const checklistItem: ChecklistItem = {
                        hash: hash,
                        name: name,
                        checked: checked,
                        video: entry.video,
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
                    continue;
                }

                const checklist: Checklist = {
                    hash: key,
                    name: checklistName,
                    complete: cntChecked,
                    video: desc.video,
                    order: desc.index,
                    total: cntr,
                    entries: checkListItems,
                    hasDescs: hasDescs
                };
                checklists.push(checklist);
            }
        }

        checklists.sort(function (a, b) {
            if (a.order < b.order) {
                return -1;
            }
            if (a.order > b.order) {
                return 1;
            }
            return 0;
        });
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
    private async parseArtifactProgressions(resp: any, chars: Character[], accountProgressions: Progression[]): Promise<number> {
        if (resp.profileProgression == null || resp.profileProgression.data == null
            || resp.profileProgression.data.seasonalArtifact == null) {
            return null;
        }
        const _art = resp.profileProgression.data.seasonalArtifact;

        let pointProg = _art.pointProgression;
        if (pointProg == null) {
            pointProg = this.getSpecificCharProg(resp, chars, ARTIFACT_UNLOCK_PERK_PROG_HASH);
            if (pointProg == null) {
                return null;
            }
        }
        let powerProg = _art.powerBonusProgression;
        if (powerProg == null) {
            powerProg = this.getSpecificCharProg(resp, chars, ARTIFACT_POWER_BONUS_PROG_HASH);
            if (powerProg == null) {
                return null;
            }
        }

        const pointProgDesc = await this.destinyCacheService.getProgression(pointProg.progressionHash);
        let parsedProg: Progression = ParseService.parseProgression(pointProg,
            pointProgDesc, pointProg);
        if (parsedProg != null) {
            accountProgressions.push(parsedProg);
        }
        const powerProgDesc = await this.destinyCacheService.getProgression(powerProg.progressionHash);
        parsedProg = ParseService.parseProgression(powerProg, powerProgDesc, powerProg);
        if (parsedProg != null) {
            accountProgressions.push(parsedProg);
        }
        // return _art.powerBonus;
        return powerProg.level;

    }

    private async parseCharChecklists(resp: any, chars: Character[]): Promise<CharChecklist[]> {
        const checklists: CharChecklist[] = [];
        if (resp.characterProgressions && resp.characterProgressions.data) {
            for (const char of chars) {
                const charProgs = resp.characterProgressions.data[char.characterId];
                if (charProgs) {
                    const oChecklists: any = charProgs.checklists;
                    for (const key of Object.keys(oChecklists)) {
                        const vals: any = oChecklists[key];
                        const desc: any = await this.destinyCacheService.getChecklist(key);
                        if (desc == null) {
                            continue;
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
                                continue;
                            }

                            checklist = {
                                hash: key,
                                name: checklistName,
                                maxComplete: 0,
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
                    }
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
                if (entry.allDone) {
                    checklist.maxComplete++;
                }
            }
        }
        return checklists;
    }

    private async buildBadge(node: TriumphNode): Promise<Badge> {
        const pDesc = await this.destinyCacheService.getPresentationNode(node.hash);
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

    private async buildSeal(node: TriumphNode, badges: Badge[]): Promise<Seal> {
        const pDesc = await this.destinyCacheService.getPresentationNode(node.hash);
        if (pDesc == null) { return null; }
        const completionRecordHash = pDesc.completionRecordHash;
        const cDesc = await this.destinyCacheService.getRecord(completionRecordHash);
        if (cDesc == null) { return null; }
        let title = 'Secret';
        if (cDesc.titleInfo != null) {
            title = cDesc.titleInfo.titlesByGenderHash[2204441813];
        }
        let progress = 0;
        let gildTotal = 0;
        let gildProgress = 0;
        for (const c of node.children) {
            if (c.complete) {
                progress++;
            }
            if ((c as TriumphRecordNode).forTitleGilding) {
                gildTotal++;
                if (c.complete) {
                    gildProgress++;
                }
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
        let completeValue = node.children.length;
        if (cDesc.objectiveHashes && cDesc.objectiveHashes.length == 1) {
            const oDesc = await this.destinyCacheService.getObjective(cDesc.objectiveHashes[0]);
            if (oDesc && oDesc.completionValue) {
                // MMXIX shows 25 even though there are only 24
                if (oDesc.completionValue < completeValue) {
                    completeValue = oDesc.completionValue;
                }
            }
        }

        const percent = Math.floor((100 * progress) / completeValue);
        return {
            hash: node.hash,
            name: node.name,
            desc: node.desc,
            icon: node.icon,
            children: node.children,
            title: title,
            percent: percent,
            progress: progress,
            complete: progress >= completeValue,
            gildTotal,
            gildProgress,
            completionValue: completeValue
        };
    }

    private findLeaves(triumphs: TriumphRecordNode[], hashes: number[]): TriumphRecordNode[] {        
        const returnMe: TriumphRecordNode[] = [];
        for (const t of triumphs) {            
            for (const p of t.path) {
                if (hashes.indexOf(+p.hash)>=0) {
                    returnMe.push(t);
                    break;
                }
            }
        }
        return returnMe;
    }


    public async parsePlayer(resp: any, publicMilestones: PublicMilestone[], detailedInv?: boolean, showZeroPtTriumphs?: boolean, showInvisTriumphs?: boolean): Promise<Player> {
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
        
        // handle string interpolation aka dynamic strings
        const dynamicStrings = ParseService.buildDynamicStrings(resp);

        const milestonesByKey: { [id: string]: MileStoneName } = {};
        if (publicMilestones != null) {
            for (const p of publicMilestones) {
                // things to skip
                if (
                    Const.HIDE_MILESTONES.includes(p.hash) ||
                    '534869653' === p.hash ||   // xur
                    '4253138191' === p.hash ||  // weekly clan engrams
                    '1815404320' === p.hash ||  // Dawning Duty weekly
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
                    key: p.hash,
                    resets: p.end,
                    rewards: p.rewards,
                    boost: p.boost,
                    name: p.name,
                    desc: p.desc,
                    hasPartial: false,
                    dependsOn: p.dependsOn,
                    publicInfo: p
                };
                // Fix heroic adventures
                if (ms.resets === '1970-01-01T00:00:00.000Z') {
                    ms.resets = null;
                }
                milestoneList.push(ms);
            }
            const missingMilestones = [];
            let msAdded = false;
            for (const m of missingMilestones) {
                if (milestonesByKey[m] != null) {
                    continue;
                }
                const msDesc = await this.destinyCacheService.getMilestone(m);
                const rewards = await this.parseMilestoneRewards(msDesc);
                const ms: MileStoneName = {
                    key: msDesc.hash + '',
                    resets: weekEnd,
                    rewards: rewards,
                    boost: this.parseMilestonePl(rewards),
                    name: msDesc.displayProperties.name,
                    desc: msDesc.displayProperties.description,
                    hasPartial: false,
                    dependsOn: []
                };
                milestoneList.push(ms);
                milestonesByKey[ms.key] = ms;
                msAdded = true;
            }
            for (const milestone of milestoneList) {
                milestonesByKey[milestone.key] = milestone;
            }
            this.addDisappearingMileStones(milestonesByKey, milestoneList);

            if (msAdded) {
                milestoneList.sort((a, b) => {
                    if (a.boost.sortVal < b.boost.sortVal) { return 1; }
                    if (a.boost.sortVal > b.boost.sortVal) { return -1; }
                    if (a.rewards < b.rewards) { return 1; }
                    if (a.rewards > b.rewards) { return -1; }
                    if (a.name < b.name) { return -1; }
                    if (a.name > b.name) { return 1; }
                    return 0;
                });

            }
        }


        if (resp.characters != null) {
            const oChars: any = resp.characters.data;
            for (const key of Object.keys(oChars)) {
                charsDict[key] = await this.parseCharacter(oChars[key]);
            }
            if (resp.characterProgressions) {
                if (resp.characterProgressions.data) {
                    const oProgs: any = resp.characterProgressions.data;
                    // load progs for chars
                    for (const key of Object.keys(oProgs)) {
                        const curChar: Character = charsDict[key];
                        await this.populateProgressions(curChar, oProgs[key], milestonesByKey, milestoneList, accountProgressions);
                        hasWellRested = curChar.wellRested || hasWellRested;
                    }

                    // do a second pass for any missing milestones
                    for (const key of Object.keys(oProgs)) {
                        const c: Character = charsDict[key];
                        const availableActivities: { [key: string]: boolean } = {};
                        // if (resp.characterActivities
                        //     && resp.characterActivities.data
                        //     && resp.characterActivities.data[key]
                        //     && resp.characterActivities.data[key].availableActivities
                        // ) {
                        //     // do some weirdness for Master Empire hunts
                        //     let hasAccessTo1280EmpireHunt = false;
                        //     let incomplete1280Hunt = false;
                        //     for (const aa of resp.characterActivities.data[key].availableActivities) {
                        //         availableActivities[aa.activityHash] = true;
                        //         if (aa.recommendedLight == (Const.SEASON_PINNACLE_CAP + 20)) {
                        //             // while we're here check for Empire Hunt pinnacle.
                        //             // must be 1280 or don't bother looking (even though the object shows up at lower PLs)
                        //             const vDesc: any = await this.destinyCacheService.getActivity(aa.activityHash);
                        //             // is this an empire hunt
                        //             if (vDesc?.displayProperties?.name?.startsWith('Empire Hunt')) {
                        //                 hasAccessTo1280EmpireHunt = true;
                        //                 if (aa.challenges?.length > 0) {
                        //                     for (const challenge of aa.challenges) {
                        //                         if (challenge.objective?.objectiveHash == 1980717736) {
                        //                             // if this is here it shouldn't be complete, these disappear when complete
                        //                             if (!challenge.objective.complete) {
                        //                                 incomplete1280Hunt = true;
                        //                                 break;
                        //                             }

                        //                         }
                        //                     }
                        //                 }
                        //             }
                        //         }
                        //     }
                        //     c.milestones[Const.PSUEDO_MASTER_EMPIRE_HUNT] = new MilestoneStatus(Const.PSUEDO_MASTER_EMPIRE_HUNT, !incomplete1280Hunt, incomplete1280Hunt ? 0 : 1, null, null, [], !hasAccessTo1280EmpireHunt, c.notReady);
                        // }
                        for (const missingKey of Object.keys(milestonesByKey)) {

                            if (c.milestones[missingKey] == null) {
                                const mDesc = await this.destinyCacheService.getMilestone(missingKey);
                                if (mDesc) {
                                    let activityAvailable = false;
                                    if (availableActivities && mDesc.activities && mDesc.activities.length > 0) {
                                        for (const a of mDesc.activities) {
                                            const activityHash = a.activityHash;
                                            if (!activityHash) {
                                                continue;
                                            }
                                            if (availableActivities[activityHash]) {
                                                activityAvailable = true;
                                            }
                                        }
                                    } else {
                                        activityAvailable = true;
                                    }

                                    // hack for Trials rounds where the activity is sometimes missing anyway asdf
                                    // if (!activityAvailable && this.ALWAYS_AVAILABLE_MS.indexOf(missingKey) >= 0) {
                                    //     activityAvailable = true;
                                    // }
                                    // We're just going to disabled that checking for now, since EVERYTHING seems wrong after Witch Queen
                                    if (!activityAvailable) {
                                        activityAvailable = true;
                                    }
                                    c.milestones[missingKey] = new MilestoneStatus(missingKey, true, 1, null, null, [], !activityAvailable, c.notReady);
                                    if (!activityAvailable || c.notReady) {
                                        // console.dir(c.milestones[missingKey]);
                                    }
                                }
                            }
                        }
                    }

                    // do a third pass for any dependent milestones
                    for (const key of Object.keys(oProgs)) {
                        const c: Character = charsDict[key];
                        for (const checkKey of Object.keys(milestonesByKey)) {
                            // if this milestone is missing it appears complete
                            // but if this milestone depends on other milestones it may
                            // just be simply missing
                            // so we have to see if those other miletsones are complete
                            if (!milestonesByKey[checkKey] || !milestonesByKey[checkKey].dependsOn || milestonesByKey[checkKey].dependsOn.length == 0) {
                                continue;
                            }
                            const checkMe = c.milestones[checkKey];
                            if (!checkMe.complete) {
                                continue;
                            }
                            const dependsOn = milestonesByKey[checkKey].dependsOn;
                            for (const dKey of dependsOn) {
                                const dependentMilestoneStatus = c.milestones[dKey];
                                if (!dependentMilestoneStatus.complete) {
                                    const incompletePlaceholder: MilestoneStatus = new MilestoneStatus(checkKey, false, 0, null, null, [], false, false);
                                    c.milestones[checkKey] = incompletePlaceholder;
                                    break;
                                }
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
                        await this.populateActivities(curChar, oActs[lastActKey]);
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
        const seasonChallengeEntries: SeasonalChallengeEntry[] = [];
        let lowHangingTriumphs: TriumphRecordNode[] = [];
        let patternTriumphs: TriumphRecordNode[] = [];
        let exoticCatalystTriumphs: TriumphRecordNode[] = [];
        let searchableTriumphs: TriumphRecordNode[] = [];
        let searchableCollection: TriumphCollectibleNode[] = [];
        const dictSearchableTriumphs: any = {};

        let colTree = [];
        let triumphScore = null;
        const currencies: Currency[] = [];
        const rankups: Rankup[] = [];
        const bounties: InventoryItem[] = [];
        const quests: InventoryItem[] = [];
        const gear: InventoryItem[] = [];
        let checklists: Checklist[] = [];

        let charChecklists: CharChecklist[] = [];
        let vault: Vault = null;
        let shared: Shared = null;
        let hasHiddenClosest = false;
        let artifactPowerBonus = 0;
        let gearMeta = null;

        if (!superprivate) {
            checklists = await this.parseProfileChecklists(resp);
            charChecklists = await this.parseCharChecklists(resp, chars);
            artifactPowerBonus = await this.parseArtifactProgressions(resp, chars, accountProgressions);
            // hit with a hammer
            if (resp.profileCurrencies?.data?.items != null) {
                for (const x of resp.profileCurrencies.data.items) {
                    const desc: any = await this.destinyCacheService.getInventoryItem(x.itemHash);
                    if (desc != null) {
                        let ctype = CurrencyType.Basic;
                        if (desc.hash=='2817410917' || desc.inventory.stackUniqueLabel && desc.inventory.stackUniqueLabel.toLowerCase().indexOf('transmog')>=0) {
                            ctype = CurrencyType.Cosmetic;
                        }
                        let maxStackSize = 99999;
                        if (desc.inventory?.maxStackSize) {
                            maxStackSize = desc.inventory.maxStackSize;
                        }
                        currencies.push(new Currency(desc.hash, desc.displayProperties.name, desc.displayProperties.icon, x.quantity, ctype, 0, maxStackSize));
                    }
                }
                // hack for crafting materials
                await this.parseCraftingMaterials(resp, currencies);
            }
            vault = new Vault();
            shared = new Shared();
            gearMeta = await this.handleGearMeta(chars, resp.characterInventories, resp.profileInventory);

            if (resp.characterInventories != null && resp.characterInventories.data != null) {
                for (const key of Object.keys(resp.characterInventories.data)) {
                    const char: Character = charsDict[key];
                    const options: Target[] = chars.filter(c => c !== char);
                    options.push(vault);
                    const items: PrivInventoryItem[] = resp.characterInventories.data[key].items;
                    for (const itm of items) {
                        const parsed: InventoryItem = await this.parseInvItem(itm, char, resp.itemComponents, detailedInv, options, resp.characterProgressions, resp, dynamicStrings);
                        if (parsed != null) {
                            // don't deal with chalice if there are no milestones
                            // if (parsed.type === ItemType.MissionArtifact && resp.characterProgressions) {
                            //     this.handleMissionArtifact(char, parsed, milestoneList, milestonesByKey, resp.characterPlugSets);
                            // } else
                            if (parsed.type === ItemType.Bounty) {
                                // ignore expired
                                if (!parsed.expired) {
                                    parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                                    bounties.push(parsed);
                                }
                            } else if (parsed.type === ItemType.Quest || parsed.type === ItemType.QuestStep) {
                                parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                                quests.push(parsed);
                            } else {
                                // if (parsed.objectives && parsed.objectives.length > 0) {
                                //     parsed.lowLinks = this.lowlineService.buildItemLink(parsed.hash);
                                //     quests.push(parsed);
                                //     console.log(`Non quest pushed ${parsed.name}`);


                                // }
                                gear.push(parsed);
                            }
                        }
                    }
                }
            }
            if (detailedInv === true) {
                if (resp.characterEquipment != null && resp.characterEquipment.data != null) {
                    for (const key of Object.keys(resp.characterEquipment.data)) {
                        const char: Character = charsDict[key];
                        const options: Target[] = chars.filter(c => c !== char);
                        options.push(vault);
                        const items: PrivInventoryItem[] = resp.characterEquipment.data[key].items;
                        for (const itm of items) {
                            const parsed: InventoryItem = await this.parseInvItem(itm, char, resp.itemComponents, detailedInv, options, null, resp);
                            if (parsed != null) {
                                gear.push(parsed);
                            }
                        }
                    }

                }
                if (resp.profileInventory != null && resp.profileInventory.data != null) {
                    const items: PrivInventoryItem[] = resp.profileInventory.data.items;
                    for (const itm of items) {

                        // shared inv bucket from "Vault"
                        let owner = vault;
                        let options: Target[];
                        if (itm.bucketHash != 138197802) {
                            owner = shared;
                            options = [vault];
                        } else {
                            options = [shared];
                        }
                        const parsed: InventoryItem = await this.parseInvItem(itm, owner, resp.itemComponents, detailedInv, options, null, resp);
                        if (parsed != null) {
                            if (parsed.type == ItemType.Weapon || parsed.type == ItemType.Armor || parsed.type == ItemType.Ghost || parsed.type == ItemType.Vehicle || parsed.type == ItemType.Subclass) {
                                parsed.options.pop();
                                for (const c of chars) {
                                    parsed.options.push(c);
                                }

                            }
                            gear.push(parsed);
                        }
                    }
                }
            }
            const nodes: any[] = [];
            const records: any[] = [];
            const collections: any[] = [];
            if (resp.profileRecords != null) {
                triumphScore = resp.profileRecords.data.score;
            }
            if (resp.profilePresentationNodes?.data) {
                nodes.push(resp.profilePresentationNodes.data.nodes);
            }
            if (resp.profileRecords?.data) {
                records.push(resp.profileRecords.data.records);
            }
            if (resp.profileCollectibles?.data) {
                collections.push(resp.profileCollectibles.data.collectibles);
            }

            for (const char of chars) {
                if (resp.characterPresentationNodes?.data) {
                    const presentationNodes = resp.characterPresentationNodes.data[char.characterId].nodes;
                    nodes.push(presentationNodes);
                }
                if (resp.characterRecords?.data) {
                    const _records = resp.characterRecords.data[char.characterId].records;
                    records.push(_records);
                }
                if (resp.characterCollectibles?.data) {
                    const _coll = resp.characterCollectibles.data[char.characterId].collectibles;
                    collections.push(_coll);
                }
            }

            if (collections.length > 0) {
                const tempBadgesParent = await this.handleColPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.badgesRootNode + '', nodes, collections, []);
                const tempBadges = tempBadgesParent.children;
                for (const ts of tempBadges) {
                    const badge = await this.buildBadge(ts);
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
                const colParent = await this.handleColPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.collectionRootNode + '', nodes, collections, collLeaves);
                colTree = colParent.children;
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

                // Seals 1652422747
                let parent: TriumphPresentationNode = await this.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.activeSealsRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                const tempSeals = parent?.children ? parent.children : [];
                for (const ts of tempSeals) {
                    const seal = await this.buildSeal(ts, badges);
                    if (seal != null) {
                        seals.push(seal);
                    }
                }
                // TODO this is kinda ghetto stringing together active triumphs, exotic catalysts, medals and lore
                // later on should split out active and legacy triumphs, and put catalysts, medals and lore into their own sections
                // Tree 1024788583
                parent = await this.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.recordsRootNode + '', nodes, records, triumphLeaves, showZeroPtTriumphs, showInvisTriumphs, []);
                recordTree = parent?.children ? parent.children : [];
                // exotic catalysts
                let oChild = await this.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.exoticCatalystsRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild.children[0]);
                }
                // medals
                oChild = await this.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.medalsRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild.children[0]);
                }

                // season challenges
                oChild = await this.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.seasonalChallengesPresentationNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild);
                    let weeklyChild: TriumphNode;
                    // we're at "Seasonal Challenges" which has two children, "Past Challenges" and "Weekly", we want weekly
                    // get down to the weeks, we have "weekly" and "past challenges"
                    if (oChild?.children?.length > 0) {
                        for (const c of oChild.children) {
                            if (c.name == 'Weekly') {
                                weeklyChild = c;
                            }
                        }
                    }
                    // we're on the "Weekly" each child is a week in the season
                    if (weeklyChild != null) {
                        const incomplete = {
                            name: 'All Incomplete',
                            records: []
                        };
                        for (const week of weeklyChild.children) {
                            seasonChallengeEntries.push({
                                name: week.name,
                                records: week.children as TriumphRecordNode[]
                            });
                            for (const r of week.children) {
                                if (!r.complete) {
                                    incomplete.records.push(r);
                                }
                            }
                        }
                        seasonChallengeEntries.push(incomplete);
                    }
                }

                // metrics
                // oChild = this.handleRecPresNode([], '1074663644', nodes, records, triumphLeaves, true, true);
                // recordTree.push(oChild);
                // lore
                oChild = await this.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.loreRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild.children[0]);
                }
                // dedupe list of leaves
                const leafSet: {[key: string]: TriumphRecordNode}= {};
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
                    if (a.percentToNextInterval > b.percentToNextInterval) { return -1; }
                    if (a.percentToNextInterval < b.percentToNextInterval) { return 1; }
                    return 0;
                });

                searchableTriumphs = triumphLeaves.filter(x => {
                    return (x.name != null) && (x.name.trim().length > 0);
                });
                
                exoticCatalystTriumphs = this.findLeaves(searchableTriumphs, [2744330515]);
                patternTriumphs = this.findLeaves(searchableTriumphs, [127506319, 3289524180, 1464475380]);

                // const mmxix = this.handleRecordNode([], '2254764897', records, showZeroPtTriumphs, showInvisTriumphs, false);
                // searchableTriumphs.push(mmxix);
                // const mmxx = this.handleRecordNode([], '4239091332', records, showZeroPtTriumphs, showInvisTriumphs, false);
                // searchableTriumphs.push(mmxx);
                // const highScore = this.handleRecordNode([], '2884099200', records, showZeroPtTriumphs, showInvisTriumphs, false);
                // searchableTriumphs.push(highScore);

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
                lowHangingTriumphs = lowHangingTriumphs.slice(0, 50);
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
        const specialProgressions = await this.cookSpecialAccountProgression(accountProgressions);
        accountProgressions.sort(function (a, b) {
            if (a.name > b.name) { return 1; }
            if (a.name < b.name) { return -1; }
            return 0;
        });
        if (currencies.length > 0) {
            await this.handleCurrency('2979281381', gear, currencies, CurrencyType.Upgrading, 11); // upgrade modules
            await this.handleCurrency('4257549985', gear, currencies, CurrencyType.Upgrading, 12); // shards
            await this.handleCurrency('4257549984', gear, currencies, CurrencyType.Upgrading, 13); // prisms
            await this.handleCurrency('3853748946', gear, currencies, CurrencyType.Upgrading, 14); // cores
            await this.handleCurrency('3702027555', gear, currencies, CurrencyType.Basic, 20); // spoils
            await this.handleCurrency('353704689', gear, currencies, CurrencyType.Crafting, 110); // Asc Alloy
            await this.handleCurrency('2497395625', gear, currencies, CurrencyType.Crafting, 111); // Res Alloy
            await this.handleCurrency('747321467', gear, currencies, CurrencyType.Basic, 21); // Intel
        }
        if (resp.profileInventory?.data) {
            this.calculateMaxLight(chars, gear, artifactPowerBonus);
        }
        // this.handleChallengeMilestones(chars, quests, milestoneList);

        this.cookMileStones(milestoneList, dynamicStrings);
        for (const t of searchableTriumphs) {
            t.desc = ParseService.dynamicStringReplace(t.desc, null, dynamicStrings);
        }
        for (const b of bounties) {
            b.desc = ParseService.dynamicStringReplace(b.desc, b.owner.getValue().id, dynamicStrings);
            for (const r of b.values) {
                r.name = ParseService.dynamicStringReplace(r.name, b.owner.getValue().id, dynamicStrings);
            }
        }
        // sort currencies by order
        currencies.sort((a, b) => {
            if (a.order > b.order) { return 1; }
            if (a.order < b.order) { return -1; }
            return 0;
        });
        return new Player(profile, chars, currentActivity, milestoneList, currencies, bounties, quests,
            rankups, superprivate, hasWellRested, checklists, charChecklists, triumphScore, recordTree, colTree,
            gear, vault, shared, lowHangingTriumphs, searchableTriumphs, searchableCollection,
            seals, badges, title, seasonChallengeEntries, hasHiddenClosest, accountProgressions, artifactPowerBonus,
            transitoryData, specialProgressions, gearMeta, patternTriumphs, exoticCatalystTriumphs);
    }

    // these are items that are not in the public milestones and also disappear on completion
    // we'll explicitly add them if they're not already present
    // do this all in one place for sanity sake
    private addDisappearingMileStones(milestonesByKey: { [id: string]: MileStoneName }, milestoneList: MileStoneName[]) {
        // if we don't have a clan milestone we probably don't have any milestones, nm
        if (milestonesByKey['3603098564'] == null) {
            return;
        }
       
        // GoS
        this.addPseudoMilestone('2712317338', milestonesByKey, milestoneList);
        // VoG
        this.addPseudoMilestone('1888320892', milestonesByKey, milestoneList);
        // GoA
        this.addPseudoMilestone('973171461', milestonesByKey, milestoneList);
        // VoD 1925223180
        this.addPseudoMilestone('1925223180', milestonesByKey, milestoneList);
        // Preservation
        this.addPseudoMilestone('4081841674', milestonesByKey, milestoneList);
        // Altars 2321298069
        this.addPseudoMilestone('2321298069', milestonesByKey, milestoneList);
        // Tank Buster 209031920
        this.addPseudoMilestone('209031920', milestonesByKey, milestoneList);
        // Dares of Eternity Pinnacle Challenge 475790763
        this.addPseudoMilestone('475790763', milestonesByKey, milestoneList);
        // Dares of Eternity Powerful Challenge 295129163
        this.addPseudoMilestone('295129163', milestonesByKey, milestoneList);
        
        
        // Runic Decoder 1 400869111
        this.addPseudoMilestone('400869111', milestonesByKey, milestoneList);
        // Runic Decoder 2 
        this.addPseudoMilestone('400869108', milestonesByKey, milestoneList, ['400869111']);
        // Runic Decoder 3 
        this.addPseudoMilestone('400869109', milestonesByKey, milestoneList, ['400869108']);

        // Witch Queen 100K
        this.addPseudoMilestone('363309766', milestonesByKey, milestoneList, ['400869111']);
        // Witch Queen completion
        this.addPseudoMilestone('2595878741', milestonesByKey, milestoneList, ['400869108']);
        
        // // Crucible 
        // this.addPseudoMilestone('3312774044', milestonesByKey, milestoneList);
        // // Gambit 
        // this.addPseudoMilestone('3448738070', milestonesByKey, milestoneList);
        // // Vanguard 
        // this.addPseudoMilestone('1437935813', milestonesByKey, milestoneList);
        // // Wellspring  
        // this.addPseudoMilestone('3831234800', milestonesByKey, milestoneList);

        // S15 milestones
        // Shattered Champions
        // this.addPseudoMilestone('3789620084', milestonesByKey, milestoneList);
        // astral alignment
        // this.addPseudoMilestone('1639406072', milestonesByKey, milestoneList);
        // this.addPseudoMilestone('3568317242', milestonesByKey, milestoneList);
        // this.addPseudoMilestone('1322124257', milestonesByKey, milestoneList);

        // const mseh: MileStoneName = {
        //     key: Const.PSUEDO_MASTER_EMPIRE_HUNT,
        //     resets: milestonesByKey['3603098564'].resets, // use weekly clan XP
        //     rewards: 'Pinnacle Gear',
        //     boost: Const.BOOST_DROP_TABLE[Const.BOOST_PINNACLE],
        //     name: 'Master Empire Hunt',
        //     desc: 'Complete a Master Empire Hunt',
        //     hasPartial: false,
        //     neverDisappears: true,
        //     dependsOn: []
        // };
        // milestoneList.push(mseh);
        // milestonesByKey[mseh.key] = mseh;
    }



    // do this all in one place at the last minute
    // since we gather up milestones from all sorts of places
    private cookMileStones(milestoneList: MileStoneName[], dynamicStrings: DynamicStrings) {
        const presage = milestoneList.find(x => x.key == '3927548661');
        // if (presage) {
        //     presage.name = 'Presage Weekly';
        // }
        // const prophecy = milestoneList.find(x => x.key == '825965416');
        // if (prophecy) {
        //     prophecy.name = 'Prophecy Weekly';
        // }
        // const vog = milestoneList.find(x => x.key == '2279677721');
        // if (vog) {
        //     vog.name = 'Vault of Glass';
        // }
        const nfScore = milestoneList.find(x => x.key == '2029743966');
        if (nfScore) {
            nfScore.name = 'Nightfall - 100K';
        }
        const nfCompletions = milestoneList.find(x => x.key == '1942283261');
        if (nfCompletions) {
            nfCompletions.name = 'Nightfall - Completions';
        }
        const graspOfAvarice = milestoneList.find(x => x.key == '973171461');
        if (graspOfAvarice) {
            graspOfAvarice.name = 'Grasp Of Avarice Weekly';
        }
        
        const witchQueenPinnacle = milestoneList.find(x => x.key == '363309766');
        if (witchQueenPinnacle) {
            witchQueenPinnacle.name = 'Witch Queen Story - 100K';
        }
        const witchQueenWeekly = milestoneList.find(x => x.key == '2595878741');
        if (witchQueenWeekly) {
            witchQueenWeekly.name = 'Witch Queen Story - Completion';
        }
        // 1639406072, 3568317242, 1322124257
        // | s 3789620084

        // const netcrasher = milestoneList.find(x => x.key == '966446952');
        // if (netcrasher && netcrasher.rewards == 'Unknown') {
        //     netcrasher.rewards = 'Powerful Legacy Gear';
        //     netcrasher.boost = this.parseMilestonePl(netcrasher.rewards);
        // }
        // const shatteredChampions = milestoneList.find(x => x.key == '3789620084');
        // if (shatteredChampions && shatteredChampions.rewards == 'Unknown') {
        //     shatteredChampions.rewards = 'Pinnacle Gear';
        //     shatteredChampions.boost = this.parseMilestonePl(shatteredChampions.rewards);
        // }
        // astral alignment 1
        // let aa = milestoneList.find(x => x.key == '1639406072');
        // if (aa && aa.rewards == '???') {
        //     aa.rewards = 'Powerful Gear (Tier 3)';
        //     aa.boost = this.parseMilestonePl(aa.rewards);
        // }
        // astral alignment 2
        let aa = milestoneList.find(x => x.key == '3568317242');
        if (aa && aa.rewards == '???') {
            aa.rewards = 'Powerful Gear (Tier 2)';
            aa.boost = this.parseMilestonePl(aa.rewards);
        }
        // astral alignment 3
        aa = milestoneList.find(x => x.key == '1322124257');
        if (aa && aa.rewards == '???') {
            aa.rewards = 'Powerful Gear (Tier 3)';
            aa.boost = this.parseMilestonePl(aa.rewards);
        }
        // const rewiringTheLight = milestoneList.find(x => x.key == '3341030123');
        // if (rewiringTheLight && rewiringTheLight.rewards == 'Pinnacle Gear') {
        //     rewiringTheLight.rewards = 'Powerful Gear (Tier 3)';
        //     rewiringTheLight.boost = this.parseMilestonePl(rewiringTheLight.rewards);
        // }
        for (const m of milestoneList) {
            m.desc = ParseService.dynamicStringReplace(m.desc, null, dynamicStrings);
        }
    }

    private async handleGearMeta(chars: Character[], charInvs: any, profileInventory: any): Promise<GearMetaData> {
        if (profileInventory == null || profileInventory.data == null || profileInventory.data.items == null) {
            return {
                postmasterTotal: 0,
                postmaster: [],
                vault: null
            };
        }
        const generalDesc = await this.destinyCacheService.getInventoryBucket('138197802');
        const returnMe: GearMetaData = {
            postmasterTotal: 0,
            postmaster: [],
            vault: {
                count: profileInventory.data.items.filter(x => x.bucketHash == 138197802).length,
                total: generalDesc.itemCount
            }
        };
        if (charInvs == null || charInvs.data == null) {
            return returnMe;
        }
        const postmasterDesc = await this.destinyCacheService.getInventoryBucket('215593132');
        const postmasterMax = postmasterDesc.itemCount;
        for (const char of chars) {
            const key = char.characterId;
            const postmaster = charInvs.data[key].items.filter(x => x.bucketHash == 215593132);
            returnMe.postmaster.push({
                char,
                count: postmaster.length,
                total: postmasterMax
            });
            returnMe.postmasterTotal += postmaster.length;
        }
        return returnMe;
    }

    private async handleCurrency(hash: string, gear: InventoryItem[], currencies: Currency[], type: CurrencyType, order: number) {
        let curr = currencies.find(x => x.hash === hash);
        if (!curr) {
            const desc = await this.destinyCacheService.getInventoryItem(hash);
            if (!desc) {
                console.log('Missing desc for ' + hash);
                return;
            }
            let maxStackSize = 99999;
            if (desc.inventory?.maxStackSize) {
                maxStackSize = desc.inventory.maxStackSize;
            }
            curr = new Currency(hash, desc.displayProperties.name, desc.displayProperties.icon, 0, type, order, maxStackSize);
            currencies.push(curr);
        }
        const ag = gear.filter(x => x.hash == hash);
        if (!ag || ag.length == 0) {
            return;
        }
        let total = 0;
        for (const g of ag) {
            total += g.quantity;
        }
        curr.count += total;
    }

    // private handleChallengeMilestones(chars: Character[], quests: InventoryItem[], milestoneList: MileStoneName[]) {
    //     if (quests == null || quests.length == 0) {
    //         return;
    //     }
    //     // we're not loading milestones
    //     if (chars[0].endWeek == null) {
    //         return;
    //     }
    //     // extra luna's '1257909267', '1652224118', '2256060246'
    //     // remove dark times 2743269252
    //     const challengeMilestones = ['247878674', '2701029102'];

    //     const foundMilestones = [];
    //     // is the char sitting on Mysterious Disturbance or In Search of Answers?
    //     const hasErisWorkToDo = {};
    //     for (const c of chars) {
    //         hasErisWorkToDo[c.characterId] = false;
    //     }

    //     for (const q of quests) { // luna's calling
    //         if (q.hash == '2178015352' || q.hash == '4039893890') {
    //             hasErisWorkToDo[(q.owner.getValue() as Character).characterId] = true;
    //         }
    //         for (const cHash of challengeMilestones) {
    //             if (q.hash == cHash ||
    //                 (cHash == '2701029102' &&
    //                     (q.hash == '1257909267' ||
    //                         q.hash == '1652224118' ||
    //                         q.hash == '2256060246'
    //                     ))
    //             ) {
    //                 if (foundMilestones.indexOf(cHash) < 0) {
    //                     foundMilestones.push(cHash);
    //                 }
    //                 const c = q.owner.getValue() as Character;
    //                 const obj = q.objectives[0];
    //                 const total = obj.completionValue ? obj.completionValue : 1;
    //                 const pct = obj.progress / total;
    //                 let info = null;
    //                 if (pct > 0 && pct < 1) {
    //                     info = Math.floor(100 * pct) + '% complete';
    //                 }
    //                 const suppInfo = obj.progress + ' / ' + obj.completionValue;
    //                 c.milestones[cHash] = new MilestoneStatus(cHash, obj.complete, pct, info, suppInfo, [], false, false);
    //             }
    //         }

    //     }
    //     for (const f of foundMilestones) {

    //         const fDesc = await this.destinyCacheService.getInventoryItem(f];
    //         if (fDesc==null) {
    //             continue;
    //         }
    //         const qHash = fDesc.objectives.questlineItemHash;
    //         const qDesc = await this.destinyCacheService.getInventoryItem(qHash];
    //         let rewardName = null;
    //         if (qDesc.value != null && qDesc.value.itemValue != null) {
    //             for (const val of qDesc.value.itemValue) {
    //                 if (val.itemHash === 0) { continue; }
    //                 const valDesc: any = await this.destinyCacheService.getInventoryItem(val.itemHash];
    //                 if (valDesc != null) {
    //                     rewardName = valDesc.displayProperties.name;
    //                     break;
    //                 }
    //             }
    //         }
    //         const ms: MileStoneName = {
    //             key: f,
    //             resets: chars[0].endWeek.toISOString(),
    //             rewards: rewardName,
    //             pl: this.parseMilestonePl(rewardName),
    //             name: qDesc.displayProperties.name,
    //             desc: fDesc.displayProperties.description,
    //             dependsOn: [],
    //             hasPartial: true,
    //             neverDisappears: false
    //         };
    //         milestoneList.push(ms);

    //         for (const c of chars) {
    //             if (c.milestones[f] != null) {
    //                 continue;
    //             }
    //             if (f == '2701029102' && hasErisWorkToDo[c.characterId]) {
    //                 c.milestones[f] = new MilestoneStatus(f, true, 0, null, null, null, true, false);
    //             } else {
    //                 c.milestones[f] = new MilestoneStatus(f, true, 1, null, null, [], false, c.notReady);
    //             }
    //         }
    //     }
    // }

    private async cookSpecialAccountProgression(accountProgressions: Progression[]): Promise<SpecialAccountProgressions> {
        const returnMe: SpecialAccountProgressions = {
            glory: null,
            seasonRank: null,
            crucibleRank: null,
            gambitRank: null,
            vanguardRank: null
        };
        if (accountProgressions != null) {
            const currentRankProgressionHashes: number[] = this.destinyCacheService.cacheLite.destiny2CoreSettings.currentRankProgressionHashes;
            let prestige: Progression = null;
            const sp = await this.getSeasonProgression();
            for (const ap of accountProgressions) {
                const iHash = parseInt(ap.hash, 10);
                const isSpecialRankProgression = currentRankProgressionHashes.indexOf(iHash) >= 0;
                if (isSpecialRankProgression && ap.hash == '2083746873') {
                    returnMe.crucibleRank = ap;
                } else if (isSpecialRankProgression && ap.hash == '3008065600') {
                    returnMe.gambitRank = ap;

                } else if (isSpecialRankProgression && ap.hash == '1647151960') {
                    returnMe.glory = ap;

                } else if (isSpecialRankProgression && ap.hash == '457612306') {
                    returnMe.vanguardRank = ap;
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

    private async handleRecPresNode(path: PathEntry[], key: string, pres: any[], records: any[], triumphLeaves: TriumphRecordNode[], showZeroPtTriumphs: boolean, showInvisTriumphs: boolean, extraRoots?: string[]): Promise<TriumphPresentationNode> {
        const val = this.getBestPres(pres, key);
        if (!val) {
            return null;
        }
        const pDesc = await this.destinyCacheService.getPresentationNode(key);
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
        let vaulted = 0;
        let vaultedIncomplete = 0;
        let vaultedComplete = 0;
        if (pDesc.children != null) {
            let presNodes = pDesc.children.presentationNodes.slice(0);
            let recNodes = pDesc.children.records.slice(0);
            if (extraRoots) {
                for (const extraRoot of extraRoots) {
                    const xrDesc = await this.destinyCacheService.getPresentationNode(extraRoot);
                    if (xrDesc == null) {
                        return null;
                    }
                    presNodes = presNodes.concat(xrDesc.children.presentationNodes);
                    recNodes = presNodes.concat(xrDesc.children.records);
                }
            }


            for (const child of presNodes) {
                const oChild = await this.handleRecPresNode(path.slice(), child.presentationNodeHash, pres, records, triumphLeaves, showZeroPtTriumphs, showInvisTriumphs);
                if (oChild == null) { continue; }
                children.push(oChild);
                unredeemedCount += oChild.unredeemedCount;
                total += oChild.totalPts;
                pts += oChild.pts;
                vaulted += oChild.vaultedChildren;
                vaultedComplete += oChild.vaultedChildrenComplete;
                vaultedIncomplete += oChild.vaultedChildrenIncomplete;
            }
            for (const child of recNodes) {
                const oChild = await this.handleRecordNode(path.slice(), child.recordHash, records, showZeroPtTriumphs, showInvisTriumphs);
                if (oChild == null) { continue; }
                triumphLeaves.push(oChild);
                if (oChild.invisible && !showInvisTriumphs) { continue; }
                if (oChild.score == 0 && !showZeroPtTriumphs) { continue; }
                children.push(oChild);
                if (oChild.complete && !oChild.redeemed) {
                    unredeemedCount++;
                }
                pts += oChild.earned;                
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
            totalPts: total,
            vaultedChildren: vaulted,
            vaultedChildrenComplete: vaultedComplete,
            vaultedChildrenIncomplete: vaultedIncomplete,
        };
    }

    private async handleRecordNode(path: PathEntry[], key: string, records: any[], showZeroPtTriumphs: boolean, showInvisTriumphs: boolean): Promise<TriumphRecordNode> {
        const rDesc = await this.destinyCacheService.getRecord(key);
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
        let percentToNextInterval = null;
        for (const o of iterateMe) {
            objIndex++;
            const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
            if (oDesc == null) { continue; }

            let score = null;
            if (isInterval && rDesc?.intervalInfo?.intervalObjectives && objIndex < rDesc.intervalInfo.intervalObjectives.length) {
                score = rDesc.intervalInfo.intervalObjectives[objIndex].intervalScoreValue;
            }

            const iObj: ItemObjective = {
                hash: o.objectiveHash,
                completionValue: o.completionValue ? o.completionValue : oDesc.completionValue,
                progressDescription: oDesc.progressDescription,
                progress: o.progress == null ? 0 : o.progress,
                complete: o.complete,
                score: score,
                percent: 0
            };
            if (iObj.complete && iObj.progress < 1) {
                iObj.progress = oDesc.completionValue;
            }

            let max = iObj.completionValue;
            if (iObj.completionValue == null || iObj.completionValue <= 0) {
                max = 1;
            }
            let objPercent = 100 * iObj.progress / max;
            if (objPercent > 100) { objPercent = 100; }
            iObj.percent = Math.floor(objPercent);

            totalProgress += oDesc.completionValue;
            objs.push(iObj);
            incompIntPercent = iObj.percent;
            if (percentToNextInterval == null && !o.complete) {
                percentToNextInterval = iObj.percent;
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

        const rewardValues: NameQuantity[] = [];
        if (rDesc.rewardItems) {
            let hasReward = false;
            for (const ri of rDesc.rewardItems) {
                if (ri.itemHash === 0) { continue; }
                const valDesc: any = await this.destinyCacheService.getInventoryItem(ri.itemHash);
                if (valDesc != null) {

                    searchText += ' ' + valDesc.displayProperties.name;

                    rewardValues.push({
                        hash: ri.itemHash,
                        name: valDesc.displayProperties.name,
                        quantity: ri.quantity,
                        icon: valDesc.displayProperties.icon,
                        itemTypeDisplayName: valDesc.itemTypeDisplayName?.trim().length > 0 ? valDesc.itemTypeDisplayName : null
                    });
                    if (valDesc.itemTypeDisplayName?.trim().length > 0) {
                        searchText += ' has:' + valDesc.itemTypeDisplayName.toLowerCase();
                    }
                    hasReward = true;
                }
            }
            if (hasReward) {
                searchText += ' has:reward';
            }
        }
        // it has other incomplete intervals, it's not really done
        if (incompIntPercent != null && incompIntPercent < 100) {
            complete = false;
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
            forTitleGilding: rDesc.forTitleGilding,
            title: title,
            children: null,
            path: path,
            lowLinks: this.lowlineService.buildRecordLink(key),
            interval: isInterval,
            earned: earnedPts,
            score: totalPts,
            percentToNextInterval: complete ? 100 : percentToNextInterval ? percentToNextInterval : percent,
            percent: complete ? 100 : incompIntPercent ? incompIntPercent : percent,
            searchText: searchText.toLowerCase(),
            invisible: invisible,
            pointsToBadge: pointsToBadge,
            rewardItems: rewardValues
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

    private async handleColPresNode(path: PathEntry[], key: string, pres: any[], collectibles: any[], collLeaves: TriumphCollectibleNode[]): Promise<TriumphPresentationNode> {
        const val = this.getBestPres(pres, key);
        if (val == null) {
            return null;
        }
        const pDesc = await this.destinyCacheService.getPresentationNode(key);
        if (pDesc == null) { return null; }
        path.push({
            path: pDesc.displayProperties.name,
            hash: key
        });
        const children = [];
        if (pDesc.children != null) {
            for (const child of pDesc.children.presentationNodes) {
                const oChild = await this.handleColPresNode(path.slice(0), child.presentationNodeHash, pres, collectibles, collLeaves);
                if (oChild == null) { continue; }
                children.push(oChild);
            }
            for (const child of pDesc.children.collectibles) {
                const oChild = await this.handleCollectibleNode(path.slice(0), child.collectibleHash, collectibles);
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

    private async handleCollectibleNode(path: PathEntry[], key: string, collectibles: any[]): Promise<TriumphCollectibleNode> {
        const cDesc = await this.destinyCacheService.getCollectible(key);
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

    private async parseQuestStep(stepHash: number, currentStepHash: number): Promise<QuestlineStep> {
        const desc: any = await this.destinyCacheService.getInventoryItem(stepHash);
        if (desc == null) { return null; }
        const values = [];
        if (desc.value != null && desc.value.itemValue != null) {
            for (const val of desc.value.itemValue) {
                if (val.itemHash === 0) { continue; }
                const valDesc: any = await this.destinyCacheService.getInventoryItem(val.itemHash);
                if (valDesc != null) {
                    values.push({
                        hash: valDesc.hash,
                        icon: valDesc.displayProperties.icon,
                        name: valDesc.displayProperties.name,
                        quantity: val.quantity
                    });
                }
            }
        }
        const objectives = [];
        if (desc.objectives != null && desc.objectives.objectiveHashes != null) {
            for (const objectiveHash of desc.objectives.objectiveHashes) {
                const oDesc = await this.destinyCacheService.getObjective(objectiveHash);
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
            hash: stepHash,
            name: desc.displayProperties.name,
            desc: desc.displayProperties.description,
            objectives: objectives,
            values: values,
            current: currentStepHash == stepHash
        };
    }

    private async parseQuestLine(qli: number, stepHash: number): Promise<Questline> {
        const qdesc: any = await this.destinyCacheService.getInventoryItem(qli);
        if (qdesc == null) { return null; }
        // if (qdesc.setData != null) { }
        if (qdesc.setData == null) { return null; }
        // wtf was this doing anyway?
        const qType = qdesc.setData.setType;
        // this is a milestone, don't show it here

        if ('challenge' == qType) {
            let skip = true;
            if (qdesc.displayProperties && qdesc.displayProperties.name) {
                const name = qdesc.displayProperties.name;
                // 2743269252 and 314306447 respectively
                // check by name so that other quests aren't filtered out in pursuits
                // these 2 challenges are special in that they're basically milestones but
                // only show up in the inv as challenges
                if (name == 'Dark Times' || name == 'Luna\'s Calling' || name == 'Nightmare Slayer') {
                    skip = false;
                }
            }
            if (skip) {
                return null;
            }
        }
        const steps = qdesc.setData.itemList;
        let cntr = 0;
        const oSteps = [];
        let progress = '';
        for (const step of steps) {
            cntr++;
            const oStep = await this.parseQuestStep(step.itemHash, stepHash);
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

    private static cookDamageType(damageType: DamageType): string {
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
        } else if (damageType == DamageType.Stasis) {
            return 'Stasis';
        } else {
            return '';
        }
    }

    private static isEnergyType(damageType: DamageType): boolean {
        if (damageType == DamageType.Arc) {
            return true;
        } else if (damageType == DamageType.Thermal) {
            return true;
        } else if (damageType == DamageType.Void) {
            return true;
        } else if (damageType == DamageType.Stasis) {
            return true;
        } else {
            return false;
        }
    }


    public static cookEnergyType(energyType: EnergyType): string {
        if (energyType == EnergyType.Any) {
            return 'Any';
        } else if (energyType == EnergyType.Arc) {
            return 'Arc';
        } else if (energyType == EnergyType.Thermal) {
            return 'Solar';
        } else if (energyType == EnergyType.Void) {
            return 'Void';
        } else if (energyType == EnergyType.Stasis) {
            return 'Stasis';
        } else {
            return '';
        }
    }


    private parseMasterwork(plugDesc: any): MasterworkInfo {
        if (plugDesc.plug == null) { return null; }
        if (plugDesc.plug.plugCategoryIdentifier == null) { return null; }
        if (plugDesc.plug.plugCategoryIdentifier.indexOf('masterworks.stat.') < 0) {
            return null;
        }
        // from here on out we know its MW
        if (plugDesc.investmentStats == null || plugDesc.investmentStats.length == 0) {
            return null;
        }
        const invStats = plugDesc.investmentStats[0];
        const tier = invStats.value;
        const statHash = invStats.statTypeHash;
        const statDesc: any = this.destinyCacheService.cacheLite.Stat[statHash];
        if (statDesc == null) {
            return null;
        }
        const name = statDesc.displayProperties.name;
        const desc = statDesc.displayProperties.description;

        return {
            hash: plugDesc.hash,
            name: name,
            desc: desc,
            icon: plugDesc.displayProperties.icon,
            tier: tier,
            godTierPve: false,
            godTierPvp: false,
            recommendedPvpMws: [],
            recommendedPveMws: []
        };
    }

    private applyPlugInventoryStats(target: InventoryPlug, plugDesc: any) {
        if (plugDesc.investmentStats && plugDesc.investmentStats.length > 0) {
            for (const invStat of plugDesc.investmentStats) {

                const statHash = invStat.statTypeHash;
                const statDesc: any = this.destinyCacheService.cacheLite.Stat[statHash];
                if (statDesc == null) {
                    continue;
                }
                const stat = new InventoryStat(statHash, statDesc.displayProperties.name,
                    statDesc.displayProperties.description, invStat.value, statDesc.index);
                target.inventoryStats.push(stat);
            }
        }
    }

    private static getPlugName(plugDesc: any): string {
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

    private parseItemStats(instanceData: any, desc: any, type: ItemType): InventoryStat[] {
        const stats: InventoryStat[] = [];
        if (desc && instanceData) {
            const statDict: { [hash: string]: InventoryStat; } = {};
            if (instanceData != null && instanceData.stats != null) {
                // grab the stats from the instance data from teh API
                Object.keys(instanceData.stats).forEach(key => {
                    const val: any = instanceData.stats[key];
                    const jDesc: any = this.destinyCacheService.cacheLite.Stat[key];
                    statDict[key] = new InventoryStat(key, jDesc.displayProperties.name,
                        jDesc.displayProperties.description, val.value, jDesc.index);
                });
                // also grab the stats from the API architetype
                const ostats = desc.stats.stats;
                Object.keys(ostats).forEach(key => {
                    const val: any = ostats[key];
                    // if we already got the real instance data, ignore the architetype stats
                    if (statDict[key] == null) {
                        const jDesc: any = this.destinyCacheService.cacheLite.Stat[key];
                        statDict[key] = new InventoryStat(key, jDesc.displayProperties.name,
                            jDesc.displayProperties.description, val.value, jDesc.index, true);
                    }
                });
                Object.keys(statDict).forEach(key => {
                    const val = statDict[key];
                    // armor with a stat penalty can be zero for a meaningful stat
                    if (val.value > 0 || (val.value == 0 && type == ItemType.Armor)) {
                        if (val.name != 'Defense' && val.name != 'Power' && val.name.length > 0) {
                            stats.push(val);
                        }
                    }
                });

                stats.sort((a, b) => {
                    return a.index > b.index ? 1 : a.index < b.index ? -1 : 0;
                });
            }
        }
        return stats;
    }


    public async parseInvItem(itm: PrivInventoryItem, owner: Target, itemComp: any, detailedInv: boolean, options: Target[], characterProgressions: any, resp?: any, dynamicStrings?: DynamicStrings): Promise<InventoryItem> {
        try {
            const desc: any = await this.destinyCacheService.getInventoryItem(itm.itemHash);
            if (desc == null) {
                console.log('Skipping - no desc: ' + itm.itemHash);
                return null;
                // return new InventoryItem(""+itm.itemHash, "Classified", equipped, owner, null, ItemType.None, "Classified");
            }
            // anything with no type goes away too

            let type: ItemType = desc.itemType;
            let itemTypeDisplayName = desc.itemTypeDisplayName;
            let deepSightProgress: ItemObjective = null;
            let craftProgress: WeaponShapeLevelObjective = null;

            // store any weapon perks whose stat mods we need to disregard: Currently only Elemental Capacitor
            const ignoreWeaponPerkStats: InventoryPlug[] = [];
            let redacted = false;
            if (desc.itemTypeDisplayName == null) {
                // handle hidden stuff, like early raid gear
                if (desc.redacted && desc.inventory != null) {
                    const bucketHash = desc.inventory.bucketTypeHash;
                    redacted = true;
                    if (bucketHash != null) {
                        if (BUCKETS_WEAPON.includes(bucketHash)) {
                            type = ItemType.Weapon;
                        } else if (
                            BUCKETS_ARMOR.includes(bucketHash)) {
                            type = ItemType.Armor;
                        } else {
                            // console.log('Skipping no type: ' + itm.itemHash);
                            return null;
                        }

                    }
                } else {
                    return null;
                }
            } else {
                type = desc.itemType;
            }
            const postmaster = (itm.bucketHash == 215593132);
            let ammoType: DestinyAmmunitionType;
            if (desc.equippingBlock != null) {
                ammoType = desc.equippingBlock.ammoType;
            }
            let description = desc.displayProperties.description;

            if (type === ItemType.None && desc.itemTypeDisplayName != null && desc.itemTypeDisplayName.indexOf('Bounty') >= 0) {
                type = ItemType.Bounty;
            }
            // if (itm.itemHash === 1115550924) {
            //     type = ItemType.Chalice;

            if (desc.itemTypeDisplayName == 'Modified Hive Artifact') {
                type = ItemType.MissionArtifact;

            } else if (desc.itemType === ItemType.None && desc.itemTypeDisplayName == 'Invitation of the Nine') {
                type = ItemType.Bounty;
            }

            if (type == ItemType.Bounty
                || type == ItemType.Quest
                || type == ItemType.QuestStep
                || type == ItemType.MissionArtifact) {
                // this is fine, keep going
            } else if (!detailedInv) {
                // nothing useful
                return null;
            } else {
                // gear we need to check on or not
                if (type === ItemType.Mod && desc.itemTypeDisplayName.indexOf('Mod') >= 0) {
                    type = ItemType.GearMod;
                    // mods we use the perk desc
                    if (desc.perks != null && desc.perks.length > 0) {
                        const pHash = desc.perks[0].perkHash;

                        const pDesc: any = await this.destinyCacheService.getPerk(pHash);
                        if (pDesc != null) {
                            description = pDesc.displayProperties.description;
                        }
                    }
                } else if (type === ItemType.Mod && desc.itemTypeDisplayName.indexOf('Shader') >= 0) {
                    type = ItemType.Shader;
                } else if (type === ItemType.Dummy && desc.itemTypeDisplayName.indexOf('Shader') >= 0) {
                    type = ItemType.Shader;
                } else if ((type === ItemType.Dummy || type == ItemType.Mod || type === ItemType.None) && desc.displayProperties.name.endsWith('Element')) {
                    // type = ItemType.ExchangeMaterial;       
                    // itemTypeDisplayName = 'Shaping Material';
                    return null;
                } else if ((type === ItemType.Dummy || type == ItemType.Mod || type === ItemType.None) && desc.displayProperties.name.endsWith('Alloy')) {
                    // type = ItemType.ExchangeMaterial;         
                    // itemTypeDisplayName = 'Shaping Material';
                    // return null;
                } else if (type === ItemType.None && desc.itemTypeDisplayName == 'Mask') {
                    type = ItemType.Armor;
                } else if (type === ItemType.Dummy && desc.displayProperties.name.startsWith('Purchase') && desc.tooltipStyle == 'vendor_action') {
                    type = ItemType.CurrencyExchange;
                } else if (type === ItemType.Dummy && desc.displayProperties.name.startsWith('Redeemable')) {
                    type = ItemType.ExchangeMaterial;
                } else if (type === ItemType.None && desc.itemTypeDisplayName.indexOf('Material') >= 0) {
                    type = ItemType.ExchangeMaterial;
                } else if (type === ItemType.None && desc.displayProperties.name === 'Spoils of Conquest') {
                    type = ItemType.ExchangeMaterial;
                } else if (type === ItemType.None && desc.itemTypeDisplayName.indexOf('Currency') >= 0) {
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
                    // console.log(`Skipping ${desc.displayProperties.name} type ${type}`);
                    return null;
                }
                if (type == ItemType.Consumable) {
                    type = ItemType.ExchangeMaterial;
                }
            }
            const objectives: ItemObjective[] = [];
            let progTotal = 0, progCnt = 0;
            if (itemComp != null) {
                // these objectives don't work for proper gear, just bounties and quests
                if (itemComp.objectives?.data && type!=ItemType.Weapon && type!=ItemType.Armor) {
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
                            const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
                            
                            
                            const iObj: ItemObjective = {
                                hash: o.objectiveHash,
                                completionValue: oDesc.completionValue,
                                progressDescription: ParseService.dynamicStringReplace(oDesc.progressDescription, null, dynamicStrings),
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
                
                if (itemComp.plugObjectives?.data) {
                    const pObj: any = itemComp.plugObjectives.data[itm.itemInstanceId];
                    if (pObj?.objectivesPerPlug) {
                        const deepSightRes = pObj.objectivesPerPlug['213377779'] || pObj.objectivesPerPlug['2400712188'] || pObj.objectivesPerPlug['3632593563'];
                        if (deepSightRes != null && deepSightRes.length>0) {                            
                            const o = deepSightRes[0];
                            const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
                            
                            const iObj: ItemObjective = {
                                hash: o.objectiveHash,
                                completionValue: oDesc.completionValue,
                                progressDescription: ParseService.dynamicStringReplace(oDesc.progressDescription, null, dynamicStrings),
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
                            deepSightProgress = iObj;
                        }
                        const shapedLevel = pObj.objectivesPerPlug['659359923'] || pObj.objectivesPerPlug['1922808508'] || pObj.objectivesPerPlug['4029346515'];
                        if (shapedLevel != null && shapedLevel.length>0) {
                            let dateCrafted: number = null;
                            let level: number = null;
                            let objective: WeaponShapeLevelObjective = null;
                            for (const o of shapedLevel) {
                                const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
                                if (oDesc.uiStyle == DestinyObjectiveUiStyle.CraftingWeaponLevel ) {
                                    level = o.progress;
                                    continue;
                                }
                                if (oDesc.uiStyle == DestinyObjectiveUiStyle.CraftingWeaponLevelProgress ) {
                                    const iObj: WeaponShapeLevelObjective = {
                                        hash: o.objectiveHash,
                                        completionValue: oDesc.completionValue,
                                        progressDescription: ParseService.dynamicStringReplace(oDesc.progressDescription, null, dynamicStrings),
                                        progress: o.progress == null ? 0 : o.progress,
                                        complete: o.complete,
                                        percent: 0
                                    };
                                    if (iObj.completionValue != null && iObj.completionValue > 0) {
                                        progTotal += 100 * iObj.progress / iObj.completionValue;
                                        progCnt++;
                                        iObj.percent = Math.floor(100 * iObj.progress / iObj.completionValue);
                                    }
                                    objective = iObj;
                                    continue;
                                }
                                if (oDesc.uiStyle == DestinyObjectiveUiStyle.CraftingWeaponTimestamp ) {
                                    dateCrafted = o.progress ? o.progress * 1000 : null;
                                    continue;
                                }
                            }
                            if (objective) {
                                objective.level = level;
                                objective.date = dateCrafted;
                                objectives.push(objective);
                                craftProgress = objective;
                            }
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
            let seasonalModSlot = -1;
            const coveredSeasons = [];


            const specialModSockets: string[] = [];
            let stats: InventoryStat[] = [];
            const sockets: InventorySocket[] = [];
            let mw: MasterworkInfo = null;
            let inventoryBucket: ApiInventoryBucket = null;
            let tier = null;
            let isRandomRoll = false;
            if (itemComp && (detailedInv || type === ItemType.MissionArtifact)) {
                if (desc.inventory != null) {
                    tier = desc.inventory.tierTypeName;
                    const bucketHash = desc.inventory.bucketTypeHash;
                    if (bucketHash != null) {
                        const bDesc = await this.destinyCacheService.getInventoryBucket(bucketHash);
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
                    const instanceData = itemComp.stats.data[itm.itemInstanceId];
                    stats = this.parseItemStats(instanceData, desc, type);
                }
                if (itemComp?.sockets?.data != null && desc?.sockets?.socketCategories != null) {
                    const itemSockets = itemComp.sockets.data[itm.itemInstanceId];
                    if (itemSockets != null) {
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
                            if (jCat.socketCategoryHash == 2048875504 || jCat.socketCategoryHash == 1926152773 || jCat.socketCategoryHash == 3201856887 ) {
                                continue;
                            }
                            // read armor tier info from the item instance instead
                            if (760375309 == jCat.socketCategoryHash) {
                                continue;
                            }
                            // armor stats are socket plugs, sum them up
                            // these are NOT enhancements, these are the intrinsic stats of the armor
                            // mods that further enhance stats are handled elsewhere
                            if (3154740035 == jCat.socketCategoryHash && jCat.socketIndexes) {
                                // reset all our stats to zero
                                for (const stat of stats) {
                                    stat.value = 0;
                                }
                                // add in any item desc inv stats
                                for (const investmentStat of desc.investmentStats) {
                                    const stat = stats.find(x => x.hash == investmentStat.statTypeHash);
                                    if (stat) {
                                        stat.value += investmentStat.value;
                                    }
                                }
                                const itemSocketArray = itemSockets.sockets;
                                for (const index of jCat.socketIndexes) {
                                    const socketVal = itemSocketArray[index];
                                    if (socketVal.plugHash != null && socketVal.isEnabled) {
                                        const plugDesc: any = await this.destinyCacheService.getInventoryItem(socketVal.plugHash);
                                        if (plugDesc?.investmentStats) {
                                            for (const investmentStat of plugDesc.investmentStats) {
                                                const stat = stats.find(x => x.hash == investmentStat.statTypeHash);
                                                if (stat) {
                                                    stat.value += investmentStat.value;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            const isMod = jCat.socketCategoryHash == 590099826 || jCat.socketCategoryHash == 2685412949;
                            const socketArray = itemSockets.sockets;
                            if (jCat.socketIndexes == null) { continue; }
                            for (const index of jCat.socketIndexes) {
                                const socketDesc = desc.sockets.socketEntries[index];
                                let sourcePlugs: ManifestInventoryItem[] | null = null;
                                let plugWhitelist: string[] = [];
                                if (socketDesc.singleInitialItemHash != null) {
                                    const emptyModSocketDesc = await this.destinyCacheService.getInventoryItem(socketDesc.singleInitialItemHash);
                                    if ((socketDesc.singleInitialItemHash == 0 || emptyModSocketDesc.displayProperties.name == 'Empty Mod Socket') && socketDesc.reusablePlugSetHash) {
                                        // TODO handle already equipped plugs which may show as not equippable (for example Anti-Barrier Auto Rifle)
                                        const plugSetHash = socketDesc.reusablePlugSetHash;
                                        let pp: PrivPlugSetEntry[] = [];
                                        const profilePlugs = resp?.profilePlugSets?.data?.plugs[plugSetHash] as PrivPlugSetEntry[];
                                        if (profilePlugs) {
                                            pp = pp.concat(profilePlugs);
                                        }
                                        const charPlugs = resp?.characterPlugSets?.data[owner.id]?.plugs[plugSetHash] as PrivPlugSetEntry[];
                                        if (charPlugs) {
                                            pp = pp.concat(charPlugs);
                                        }
                                        pp = pp.filter(x => x.enabled && x.canInsert);
                                        let plugDefs = [];
                                        for (const x of pp) {
                                            const plugDef = await this.destinyCacheService.getInventoryItem(x.plugItemHash);
                                            plugDefs.push(plugDef);
                                        }
                                        plugDefs = plugDefs.filter(x => x != null).filter(x => {
                                            const et = x.plug?.energyCost?.energyType;
                                            if (!et) {
                                                return true;
                                            }
                                            if (et == EnergyType.Any) {
                                                return true;
                                            }
                                            return et == energyType;
                                        });
                                        sourcePlugs = plugDefs;
                                        const socketTypeDesc = await this.destinyCacheService.getSocketType(socketDesc.socketTypeHash);
                                        if (socketTypeDesc?.plugWhitelist) {
                                            plugWhitelist = socketTypeDesc.plugWhitelist.map(x => x.categoryIdentifier);
                                        }
                                    }
                                    const modSocketType = emptyModSocketDesc?.itemTypeDisplayName;
                                    if ('Combat Style Armor Mod' == modSocketType) {
                                        searchText += 'has:modcombat';
                                        specialModSockets.push('combat');
                                        seasonalModSlot = 0;
                                        coveredSeasons.push(0);
                                    } else if ('Garden of Salvation Raid Mod' == modSocketType) {
                                        specialModSockets.push('gos');
                                        searchText += 'has:modgos';
                                        seasonalModSlot = 2;
                                        coveredSeasons.push(2);
                                    } else if ('Deep Stone Crypt Raid Mod' == modSocketType) {
                                        specialModSockets.push('deepstone');
                                        searchText += 'has:moddeepstone';
                                        seasonalModSlot = 3;
                                        coveredSeasons.push(3);
                                    } else if ('Vault of Glass Armor Mod' == modSocketType) {
                                        specialModSockets.push('vog');
                                        searchText += 'has:modvog';
                                        seasonalModSlot = 4;
                                        coveredSeasons.push(4);
                                    } else if ('enhancements.raid_v600'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('vod');
                                        searchText += 'has:modvod';
                                        seasonalModSlot = 5;
                                        coveredSeasons.push(5);
                                    // } else if ('Vow of the Disciple Armor Mod' == modSocketType) {
                                    //     specialModSockets.push('vod');
                                    //     searchText += 'has:modvod';
                                    //     seasonalModSlot = 5;
                                    //     coveredSeasons.push(5);
                                    } else if (modSocketType?.indexOf('Last Wish Raid Mod') >= 0) {
                                        specialModSockets.push('lw');
                                        searchText += 'has:modlw';
                                        seasonalModSlot = 1;
                                        coveredSeasons.push(1);
                                    }
                                }
                                const socketVal = socketArray[index];
                                const plugs: InventoryPlug[] = [];
                                const possiblePlugs: InventoryPlug[] = [];
                                isRandomRoll = isRandomRoll || socketDesc.randomizedPlugSetHash != null;
                                if (!isMod && reusablePlugs && reusablePlugs[index]) {
                                    for (const plug of reusablePlugs[index]) {
                                        const plugDesc: any = await this.destinyCacheService.getInventoryItem(plug.plugItemHash);
                                        if (plugDesc == null) { continue; }
                                        const plugName = ParseService.getPlugName(plugDesc);
                                        if (plugName == null) { continue; }
                                        // this is where weapon perks are added
                                        const oPlug = new InventoryPlug(plugDesc.hash,
                                            plugName, plugDesc.displayProperties.description,
                                            plugDesc.displayProperties.icon, socketVal.plugHash == plug.plugItemHash, plugDesc.plug.energyCost,
                                            plugDesc.itemTypeDisplayName);
                                        // elemental capacitor
                                        if (oPlug.active && IGNORE_WEAPON_PERK_STATS.indexOf(plug.plugItemHash) >= 0) {
                                            ignoreWeaponPerkStats.push(oPlug);
                                        }
                                        this.applyPlugInventoryStats(oPlug, plugDesc);
                                        if (oPlug.active && type === ItemType.Weapon) {
                                            // if (ignoreWeaponPerkStats.length > 0 && type === ItemType.Weapon) {
                                            for (const s of stats) {
                                                const modStat = oPlug.inventoryStats.find(x => (x.hash == s.hash));
                                                if (modStat) {
                                                    // for weapons we'd like to keep the modified values that we get, but for armor we want to normalize for their base value
                                                    // that's b/c armor can swap mods for virtualyl free but weapons cannot change their perks

                                                    // elemental capacitor should have its effects removed to avoid confusing things
                                                    if (IGNORE_WEAPON_PERK_STATS.indexOf(plug.plugItemHash) >= 0) {
                                                        s.value -= modStat.value;
                                                    } else {
                                                        if (s.enhancement == null) {
                                                            s.enhancement = 0;
                                                        }
                                                        s.enhancement += modStat.value;
                                                    }
                                                }
                                            }
                                        }
                                        plugs.push(oPlug);
                                    }
                                } else if (socketVal?.plugHash != null) {  // only show plughash if there is no reusable, otherwise we'll dupe perks
                                    const plug = socketVal;
                                    const plugDesc: any = await this.destinyCacheService.getInventoryItem(plug.plugHash);
                                    if (plugDesc == null) { continue; }
                                    if (isMod) {
                                        const mwInfo = this.parseMasterwork(plugDesc);
                                        if (mwInfo != null) {
                                            mw = mwInfo;
                                            continue;
                                        }
                                    }

                                    // this is where the Artifice Armor perk shows up, but not the slot
                                    const plugName = ParseService.getPlugName(plugDesc);
                                    if (plug.plugHash == 3727270518) {
                                        specialModSockets.push('artifice');
                                        searchText += 'has:modartifice';
                                        seasonalModSlot = 10;
                                        coveredSeasons.push(10);
                                    }
                                    if (plugName == null) { continue; }
                                    // this is where weapon frames and armor are added
                                    const oPlug = new InventoryPlug(plugDesc.hash,
                                        plugName, plugDesc.displayProperties.description,
                                        plugDesc.displayProperties.icon, true, plugDesc.plug.energyCost,
                                        plugDesc.itemTypeDisplayName, plug.isEnabled);
                                    if (isMod)  {
                                        this.applyPlugInventoryStats(oPlug, plugDesc);
                                        // we'll handle these later for armor
                                    }
                                    plugs.push(oPlug);
                                }
                                sockets.push(new InventorySocket(jCat.socketCategoryHash, plugWhitelist, plugs, possiblePlugs, index, sourcePlugs));
                                if (socketDesc.randomizedPlugSetHash) {
                                    const randomRollsDesc: any = await this.destinyCacheService.getPlugSet(socketDesc.randomizedPlugSetHash);
                                    if (randomRollsDesc && randomRollsDesc.reusablePlugItems) {
                                        for (const option of randomRollsDesc.reusablePlugItems) {
                                            const plugDesc: any = await this.destinyCacheService.getInventoryItem(option.plugItemHash);
                                            const plugName = ParseService.getPlugName(plugDesc);
                                            if (plugName == null) { continue; }
                                            // this is used to show perks on weapons on "Possible Rolls"
                                            const oPlug = new InventoryPlug(plugDesc.hash,
                                                plugName, plugDesc.displayProperties.description,
                                                plugDesc.displayProperties.icon, false, plugDesc.plug.energyCost,
                                                plugDesc.itemTypeDisplayName);
                                            oPlug.currentlyCanRoll = option.currentlyCanRoll;
                                            possiblePlugs.push(oPlug);
                                        }
                                    }
                                } else if (socketDesc.singleInitialItemHash) {
                                    const plugDesc: any = await this.destinyCacheService.getInventoryItem(socketDesc.singleInitialItemHash);
                                    const plugName = ParseService.getPlugName(plugDesc);
                                    if (plugName == null) { continue; }
                                    // this is used to show frames on weapons on "Possible Rolls"
                                    const oPlug = new InventoryPlug(plugDesc.hash,
                                        plugName, plugDesc.displayProperties.description,
                                        plugDesc.displayProperties.icon, false, plugDesc.plug.energyCost,
                                        plugDesc.itemTypeDisplayName);
                                    oPlug.currentlyCanRoll = true;
                                    possiblePlugs.push(oPlug);
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
                    const valDesc: any = await this.destinyCacheService.getInventoryItem(val.itemHash);
                    if (valDesc != null) {
                        values.push({
                            hash: val.itemHash,
                            icon: valDesc.displayProperties.icon,
                            name: valDesc.displayProperties.name,
                            quantity: val.quantity
                        });
                    }

                }
            }
            const locked: boolean = (itm.state & ItemState.Locked) > 0;
            const masterworked = (itm.state & ItemState.Masterwork) > 0;
            const tracked = (itm.state & ItemState.Tracked) > 0;
            const shaped = (itm.state & ItemState.Shaped) > 0;
            const deepsight = (itm.state & ItemState.Deepsight) > 0;
            let notShaped = desc.inventory.recipeItemHash && !shaped;

            const bucketOrder = null;

            let questline: Questline = null;
            if (desc.objectives != null && type == ItemType.QuestStep) {
                const qli = desc.objectives.questlineItemHash;

                if (qli != null && qli != 0) {
                    questline = await this.parseQuestLine(qli, itm.itemHash);
                    if (questline == null) {
                        return null;
                    }
                }
            }
            if (mw != null) {
                searchText += ' is:mw:' + mw.name;
            }
            if (masterworked) {
                searchText += ' is:masterwork';
            }
            if (shaped) {
                searchText += ' is:shaped';
            }
            if (deepsight) {
                searchText += ' is:deepsight';
            }
            if (notShaped) {
                searchText += ' is:notshaped';
            }
            if (sockets != null) {
                for (const s of sockets) {
                    for (const p of s.plugs) {
                        searchText += ` ${p.enhanced?'enhanced:':''}${p.name}`;
                    }
                }
            }
            if (isRandomRoll == true) {
                searchText += ' is:random';
            } else {
                searchText += ' is:fixed';
            }
            if (damageType != null && damageType != DamageType.None) {
                searchText += ' ' + ParseService.cookDamageType(damageType);
            }
            if (ParseService.isEnergyType(damageType)) {
                searchText += ' energy';
            }
            if (energyType != null) {
                searchText += ' ' + ParseService.cookEnergyType(energyType);
            }
            if (ammoType != null) {
                searchText += ' ' + DestinyAmmunitionType[ammoType];
            }
            if (postmaster) {
                searchText += ' mail is:postmaster';
            }
            if (type === ItemType.Bounty || type === ItemType.Quest || type === ItemType.QuestStep) {
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
                        const vDesc: any = await this.destinyCacheService.getVendor(vendorHash);
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
            if (type === ItemType.Armor) {
                for (const s of stats) {
                    for (const socket of sockets) {
                        const m = socket.plugs.find(p => p.active);
                        if (!m) {
                            continue;
                        }
                        if (m.inventoryStats) {
                            const modStat = m.inventoryStats.find(x => (x.hash == s.hash));
                            if (modStat) {

                                // Charge Harvester needs to be filtered by class to stat
                                if (m.hash == '2263321587') {
                                    if (ClassAllowed.Hunter == desc.classType) {
                                        if (modStat.hash != StatHashes.Mobility) {
                                            continue;
                                        }
                                    } else if (ClassAllowed.Titan == desc.classType) {
                                        if (modStat.hash != StatHashes.Resilience) {
                                            continue;
                                        }
                                    } else if (ClassAllowed.Warlock == desc.classType) {
                                        if (modStat.hash != StatHashes.Recovery) {
                                            continue;
                                        }
                                    }
                                }
                                if (s.enhancement == null) {
                                    s.enhancement = 0;
                                }
                                s.enhancement += modStat.value;
                            }
                        }
                    }
                    if (masterworked) {
                        if (s.enhancement == null) {
                            s.enhancement = 0;
                        }
                        s.enhancement += 2;
                    }
                    totalStatPoints += s.value;
                }
            }
            let icon = desc.displayProperties.icon;
            if (itm.overrideStyleItemHash != null) {
                if (!(itm.overrideStyleItemHash == 2931483505
                    || itm.overrideStyleItemHash == 702981643
                    || itm.overrideStyleItemHash == 1959648454)) {
                    const overrideDesc: any = await this.destinyCacheService.getInventoryItem(itm.overrideStyleItemHash);
                    if (overrideDesc != null) {
                        icon = overrideDesc.displayProperties.icon;
                    }
                }
            }
            let powerCap = null;
            // often null in vendor gear, so try to use latest
            let version = 999;
            if (itm.versionNumber != null) {
                version = itm.versionNumber;
            }
            if (desc.quality?.versions?.length > 0) {
                const maxVersion = desc.quality?.versions?.length - 1;
                const useVersion = Math.min(maxVersion, version);
                const pCapHash = desc.quality.versions[useVersion]?.powerCapHash;
                if (pCapHash) {
                    const pCapDesc = this.destinyCacheService.cacheLite.PowerCap[pCapHash];
                    if (pCapDesc) {
                        powerCap = pCapDesc.powerCap;
                        powerCap = powerCap > 10000 ? 9999 : powerCap;
                    }
                }
            }

            let name = desc.displayProperties.name;
            if (questline != null) {
                if (desc.setData && desc.setData.questLineName) {
                    name = desc.setData.questLineName + ': ' + name;
                    questline.name = desc.setData.questLineName;
                } else {
                    name = questline.name + ': ' + name;
                }
            }
            searchText += name;
            searchText = searchText.toLowerCase();
            const watermarkIcons = desc?.quality?.displayVersionWatermarkIcons;
            let iconWatermark = null;
            if (watermarkIcons && watermarkIcons.length > 0) {
                if (itm.versionNumber && watermarkIcons.length > itm.versionNumber) {
                    iconWatermark = watermarkIcons[itm.versionNumber];
                } else {
                    // use last version if nothing specified
                    iconWatermark = watermarkIcons[watermarkIcons.length - 1];
                }

            }
            if (specialModSockets.length == 0) {
                specialModSockets.push('none');
                searchText += 'has:modnone';
                seasonalModSlot = -1;
                coveredSeasons.push(-1);
            } else if (specialModSockets.length > 1) {
                specialModSockets.push('special');
                searchText += 'has:modspecial';
            }
            specialModSockets.sort();
            return new InventoryItem(itm.itemInstanceId, '' + itm.itemHash, name,
                equipped, canEquip, owner, icon, iconWatermark, type, itemTypeDisplayName,
                itm.quantity,
                power, damageType, energyType, stats, sockets, objectives,
                description,
                desc.classType, bucketOrder, aggProgress, values, itm.expirationDate,
                locked, masterworked, mw, tracked, questline, searchText, inventoryBucket, tier, options.slice(),
                isRandomRoll, ammoType, postmaster, energyUsed, energyCapacity, totalStatPoints, seasonalModSlot,
                coveredSeasons, powerCap, redacted, specialModSockets, desc.collectibleHash, itm.versionNumber, shaped, deepsight, deepSightProgress, craftProgress, notShaped
            );
        } catch (exc) {
            console.dir(itemComp);
            console.error(exc);
            return null;
        }
    }

    public async parseClanInfo(j: any): Promise<ClanInfo> {

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
            for (const key of Object.keys(j.clanInfo.d2ClanProgressions)) {
                const p: PrivProgression = j.clanInfo.d2ClanProgressions[key];
                const pDesc = await this.destinyCacheService.getProgression(p.progressionHash);
                const prog: Progression = ParseService.parseProgression(p, pDesc);
                if (prog != null) {
                    if (key === '584850370') {
                        c.primaryProgression = prog;
                    }
                    progs.push(prog);
                }
            }

        }
        c.progressions = progs;
        return c;
    }

    public static camelKebab(prefix: string, s: string): string {
        if (prefix != null) {
            s = s.replace(prefix, '');
        }
        s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    private static buildDynamicStrings(resp: any): DynamicStrings {
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
    private static dynamicStringReplace(text: string, characterId: string, dynamicStrings: DynamicStrings): string {
        // Thanks DIM!
        return text.replace(INTERPOLATION_PATTERN, (segment) => {
            const hash = segment.match(/\d+/)![0];
            const dynamicValue =
              dynamicStrings?.character[characterId]?.[hash] ?? dynamicStrings?.profile[hash];
            return dynamicValue?.toString() ?? segment;
          });
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

interface PrivInventoryItem {
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
