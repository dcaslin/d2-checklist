import { Injectable } from '@angular/core';
import { parseISO } from 'date-fns';
import { DestinyCacheService, ManifestInventoryItem, Season, SeasonPass } from './destiny-cache.service';
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
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import {
    buildDynamicStrings,
    camelKebab,
    cookAccountProgression,
    decimalToFraction,
    dynamicStringClear,
    dynamicStringReplace,
    getBasicDisplayValue,
    getBasicValue,
    INTERPOLATION_PATTERN,
    parseProgression,
    PrivInventoryItem,
    PrivProgression
} from './parse-utils';
export { INTERPOLATION_PATTERN } from './parse-utils';
import { GearParserService } from './gear-parser.service';
import { TriumphParserService } from './triumph-parser.service';
import { MilestoneParserService } from './milestone-parser.service';
import { HistoryParserService } from './history-parser.service';


@Injectable({ providedIn: 'root' })
export class ParseService {
    MAX_LEVEL = 50;


    HIDE_FACTIONS = [
        '3468066401', // The Nine
        '1714509342', // Future War Cult
        '2105209711', // New Monarchy
        '3398051042', // Dead Orbit
        '3859807381', // Rasputin
        '1482334108', // Leviathan
        '2677528157', // "Follower of Osiris"

    ];


    ACCOUNT_LEVEL = [
        '1800684758', // Failsafe
        // '527867935', // Xur // there is a progression that's better used
        // '1471185389', // Gunsmith // there is a progression that's better used
        '784742260', // Cryptarchs - this is worth promoting to account wide
        // '1983115403', // House of light 
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

    constructor(
        private destinyCacheService: DestinyCacheService,
        private gearParser: GearParserService,
        private triumphParser: TriumphParserService,
        private milestoneParser: MilestoneParserService,
        private historyParser: HistoryParserService
    ) {
        
    }

    // --- Delegated public API (preserves backward compatibility) ---

    public static getBasicValue(val: any): number {
        return getBasicValue(val);
    }

    public static getBasicDisplayValue(val: any): string {
        return getBasicDisplayValue(val);
    }

    public static mergeAggHistory2(charAggHistDicts: { [key: string]: AggHistoryEntry }[]): AggHistoryEntry[] {
        return HistoryParserService.mergeAggHistory2(charAggHistDicts);
    }

    public static camelKebab(prefix: string, s: string): string {
        return camelKebab(prefix, s);
    }

    public async parseModifier(hash: string): Promise<NameDesc> {
        return this.milestoneParser.parseModifier(hash);
    }

    public async parseAggHistory2(char: Character, resp: any): Promise<{ [key: string]: AggHistoryEntry }> {
        return this.historyParser.parseAggHistory2(char, resp);
    }

    public async parsePublicMilestones(resp: any): Promise<PublicMilestonesAndActivities> {
        return this.milestoneParser.parsePublicMilestones(resp);
    }

    public async parseActivities(a: any[]): Promise<Activity[]> {
        return this.milestoneParser.parseActivities(a);
    }

    public async parseInvItem(itm: PrivInventoryItem, owner: Target, itemComp: any, detailedInv: boolean, options: Target[], characterProgressions: any, resp?: any, dynamicStrings?: DynamicStrings): Promise<InventoryItem> {
        return this.gearParser.parseInvItem(itm, owner, itemComp, detailedInv, options, characterProgressions, resp, dynamicStrings);
    }

    // --- Methods that remain in ParseService ---


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
                char.lightFraction = decimalToFraction(basePL + artifactBonus);
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
            char.emblemPath = null!;
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

    private async populateProgressions(c: Character, _prog: any, milestonesByKey: { [id: string]: MileStoneName }, 
        milestoneList: MileStoneName[], accountProgressions: Progression[], dynamicStrings: DynamicStrings): Promise<void> {
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
                // hide non-weekly dungeons
                const desc = await this.destinyCacheService.getMilestone(key);
                // warlord's ruin is available every week as a pinnacle
                // then we have one and only one rotator on top

                // special case for clan rewards
                if (key === '4253138191') {
                    const desc = await this.destinyCacheService.getMilestone(ms.milestoneHash);
                    // grab weekly reset from this
                    c.startWeek = new Date(ms.startDate);
                    c.endWeek = new Date(ms.endDate);

                    const clanMilestones: ClanMilestoneResult[] = [];
                    ms.rewards.forEach((r: any) => {
                        // last week, for testing
                        // if (r.rewardCategoryHash == 4258746474) {
                        // this week's clan rewards
                        if (r.rewardCategoryHash === 1064137897) {
                            const rewEntryDescs = desc.rewards[r.rewardCategoryHash].rewardEntries;
                            r.entries.forEach((rewEnt: any) => {
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
                    await this.milestoneParser.addPseudoMilestone(key, milestonesByKey, milestoneList, [], _prog.milestones[key]);
                }

                let total = 0;
                let complete = 0;
                let phases = [];
                let info: string | null = null;
                let suppInfo: string | null = null;
                let readyToCollect = false;
                let oPct = 0;
                if (ms.availableQuests != null) {
                    for (const q of ms.availableQuests) {
                        total++;                       
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
                    let challenge: any;
                    if (act.challenges != null && act.challenges.length > 0) {
                        // use the second challenge for IB, it's the pinnacle, the first is just XP Boost
                        if (key == '3427325023' && act.challenges.length>0)  {
                            // we want the last challenge. It'll either be 2, with the rank one first
                            // or just 1 with the pinnacle
                            challenge = act.challenges[act.challenges.length-1];
                            const charStrings = dynamicStrings?.character[c.characterId];
                            if (charStrings && charStrings[4161792462]) {
                                let number = charStrings[4161792462];
                                if (number == null) {
                                    number = 0;
                                }
                                for (let i = 1; i < 9; i++) {
                                    phases.push(i<number);
                                }
                            }
                        } else {
                            challenge = act.challenges[0];
                        }
                        if (challenge.objective != null) {
                            const obj = challenge.objective;
                            let oDesc = await this.destinyCacheService.getObjective(obj.objectiveHash);
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
                        // skip phases on weekly rotating raid b/c it's bugged, use presence of activity challenge as completion
                        if (milestonesByKey[ms.milestoneHash]?.publicInfo?.weeklyRaid) {
                            if (act.challenges?.length==0) {
                                complete = 1;
                                total = 1;
                            }
                        } else {
                            for (const p of act.phases) {

                                phases.push(p.complete);
                                if (p.complete) {
                                    complete++;
                                }
                                total++;
                            }
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
                if (phases.length == 0) { phases = null!; }
                const m: MilestoneStatus = new MilestoneStatus(key, complete === total, pct, info!, [suppInfo!], phases, false, false, readyToCollect);
                c.milestones[key] = m;
            }
        }

        // factions and progressions are confusingly mixed together
        // progressions are account wide, factions are sometimes per character
        // progressions are better, since they offer more information, like season resets 

        const perCharProgressions: Progression[] = [];


        if (_prog.progressions) {
            const sp = await this.getSeasonProgression();
            const currentRankProgressionHashes: number[] = this.destinyCacheService.cacheLite.destiny2CoreSettings.currentRankProgressionHashes;
            for (const key of Object.keys(_prog.progressions)) {
                const iKey: number = parseInt(key, 10);
                if ((currentRankProgressionHashes.indexOf(iKey) >= 0) 
                    || (sp!=null && (key == sp?.rewardProgressionHash || key == sp?.prestigeProgressionHash)) )
                {
                    const p: PrivProgression = _prog.progressions[key];
                    const suppProg: PrivProgression = p;
                    let progDesc = await this.destinyCacheService.getProgression(p.progressionHash);
                    // SEE SEASON PASS TABLE FOR THESE
                    if (sp!=null && key == sp?.rewardProgressionHash) { // Season of dawn
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
                    if (key == sp?.prestigeProgressionHash) { // Season of Dawn prestige
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


                    const prog: Progression = parseProgression(p, progDesc, suppProg);
                    if (prog != null) {
                        const found = accountProgressions.find(x => x.hash == prog.hash);
                        if (!found) {
                            cookAccountProgression(prog);
                            accountProgressions.push(prog);
                        }
                    }
                } else if (key === '540048094') { 
                    // just to make things more confusing, this is the one progression that is still per character
                    const p: PrivProgression = _prog.progressions[key];
                    const pDesc = await this.destinyCacheService.getProgression(p.progressionHash);
                    const prog: Progression = parseProgression(p, pDesc);
                    prog.name = 'Personal Clan XP';
                    prog.currentProgress = prog.weeklyProgress;
                    prog.percentToNextLevel = prog.currentProgress / 5000;
                    if (prog != null) {
                        perCharProgressions.push(prog);
                    }
                }
            }
        }

        if (_prog.factions != null) {
            for (const key2 of Object.keys(_prog.factions)) {
                const p: PrivProgression = _prog.factions[key2];
                const fDesc = await this.destinyCacheService.getFaction(p.factionHash);
                const prog: Progression = parseProgression(p, fDesc);
                if (prog == null) {
                    continue;
                }
                 // progressions are more valuable than factions
                // so ignore any factions where we already found a progression for the hash
                if (accountProgressions.find(x => x.hash == prog.hash)) {
                    continue;
                }
                if (this.HIDE_FACTIONS.indexOf(prog.hash) >= 0) {
                    continue;
                }
                if (this.ACCOUNT_LEVEL.indexOf(prog.hash) < 0) {
                    perCharProgressions.push(prog);
                } else {
                    cookAccountProgression(prog);
                    accountProgressions.push(prog);
                }
            }
        }
        c.maxLevel = this.MAX_LEVEL;

        

        perCharProgressions.sort(function (a, b) {
            return b.percentToNextLevel - a.percentToNextLevel;
        });
        c.factions = perCharProgressions;
    }


    private async getSeasonProgression(): Promise<SeasonPass> {
        const hash = this.destinyCacheService.cacheLite.destiny2CoreSettings.currentSeasonHash;
        const s: Season = await this.destinyCacheService.getSeason(hash);
        for (const seasonPassItem of s.seasonPassList) {
            const startTime = new Date(seasonPassItem.seasonPassStartDate).getTime();
            const endTime = new Date(seasonPassItem.seasonPassEndDate).getTime();
            const now = new Date().getTime();
            if (now>=startTime && now <= endTime) {
                
                const sp: SeasonPass = await this.destinyCacheService.getSeasonPass(seasonPassItem.seasonPassHash);
                return sp;
            }
        }
        return null!;
    }



    private async parseCraftingMaterials(resp: any, currencies: Currency[]) { 
        

        await this.parseCraftingMaterial(resp, '1791833453', 2747150405, 2029874829, currencies, 100);
        // Name: Inv item Id | object id | profile var id
        // Neutral: 3491404510 | ?                 | 2747150405
        // await this.parseCraftingMaterial(resp, '3491404510', 2747150405, currencies, 100);
        // Ruinous Element: 163842160| 2215515944  | 2653558736
        //await this.parseCraftingMaterial(resp, '163842160', 2653558736, currencies, 100);
        // Adroit Element: 163842161 | 2215515945  | 2829303739
        //await this.parseCraftingMaterial(resp, '163842161', 2829303739, currencies, 101);
        // Mutable  : 163842162 | 2215515946       | 1178490630
        //await this.parseCraftingMaterial(resp, '163842162', 1178490630, currencies, 102);
        // Energetic: 163842163 | 2215515947       | 1238436609
        //await this.parseCraftingMaterial(resp, '163842163', 1238436609, currencies, 103);
    }


    private async parseCraftingMaterial(resp: any, itemHash: string, varHash: number, maxStackHash: number,  currencies: Currency[], order: number) {
        const desc: any = await this.destinyCacheService.getInventoryItem(itemHash);
        if (!desc) {
            console.log(`Missing ${itemHash}`);
            return;
        }
        const quantity: any = resp.profileStringVariables?.data?.integerValuesByHash[varHash];
        let maxStackSize = 99999;
        if (desc.inventory?.maxStackSize) {
            maxStackSize = desc.inventory.maxStackSize;
        }
        const dynStackSize : any = resp.profileStringVariables?.data?.integerValuesByHash[maxStackHash];
        if (dynStackSize) {
            maxStackSize = dynStackSize;
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
                if (key === '110198094') { continue; }
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
            return null!;
        }
        const _art = resp.profileProgression.data.seasonalArtifact;

        let pointProg = _art.pointProgression;
        let powerProg = _art.powerBonusProgression;

        const pointProgDesc = await this.destinyCacheService.getProgression(pointProg.progressionHash);
        let parsedProg: Progression = parseProgression(pointProg,
            pointProgDesc, pointProg);
        if (parsedProg != null) {
            accountProgressions.push(parsedProg);
        }
        // as of 2025-12-07 powerProg is null, so we'll just guard against that I suppose
        if (powerProg != null) {
            const powerProgDesc = await this.destinyCacheService.getProgression(powerProg.progressionHash);
            parsedProg = parseProgression(powerProg, powerProgDesc, powerProg);
            if (parsedProg != null) {
                accountProgressions.push(parsedProg);
            }
        }

        // return powerProg.level;
        return _art.powerBonus;

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
                        let checklist: CharChecklist | null = null;
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

                            let checklistItem: CharChecklistItem | null = null;
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

    public async parsePlayer(resp: any, publicMilestones: PublicMilestone[], detailedInv?: boolean, showZeroPtTriumphs?: boolean, showInvisTriumphs?: boolean): Promise<Player> {
        if (resp.profile != null && resp.profile.privacy === 2) {
            throw new Error('Privacy settings disable viewing this player\'s profile.');
        }
        if (resp.characters != null && resp.characters.privacy === 2) {
            throw new Error('Privacy settings disable viewing this player\'s characters.');
        }
        let profile!: Profile;
        if (resp.profile != null) {
            profile = resp.profile.data;
        }
        let superprivate = false;
        const charsDict: { [key: string]: Character } = {};
        const accountProgressions: Progression[] = [];
        const milestoneList: MileStoneName[] = [];
        let weeklyRitualPathfinderHash = null;
        let currentActivity: CurrentActivity | null = null;
        const chars: Character[] = [];
        let hasWellRested = false;
        let weekEnd: string | null = null;
        
        // handle string interpolation aka dynamic strings
        const dynamicStrings = buildDynamicStrings(resp);

        const milestonesByKey: { [id: string]: MileStoneName } = {};
        if (publicMilestones != null) {
            for (const p of publicMilestones) {
                // things to skip
                if (
                    Const.HIDE_MILESTONES.includes(p.hash) ||
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
                    p.end = null!;
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
                // Fix any empty dates
                if (ms.resets === '1970-01-01T00:00:00.000Z') {
                    ms.resets = null!;
                }
                milestoneList.push(ms);
            }
           
            for (const milestone of milestoneList) {
                milestonesByKey[milestone.key] = milestone;
            }
            await this.milestoneParser.addDisappearingMileStones(milestonesByKey, milestoneList);

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
                        await this.populateProgressions(curChar, oProgs[key], milestonesByKey, milestoneList, accountProgressions, dynamicStrings);
                        hasWellRested = curChar.wellRested || hasWellRested;
                    }

                    // do a second pass for any missing milestones
                    for (const key of Object.keys(oProgs)) {
                        const c: Character = charsDict[key];
                        const availableActivities: { [key: string]: boolean } = {};
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
                                    // We're just going to disabled that checking for now, since EVERYTHING seems wrong after Witch Queen
                                    if (!activityAvailable) {
                                        activityAvailable = true;
                                    }
                                    c.milestones[missingKey] = new MilestoneStatus(missingKey, true, 1, null!, null!, [], !activityAvailable, c.notReady);
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
                                if (!dependentMilestoneStatus?.complete) {
                                    const incompletePlaceholder: MilestoneStatus = new MilestoneStatus(checkKey, false, 0, null!, null!, [], false, false);
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

        let recordTree: any[] = [];
        const seals: Seal[] = [];
        const badges: Badge[] = [];
        const seasonChallengeEntries: SeasonalChallengeEntry[] = [];
        let lowHangingTriumphs: TriumphRecordNode[] = [];
        let patternTriumphs: TriumphRecordNode[] = [];
        let exoticCatalystTriumphs: TriumphRecordNode[] = [];
        let searchableTriumphs: TriumphRecordNode[] = [];
        let searchableCollection: TriumphCollectibleNode[] = [];
        const dictSearchableTriumphs: any = {};

        let colTree: any[] = [];
        let triumphScore = null;
        const currencies: Currency[] = [];
        const rankups: Rankup[] = [];
        const bounties: InventoryItem[] = [];
        const quests: InventoryItem[] = [];
        const gear: InventoryItem[] = [];
        const unparseableGearIds: { [id: string]: boolean } = {};
        const itemCompObjectivesData = resp.itemComponents?.objectives?.data;
        const privateGear = itemCompObjectivesData==null || Object.keys(itemCompObjectivesData).length==0;
        let checklists: Checklist[] = [];

        let charChecklists: CharChecklist[] = [];
        let vault: Vault | null = null;
        let shared: Shared | null = null;
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
                        const parsed: InventoryItem = await this.gearParser.parseInvItem(itm, char, resp.itemComponents, detailedInv!, options, resp.characterProgressions, resp, dynamicStrings);
                        if (parsed != null) {
                            // don't deal with chalice if there are no milestones
                            // if (parsed.type === ItemType.MissionArtifact && resp.characterProgressions) {
                            //     this.handleMissionArtifact(char, parsed, milestoneList, milestonesByKey, resp.characterPlugSets);
                            // } else
                            if (parsed.type === ItemType.Bounty) {
                                // ignore expired
                                if (!parsed.expired) {
                                    bounties.push(parsed);
                                }
                            } else if (parsed.type === ItemType.Quest || parsed.type === ItemType.QuestStep) {
                                quests.push(parsed);
                            } else if (detailedInv && parsed.inventoryBucket?.hash === 2422292810) {
                                // FORBIDDEN BUCKET =) 
                                console.log(`Ignoring ${parsed.name} in the forbidden bucket`)

                            }
                            else {
                                gear.push(parsed);
                            }
                        } else {
                            // could not parse, ignore
                            // this path does not load for the gear mgr
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
                            const parsed: InventoryItem = await this.gearParser.parseInvItem(itm, char, resp.itemComponents, detailedInv, options, null, resp);
                            if (parsed != null) {
                                gear.push(parsed);
                            } else {
                                // could not parse, ignore
                                // this path does not load for the gear mgr
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
                        const parsed: InventoryItem = await this.gearParser.parseInvItem(itm, owner, resp.itemComponents, detailedInv, options, null, resp);
                        if (parsed != null) {
                            if (parsed.type == ItemType.Weapon || parsed.type == ItemType.Armor || parsed.type == ItemType.Ghost || parsed.type == ItemType.Vehicle || parsed.type == ItemType.Subclass) {
                                parsed.options.pop();
                                for (const c of chars) {
                                    parsed.options.push(c);
                                }

                            }
                            gear.push(parsed);
                        } else {
                            // capture this instance id to ignore for de-marking
                            // for example, there are FoTL masks that D2Checklist ignores
                            // if someone tags that in DIM, we don't want D2C to mistakenly think this is 
                            // sharded gear and de-mark it
                            unparseableGearIds[itm.itemInstanceId] = true;
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
                const tempBadgesParent = await this.triumphParser.handleColPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.badgesRootNode + '', nodes, collections, []);
                const tempBadges = tempBadgesParent.children;
                for (const ts of tempBadges) {
                    const badge = await this.triumphParser.buildBadge(ts);
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
                const colParent = await this.triumphParser.handleColPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.collectionRootNode + '', nodes, collections, collLeaves);
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
                let parent: TriumphPresentationNode = await this.triumphParser.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.activeSealsRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                const tempSeals = parent?.children ? parent.children : [];
                for (const ts of tempSeals) {
                    const seal = await this.triumphParser.buildSeal(ts, badges);
                    if (seal != null) {
                        seals.push(seal);
                    }
                }
                const ritualPathFinderRoot: TriumphPresentationNode = await this.triumphParser.handleRecPresNode([], 622609416 + '', nodes, records, triumphLeaves, true, false);
                if (ritualPathFinderRoot)   {
                    const visiblePathfinder = ritualPathFinderRoot.children.find(x =>  this.triumphParser.getBestPres(nodes, x.hash)?.state == 0 );
                    if (visiblePathfinder) {
                        const finalStep = visiblePathfinder.children.find(x => x.name == 'Path Completion Reward');
                        if (finalStep) {
                            weeklyRitualPathfinderHash = finalStep.hash;
                        }
                    }
                }
                
                // TODO this is kinda ghetto stringing together active triumphs, exotic catalysts, medals and lore
                // later on should split out active and legacy triumphs, and put catalysts, medals and lore into their own sections
                // Tree 1024788583
                parent = await this.triumphParser.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.recordsRootNode + '', nodes, records, triumphLeaves, showZeroPtTriumphs!, showInvisTriumphs!, []);
                recordTree = parent?.children ? parent.children : [];
                // exotic catalysts
                let oChild = await this.triumphParser.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.exoticCatalystsRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild.children[0]);
                }
                // medals
                oChild = await this.triumphParser.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.medalsRootNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild.children[0]);
                }

                // season challenges
                oChild = await this.triumphParser.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.seasonalChallengesPresentationNodeHash + '', nodes, records, triumphLeaves, true, true);
                if (oChild && oChild.children && oChild.children.length > 0) {
                    recordTree.push(oChild);
                    let weeklyChild: TriumphNode | undefined = undefined;
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
                            records: [] as any[]
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
                // oChild = this.triumphParser.handleRecPresNode([], '1074663644', nodes, records, triumphLeaves, true, true);
                // recordTree.push(oChild);
                // lore
                oChild = await this.triumphParser.handleRecPresNode([], this.destinyCacheService.cacheLite.destiny2CoreSettings.loreRootNodeHash + '', nodes, records, triumphLeaves, true, true);
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
                
                exoticCatalystTriumphs = this.triumphParser.findLeaves(searchableTriumphs, [2744330515]);
                patternTriumphs = this.triumphParser.findLeaves(searchableTriumphs, [127506319, 3289524180, 1464475380]);
                if (!privateGear) {
                    for (const p of patternTriumphs) {
                        // search gear for a weapon matching that name that is crafted
                        const crafted = gear.filter((g) => {  return g.name == p.name && g.crafted; });
                        p.crafted = crafted;
                        const redborder = gear.filter((g) => {  return g.name == p.name && g.deepsight; });
                        p.redborder = redborder;
                        
                    }
                }
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
        let transitoryData: ProfileTransitoryData | null = null;
        // enhance current activity with transitory profile data
        if (resp.profileTransitoryData != null && resp.profileTransitoryData.data != null) {
            const _transData: PrivProfileTransitoryData = resp.profileTransitoryData.data;
            const partyMembers: SearchResult[] = [];
            for (const p of _transData.partyMembers) {
                if (!p.status) {
                    continue;
                }
                const sr: SearchResult = {
                    iconPath: null!,
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
        this.milestoneParser.cookMileStones(milestoneList, dynamicStrings, resp, weeklyRitualPathfinderHash!, chars);
        for (const t of searchableTriumphs) {
            t.desc = dynamicStringReplace(t.desc, null!, dynamicStrings);
        }
        for (const b of bounties) {
            b.desc = dynamicStringReplace(b.desc, b.owner.getValue().id, dynamicStrings);
            for (const r of b.values) {
                r.name = dynamicStringReplace(r.name, b.owner.getValue().id, dynamicStrings);
            }
        }
        // sort currencies by order
        currencies.sort((a, b) => {
            if (a.order > b.order) { return 1; }
            if (a.order < b.order) { return -1; }
            return 0;
        });
        return new Player(profile, chars, currentActivity!, milestoneList, currencies, bounties, quests,
            rankups, superprivate, hasWellRested, checklists, charChecklists, triumphScore, recordTree, colTree,
            gear, vault!, shared!, lowHangingTriumphs, searchableTriumphs, searchableCollection,
            seals, badges, title, seasonChallengeEntries, hasHiddenClosest, accountProgressions, artifactPowerBonus,
            transitoryData!, specialProgressions, gearMeta!, patternTriumphs, exoticCatalystTriumphs, privateGear, resp.responseMintedTimestamp, resp.secondaryComponentsMintedTimestamp,
        unparseableGearIds);
    }

    private async handleGearMeta(chars: Character[], charInvs: any, profileInventory: any): Promise<GearMetaData> {
        if (profileInventory == null || profileInventory.data == null || profileInventory.data.items == null) {
            return {
                postmasterTotal: 0,
                postmaster: [],
                vault: null!
            };
        }
        const generalDesc = await this.destinyCacheService.getInventoryBucket('138197802');
        const returnMe: GearMetaData = {
            postmasterTotal: 0,
            postmaster: [],
            vault: {
                count: profileInventory.data.items.filter((x: any) => x.bucketHash == 138197802).length,
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
            const postmaster = charInvs.data[key].items.filter((x: any) => x.bucketHash == 215593132);
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
                // console.log('Missing desc for ' + hash);
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

    private async cookSpecialAccountProgression(accountProgressions: Progression[]): Promise<SpecialAccountProgressions> {
        const returnMe: SpecialAccountProgressions = {
            glory: null!,
            seasonRank: null!,
            crucibleRank: null!,
            gambitRank: null!,
            vanguardRank: null!, 
            trialsRank: null!
        };
        if (accountProgressions != null) {
            const currentRankProgressionHashes: number[] = this.destinyCacheService.cacheLite.destiny2CoreSettings.currentRankProgressionHashes;
            let prestige: Progression | null = null;
            const sp = await this.getSeasonProgression();
            for (const ap of accountProgressions) {
                const iHash = parseInt(ap.hash, 10);
                const isSpecialRankProgression = currentRankProgressionHashes.indexOf(iHash) >= 0;
                if (isSpecialRankProgression && ap.hash == '2083746873') {
                    returnMe.crucibleRank = ap;
                } else if (isSpecialRankProgression && ap.hash == '3008065600') {
                    returnMe.gambitRank = ap;

                } else if (isSpecialRankProgression && ap.hash == '3696598664') {
                    returnMe.glory = ap;

                } else if (isSpecialRankProgression && ap.hash == '457612306') {
                    returnMe.vanguardRank = ap;
                } else if (sp!=null && ap.hash == sp?.rewardProgressionHash) {
                    returnMe.seasonRank = ap;
                } else if (ap.hash == sp?.prestigeProgressionHash) {
                    prestige = ap;
                } else if (ap.hash == '2755675426') {
                    returnMe.trialsRank = ap;
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
                const prog: Progression = parseProgression(p, pDesc);
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

// PrivProgression and PrivInventoryItem are imported from parse-utils

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


// PrivItemEnergy is imported from parse-utils

