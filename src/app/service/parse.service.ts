
import { Injectable } from '@angular/core';
import { DestinyCacheService } from './destiny-cache.service';
import {
    Character, CurrentActivity, Progression, Activity,
    Profile, Player, MilestoneStatus, MileStoneName, PGCR, PGCREntry, UserInfo, LevelProgression,
    Const, BungieMembership, BungieMember, BungieMemberPlatform,
    BungieGroupMember, ClanInfo, PGCRWeaponData, ClanMilestoneResults,
    CharacterStat, Currency, Nightfall, LeaderboardEntry, LeaderBoardList, PGCRTeam, NameDesc,
    InventoryItem, ItemType, DamageType, Perk, InventoryStat, InventoryPlug, InventorySocket, Rankup, AggHistory,
    Checklist, ChecklistItem, CharCheck, CharChecklist, CharChecklistItem
} from './model';
@Injectable()
export class ParseService {

    constructor(private destinyCacheService: DestinyCacheService) { }
    MAX_LEVEL: number = 30;

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
        char.stats = [];
        Object.keys(c.stats).forEach(key => {
            let val: number = c.stats[key];
            let desc: any = this.destinyCacheService.cache.Stat[key];
            let name = desc.displayProperties.name;
            let sDesc = desc.displayProperties.description;
            char.stats.push(new CharacterStat(name, sDesc, val));
        });
        return char;
    }

    public parseLeaderBoard(resp: any): LeaderBoardList[] {
        //should only be one value
        let mainKey: any = null;
        Object.keys(resp).forEach(key => {
            mainKey = resp[key];
        });
        var returnMe: LeaderBoardList[] = [];
        if (mainKey != null) {
            Object.keys(mainKey).forEach(key => {
                let title: string = key.substring(2);
                title = title.replace(/([A-Z])/g, ' $1');
                let entries: LeaderboardEntry[] = [];
                mainKey[key].entries.forEach(x => {
                    let l: LeaderboardEntry = new LeaderboardEntry();
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
    // factionHash
    private parseProgression(p: _Progression, desc: any): Progression {
        if (desc != null) {

            let prog: Progression = new Progression();
            prog.icon = desc.displayProperties.icon;
            prog.hash = p.progressionHash;
            let name = desc.displayProperties.name;
            let info = "";
            if (name == "Exodus Black AI") {
                name = "Failsafe";
                info = "Nessus";
            }
            else if (name == "Dead Zone Scout") { name = "Devrim"; info = "EDZ"; }
            else if (name == "Vanguard Tactical") { name = "Zavala"; info = "Strikes"; }
            else if (name == "Vanguard Research") { name = "Ikora"; info = "Research"; }
            else if (name == "Fragmented Researcher") { name = "Asher"; info = "IO"; }
            else if (name == "Field Commander") { name = "Sloane"; info = "Titan"; }
            else if (name == "The Crucible") { name = "Crucible"; info = "Shaxx"; }
            else if (name == "Gunsmith") { name = "Gunsmith"; info = "Banshee"; }
            else if (name == "Classified") { return null; }

            //fix names on clan progressions
            if (p.progressionHash == 3759191272) name = "Guided Trials";
            if (p.progressionHash == 1273404180) name = "Guided Nightfall";
            if (p.progressionHash == 3381682691) name = "Guided Raid";
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

            let progNeeded = p.nextLevelAt - p.progressToNextLevel;

            prog.tokensNeeded = ParseService.getTokensNeeded(p.progressionHash, progNeeded);
            prog.percentToNextLevel = p.progressToNextLevel / p.nextLevelAt;
            return prog;
        }
        else {
            return null;
        }
    }

    private static getTokensNeeded(progressionHash: number, progNeeded: number): number {
        //ikora
        if (progressionHash == 3231773039) {
            return Math.ceil(progNeeded / 1000);
        }
        if (progressionHash == 1021210278) {
            return Math.ceil(progNeeded / 75);
        }
        return Math.ceil(progNeeded / 100);
    }


    private static parseMilestoneType(t: number): string {
        //?, tutorial and one-time
        if (t == 0 || t == 1 || t == 2) return null;
        // if (t == 1) return "tut";
        // if (t == 2) return "1-off";
        if (t == 3) return "Weekly";
        if (t == 4) return "Daily";
        if (t == 5) return "Special";
        return "Unknown: " + t;
    }

    private populateProgressions(c: Character, _prog: any, mileStoneDefs: any): void {
        //todo populate char checklists
        c.milestones = {};
        if (_prog.milestones != null) {
            Object.keys(_prog.milestones).forEach((key) => {
                let ms: _Milestone = _prog.milestones[key];
                if (key == "534869653") {
                    //ignore xur;
                    return;
                }               
                //clan rewards special case
                if (key == "4253138191") {

                    //grab weekly reset from this
                    c.startWeek = new Date(ms.startDate);
                    c.endWeek = new Date(ms.endDate);

                    let clanMilestones: ClanMilestoneResults = new ClanMilestoneResults();
                    ms.rewards.forEach(r => {
                        //this week
                        if (r.rewardCategoryHash == 1064137897) {
                            r.entries.forEach(rewEnt => {
                                let rewEntKey = rewEnt.rewardEntryHash;
                                let earned: boolean = rewEnt.earned;

                                if (rewEntKey == 3789021730) {
                                    clanMilestones.nightfall = earned;

                                }
                                else if (rewEntKey == 2112637710) {
                                    clanMilestones.trials = earned;

                                }
                                else if (rewEntKey == 2043403989) {
                                    clanMilestones.raid = earned;
                                }
                                else if (rewEntKey == 964120289) {
                                    clanMilestones.crucible = earned;
                                }
                            });
                        }
                    });

                    c.clanMilestones = clanMilestones;
                    return;
                }
                //add meta
                if (mileStoneDefs[key] == null) {
                    //skip one off faction stuff x2 and CallToAction, meditations, daily free roam, both broken heroic strikes, IB season 3
                    if (key == "364880304" || key == "1718587363" || key == "4109359897" || key == "3245985898" || key == "383198939" || key =="3109354204" || key=="3109354207" || key=="4248276869")
                        return;
                    let desc = this.destinyCacheService.cache.Milestone[ms.milestoneHash];
                    if (desc != null) {
                        let type: string = ParseService.parseMilestoneType(desc.milestoneType);
                        //null is tutorial or one-time, skip
                        if (type == null) return;


                        let name: string = "";
                        let description: string = "";
                        if (desc.displayProperties != null) {
                            name = desc.displayProperties.name;
                            description = desc.displayProperties.description;
                        }

                        if (ms.availableQuests != null && ms.availableQuests.length == 1 && (description == null || description.trim().length == 0)) {
                            let q = ms.availableQuests[0];
                            let qDesc = this.destinyCacheService.cache.InventoryItem[q.questItemHash];
                            if (qDesc != null) {
                                name = qDesc.displayProperties.name;
                                description = qDesc.displayProperties.description;
                                if (description == null || description.trim().length == 0) {
                                    if (q.status.stepObjectives != null && q.status.stepObjectives.length == 1) {
                                        let o = q.status.stepObjectives[0];
                                        let oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                                        description = oDesc.progressDescription;
                                    }
                                }
                            }
                        }
                        if (name == null || name.trim().length == 0) {
                            name = desc.friendlyName;
                        }
                        
                        if (key == "3660836525") {
                            name += " Milestone";
                        }
                        if (key == "463010297" && (description == null || description == "")) {
                            description = "Complete public events at the designated location";
                        }
                        //skip classified for now
                        if (name == null || name == "Classified") return;


                        // //hotspot
                        // if (ms.milestoneHash == 463010297) {
                        //     name = this.destinyCacheService.cache.InventoryItem[ms.availableQuests[0].questItemHash].displayProperties.name;
                        //     description = "Complete public events at the designated location";
                        //     //this is wrong in the DB
                        //     type = "Weekly";

                        // }
                        let milestoneName: MileStoneName = {
                            key: key,
                            type: type,
                            name: name,
                            desc: description,
                            hasPartial: false
                        };
                        mileStoneDefs[key] = milestoneName;
                    }
                    else {
                        console.log("Unknown milestone: " + key);
                        return;
                    }
                }
                let total = 0;
                let complete = 0;
                let info: string = null;
                let suppInfo: string = null;
                let oPct = 0;
                if (ms.availableQuests != null) {

                    ms.availableQuests.forEach((q: _AvailableQuest) => {
                        total++;

                        if (key=="466653501"){
                            if (q.status.stepHash!=null && q.status.stepHash>0){
                                
                                const sDesc = this.destinyCacheService.cache.InventoryItem[q.status.stepHash];
                                if (sDesc!=null){
                                    suppInfo = sDesc.displayProperties.description;
                                }
                            }
                        }


                        if (q.status.completed) complete++;
                        
                        if (q.status.completed == false && q.status.started == true) {
                            let oCntr = 0;
                            if (q.status.stepObjectives != null) {
                                q.status.stepObjectives.forEach(o => {
                                    oCntr++;
                                    let oDesc = this.destinyCacheService.cache.Objective[o.objectiveHash];
                                    if (oDesc.completionValue != null && oDesc.completionValue > 0) {
                                        oPct = o.progress / oDesc.completionValue;
                                    }
                                });
                            }
                        }


                    })
                }
                if (total == 0) total++;
                let pct: number = complete / total;
                if (pct == 0) pct = oPct;
                if (pct > 0 && pct < 1) {
                    info = Math.floor(100 * pct) + "% complete";
                    mileStoneDefs[key].hasPartial = true;
                }
                let m: MilestoneStatus = new MilestoneStatus(key, complete == total, pct, info, suppInfo);

                // THIS WAS A HACK FOR MISREPORTED HEROIC STRIKES BUT THE HACK FALSELY SHOWS COMPLETIONS FOR SOME CHARS THAT HAVEN'T UNLOCKED HEROIC STRIKES YET
                // REMOVING FOR NOW
                // if (key==="3405519164" && ms.availableQuests.length===1){
                //     const aq = ms.availableQuests[0];
                //     // this is complete via hack while the api is bugged
                //     if (aq.status.stepObjectives!=null && aq.status.stepObjectives.length==0){
                //         const ms2: _Milestone = _prog.milestones["1142551194"];
                //         if (ms2!=null && ms2.availableQuests!=null && ms2.availableQuests.length==1 
                //             && ms2.availableQuests[0].status!=null && ms2.availableQuests[0].status.completed==true){
                //             m.complete = true;
                //             m.pct = 1;
                //         }
                //     }
                // }
                c.milestones[key] = m;

            });
        }

        let factions: Progression[] = [];
        if (_prog.factions != null) {
            Object.keys(_prog.factions).forEach((key) => {
                let p: _Progression = _prog.factions[key];
                let prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Faction[p.factionHash]);
                if (prog != null) {
                    factions.push(prog);
                }

            });
        }
        c.maxLevel = this.MAX_LEVEL;

        //only progression we care about right now is Legend
        if (_prog.progressions) {
            Object.keys(_prog.progressions).forEach((key) => {
                if (key == "2030054750") {
                    let p: _Progression = _prog.progressions[key];
                    let prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                    c.legendProgression = prog;
                    c.wellRested = prog.nextLevelAt*3 > prog.weeklyProgress;
                }
            });
        }

        factions.sort(function (a, b) {
            return b.percentToNextLevel - a.percentToNextLevel;
        })
        c.factions = factions;

        //progressions we'll ignore for now, factions has it all
        //quests? are empty for now, check back later
        //uninstancedItemObjectives

    }



    private static getBasicValue(val: any): number {
        if (val == null) return null;
        if (val.basic == null) return;
        return val.basic.value;
    }

    private static getBasicDisplayValue(val: any): string {
        if (val == null) return null;
        if (val.basic == null) return;
        return val.basic.displayValue;
    }

    private parseActivity(a): Activity {
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
                act.success = act.standing == 0;
            }
            else {
                act.success = act.completionReason == 0;
            }


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




    // Prism
    // Momentum
    // 3029674484 Torrent - Boundless power erupts from within. Your abilities recharge much faster. Use them to shatter your foes
    // 3974591367 Attrition - Health and shields regen slowly. Enemies have a chance of leaving wells of Light when they die, which fill health and super

    // 2563004598 Timewarp - Zero Hour: The mission timer CANNOT be extended. Choose your battle carefully
    // 2777023090 Timewarp - Anomalies : Small vex cubes scatter among the strike, shooting one gains 30 seconds.
    // Killing time
    // Rings

    private parseModifier(hash: string): NameDesc {
        let jDesc = this.destinyCacheService.cache.ActivityModifier[hash];
        let name: string = null;
        let desc: string = null;
        if (jDesc != null) {
            name = jDesc.displayProperties.name;
            desc = jDesc.displayProperties.description;
        }
        if (name != null && name != "" && name != "Classified") {
            return new NameDesc(name, desc);
        }

        if (hash == "3029674484") {
            return new NameDesc("Torrent", "Boundless power erupts from within. Your abilities recharge much faster. Use them to shatter your foes");

        }
        if (hash == "3974591367") {
            return new NameDesc("Attrition", " Health and shields regen slowly. Enemies have a chance of leaving wells of Light when they die, which fill health and super");
        }
        if (hash == "2809763955") {
            return new NameDesc("Momentum", "Health and shield regeneration are disabled while standing still. Sprint to regenerate more quickly");
        }
        if (hash == "2563004598") {

            return new NameDesc("Timewarp - Zero Hour", "The mission timer CANNOT be extended. Choose your battle carefully");
        }
        if (hash == "2777023090") {
            return new NameDesc("Timewarp - Anomalies", "Small vex cubes scatter among the strike, shooting one gains 30 seconds.");
        }

        if (hash == "1183352841") {
            return new NameDesc("Timewarp - Killing Time", "Defeat enemies to gain time");
        }

        return new NameDesc("Classified", "Keep it secret, keep it safe");
    }

    public parseAggHistory(resp: any): AggHistory {
        let returnMe: AggHistory = new AggHistory();

        if (resp.activities != null) {
            //activity type hash 2043403989 raid
            //575572995 nightfall
            resp.activities.forEach((act: any) => {
                if (!act.activityHash) return;
 
                let vDesc: any = this.destinyCacheService.cache.Activity[act.activityHash];
                if (vDesc == null) return;
                let tDesc: any = this.destinyCacheService.cache.ActivityType[vDesc.activityTypeHash];
                //raid
                if (vDesc.activityTypeHash == 2043403989) {
                    let desc: any = this.destinyCacheService.cache.Activity[act.activityHash];
                    let name: string = null;
                    let tier: number = null;
                    if (desc) {
                        name = desc.displayProperties.name;
                        tier = desc.tier;
                    }
                    else{
                        console.log("No entry found for activity hash: "+act.activityhash);
                    }
                    if (name==="Leviathan"){
                        //nm
                        if (tier<2){
                            let c = ParseService.getBasicValue(act.values.activityCompletions);
                            returnMe.raid+=c;
                            let f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                            if ((f>0) && (returnMe.raidFastestMs==null || returnMe.raidFastestMs>f)){
                                returnMe.raidFastestMs = f;
                            }
                        }
                        //hm
                        else{
                            let c = ParseService.getBasicValue(act.values.activityCompletions);
                            returnMe.hmRaid+=c;
                            let f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                            if ((f>0) && (returnMe.hmRaidFastestMs==null || returnMe.hmRaidFastestMs>f)){
                                returnMe.hmRaidFastestMs = f;
                            }
                        }

                    }
                    else if (name==="Leviathan, Eater of Worlds"){
                        let c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.eater+=c;
                        let f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f>0) && (returnMe.eaterFastestMs==null || returnMe.eaterFastestMs>f)){
                            returnMe.eaterFastestMs = f;
                        }              
                    }
                    else if (name==="Leviathan, Spire of Stars"){
                        let c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.spire+=c;
                        let f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f>0) && (returnMe.spireFastestMs==null || returnMe.spireFastestMs>f)){
                            returnMe.spireFastestMs = f;
                        }      
                    }
                }
                else if (vDesc.activityTypeHash == 575572995) {
                    //heroic nightfall - scored
                    if (vDesc.directActivityModeHash ==  532484583){
                        let c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.hmNf+=c;
                        let f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f>0) && (returnMe.hmNfFastestMs==null || returnMe.hmNfFastestMs>f)){
                            returnMe.hmNfFastestMs = f;
                        }
                    }
                    //anything else that's a scored nightfall
                    else if (vDesc.directActivityModeHash ==  547513715){
                        let c = ParseService.getBasicValue(act.values.activityCompletions);
                        returnMe.nf+=c;
                        let f = ParseService.getBasicValue(act.values.fastestCompletionMsForActivity);
                        if ((f>0) && (returnMe.nfFastestMs==null || returnMe.nfFastestMs>f)){
                            returnMe.nfFastestMs = f;
                        }
                    }
                }
            });
        }
        return returnMe;
    }

    public parseNightfall(resp: any): Nightfall {

        let q: any = resp["2171429505"].availableQuests[0];
        let aHash = q.activity.activityHash;
        let aDesc = this.destinyCacheService.cache.Activity[aHash];

        let nf: Nightfall = new Nightfall();
        nf.name = aDesc.displayProperties.name;
        nf.desc = aDesc.displayProperties.description;
        nf.image = aDesc.pgcrImage;
        nf.tiers = [];
        let firstTier: number;
        if (q.activity.variants!=null){
            q.activity.variants.forEach(v => {
                let vDesc: any = this.destinyCacheService.cache.Activity[v.activityHash];
                if (firstTier == null) firstTier = v.activityHash;
                nf.tiers.push(vDesc.activityLightLevel);
            });
        }
       
        nf.modifiers = [];
        if (q.activity.modifierHashes!=null){
            q.activity.modifierHashes.forEach(mh => {
                nf.modifiers.push(this.parseModifier(mh));
            });
        }
        
        nf.challenges = [];
        if (q.challenges!=null){
            q.challenges.forEach(c => {
                if (c.activityHash == firstTier) {
                    let oDesc: any = this.destinyCacheService.cache.Objective[c.objectiveHash];
                    nf.challenges.push(new NameDesc(oDesc.displayProperties.name, oDesc.displayProperties.description));
                }
            });
        }
        
        return nf;
    }

    public parseActivities(a: any[]): Activity[] {
        let returnMe: any[] = [];
        a.forEach((act) => {
            let parsed = this.parseActivity(act);
            if (parsed != null)
                returnMe.push(parsed);
        })
        return returnMe;
    }

    private parseProfileChecklists(resp: any): Checklist[]{
        const checklists: Checklist[] = [];

        if (resp.profileProgression != null && resp.profileProgression.data != null && resp.profileProgression.data.checklists != null){
            const oChecklists: any = resp.profileProgression.data.checklists;
            Object.keys(oChecklists).forEach((key) => {
                //skip raid lair
                if (key === "110198094") return;
                const vals: any = oChecklists[key];
                const desc: any = this.destinyCacheService.cache.Checklist[key];
                let cntr=0, cntChecked=0;
                const checkListItems: ChecklistItem[] = [];
                let hasDescs = false;
                for (let entry of desc.entries){
                    cntr++;
                    const hash = entry.hash;
                    let name = entry.displayProperties.name;
                    const checked = vals[entry.hash];
                    let desc = entry.displayProperties.description;
                    
                    if ("Mementos from the Wild"===name)
                        name +=" "+cntr;
                    if (entry.itemHash){
                        let iDesc: any = this.destinyCacheService.cache.InventoryItem[entry.itemHash];
                        desc = iDesc.displayProperties.description;
                    }
                    if (entry.activityHash){
                        this.destinyCacheService.cache.ItemType
                        let iDesc: any = this.destinyCacheService.cache.Activity[entry.activityHash];
                        desc = iDesc.displayProperties.description;
                    }
                    if (desc==null || desc.length==0)
                        desc = null;
                    else if (desc.startsWith("CB.NAV/RUN.()")){
                        desc = desc.substring("CB.NAV/RUN.()".length);
                        name = name.substring(0,3)+" "+desc;
                        desc = null;
                    }

                    if (!hasDescs && desc!=null){
                        hasDescs = true;
                    }

                    const checklistItem: ChecklistItem = {
                        hash: hash,
                        name: name,
                        checked: checked,
                        desc: desc
                    };
                    checkListItems.push(checklistItem);
                    if (checked){
                        cntChecked++;
                    }
                }

                let checklistName = desc.displayProperties.name;
                if (checklistName == "Latent Memories"){
                    checklistName = "Memory Fragments";
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

    private parseCharChecklists(resp: any, chars: Character[]): CharChecklist[]{
        const checklists: CharChecklist[] = [];
        if (resp.characterProgressions && resp.characterProgressions.data ){

            for (let char of chars){
                let charProgs = resp.characterProgressions.data[char.characterId];
                if (charProgs){
                    const oChecklists: any = charProgs.checklists;
                    Object.keys(oChecklists).forEach((key) => {
                        const vals: any = oChecklists[key];
                        const desc: any = this.destinyCacheService.cache.Checklist[key];

                        let checklist: CharChecklist = null;
                        for (let c of checklists){
                            if (c.hash == key){
                                checklist = c;
                            }
                        }
                        if (checklist==null){
                            checklist = {
                                hash: key,
                                name: desc.displayProperties.name,
                                totals: [],
                                entries: []
                            }
                            checklists.push(checklist);
                        }

                        let cntr=0, cntChecked=0;
                        for (let entry of desc.entries){
                            cntr++;
                            const hash = entry.hash;
                            
                            let checklistItem: CharChecklistItem = null;
                            for (let cl of checklist.entries){
                                if (cl.hash == hash){
                                    checklistItem = cl;
                                }
                            }
                            if (checklistItem == null){
                                let name = entry.displayProperties.name;
                               
                                checklistItem = {
                                    hash: hash,
                                    name: name,
                                    allDone: false,
                                    checked: []
                                };
                                checklist.entries.push(checklistItem);
                            }

                            const checked = vals[entry.hash];
                            checklistItem.checked.push({
                                char: char, 
                                checked: checked
                            });

                            checklistItem.allDone = true;
                            for (let c of checklistItem.checked){
                                if (!c.checked){
                                    checklistItem.allDone = false;
                                }
                            }
                            if (checked){
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
        return checklists;
    }

    public parsePlayer(resp: any): Player {
        if (resp.profile != null && resp.profile.privacy == 2) throw new Error("Privacy settings disable viewing this player's profile.");
        if (resp.characters != null && resp.characters.privacy == 2) throw new Error("Privacy settings disable viewing this player's characters.");

        let profile: Profile;
        if (resp.profile != null)
            profile = resp.profile.data;

        let superprivate = false;

        let charsDict: { [key: string]: Character } = {};
        let milestoneList: MileStoneName[] = [];
        let currentActivity: CurrentActivity = null;
        let chars: Character[] = [];
        let hasWellRested = false;

        if (resp.characters != null) {
            const oChars: any = resp.characters.data;
            Object.keys(oChars).forEach((key) => {
                charsDict[key] = this.parseCharacter(oChars[key]);
            });
            let mileStoneDefs: any = {};
            if (resp.characterProgressions){
                if (resp.characterProgressions.data) {
                    const oProgs: any = resp.characterProgressions.data;
                    Object.keys(oProgs).forEach((key) => {
                        let curChar: Character = charsDict[key];
                        this.populateProgressions(curChar, oProgs[key], mileStoneDefs);
                        hasWellRested= curChar.wellRested || hasWellRested;
                    });
                }
                else{
                    superprivate = true;
                }
            }
            
            //convert dictionary to array for UI
            Object.keys(mileStoneDefs).forEach(key => {
                milestoneList.push(mileStoneDefs[key]);
            });

            if (resp.characterActivities){
                //turned on activity privacy
                if (resp.characterActivities.data == null){
                    superprivate = true;
                }
                else if (resp.characterActivities.data) {
                    const oActs: any = resp.characterActivities.data;
                    Object.keys(oActs).forEach((key) => {
                        let curChar: Character = charsDict[key];
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
                let aD: number = Date.parse(a.dateLastPlayed);
                let bD: number = Date.parse(b.dateLastPlayed);
                if (aD < bD) return 1;
                if (aD > bD) return -1;
                return 0;

            });
        }

        const checklists: Checklist[] = this.parseProfileChecklists(resp);
        const charChecklists: CharChecklist[] = this.parseCharChecklists(resp, chars);

        let currencies: Currency[] = [];
        if (resp.profileCurrencies != null) {
            resp.profileCurrencies.data.items.forEach(x => {
                let desc: any = this.destinyCacheService.cache.InventoryItem[x.itemHash];
                if (desc != null) {
                    currencies.push(new Currency(desc.displayProperties.name, desc.displayProperties.icon, x.quantity));
                }
            });
        }

        let gear: InventoryItem[] = [];
        let vault: Character = new Character();
        vault.className = "Vault";
        let shared: Character = new Character();
        shared.className = "Shared";
        let hashRankups: number[] = [];
        let rankups: Rankup[] = [];

        if (resp.characterEquipment != null && resp.characterEquipment.data != null) {
            Object.keys(resp.characterEquipment.data).forEach((key) => {
                let char: Character = charsDict[key];
                let items: _InventoryItem[] = resp.characterEquipment.data[key].items;
                items.forEach(itm => {
                    let parsed: InventoryItem = this.parseInvItem(itm, true, char, vault, resp.itemComponents);
                    if (parsed != null) {
                        gear.push(parsed);
                    }
                });

            });
        }
        if (resp.characterInventories != null && resp.characterInventories.data != null) {
            Object.keys(resp.characterInventories.data).forEach((key) => {
                let char: Character = charsDict[key];
                let items: _InventoryItem[] = resp.characterInventories.data[key].items;
                items.forEach(itm => {
                    let parsed: InventoryItem = this.parseInvItem(itm, false, char, vault, resp.itemComponents);
                    if (parsed != null) {
                        gear.push(parsed);
                    }
                });
            });
        }
        if (resp.profileInventory != null && resp.profileInventory.data != null) {
            //data/items[]
            let items: _InventoryItem[] = resp.profileInventory.data.items;
            items.forEach(itm => {
                let parsed: InventoryItem = this.parseInvItem(itm, false, shared, vault, resp.itemComponents);
                if (parsed != null) {
                    gear.push(parsed);
                }
            });


            //post process faction tokens
            if (chars != null) {
                chars.forEach(c => {
                    if (c.factions == null) return;
                    c.factions.forEach(f => {
                        const held = ParseService.getTokensHeld(f, gear);
                        f.tokensHeld = held;


                        if (f.tokensHeld > f.tokensNeeded) {
                            if (hashRankups.indexOf(f.hash) < 0) {
                                hashRankups.push(f.hash);
                                rankups.push(new Rankup(f.hash, f.name));
                            }
                        }

                    });

                });
            }
        }
        return new Player(profile, chars, currentActivity, milestoneList, currencies, gear, rankups, superprivate, hasWellRested, checklists, charChecklists);
    }

    private static getTokensHeld(f: Progression, gear: InventoryItem[]): number {
        let invKey: string;

        // 1660497607 Failsafe  Nessus 3201839676
        if (f.hash == 1660497607) invKey = "3201839676";
        // 3487922223 Microphasic Datalattice
        // 2949414982 Quantized Datalattice

        // 828982195 Asher IO 3825769808
        if (f.hash == 828982195) invKey = "3825769808";
        // 1305274547 Phaseglass Needle
        // 3756389242 Phaseglass Spire

        // 4235119312 Devrim EDZ 2640973641
        if (f.hash == 4235119312) invKey = "2640973641";
        // 900431481 Dusklight Shard
        // 478751073 Dusklight Crystal

        // 4196149087 Sloane Titan 494493680
        if (f.hash == 4196149087) invKey = "494493680";
        // 461171930 alkane spores, rare
        // 2014411539 alkane dust

        // 1021210278 Gunsmith Banshee ?  685157383 ?   (30 )  (gunsmith materials)
        if (f.hash == 1021210278) invKey = "685157383";
        // 685157381  weapon telemetry

        // 697030790 Crucible Shaxx 183980811
        if (f.hash == 697030790) invKey = "183980811";
        // 611314723 Zavala Strikes 3899548068
        if (f.hash == 611314723) invKey = "3899548068";
        // 3231773039 Ikora Research 3957264072(1000)
        if (f.hash == 3231773039) invKey = "3957264072";

        // 2105209711 New Monarchy 2270228604
        if (f.hash == 2105209711) invKey = "2270228604";
        // 1714509342 Future War Cult 1270564331
        if (f.hash == 1714509342) invKey = "1270564331";
        // 3398051042 Dead Orbit Level 2959556799	
        if (f.hash == 3398051042) invKey = "2959556799";

        // 1482334108 Leviathan 1505278293
        if (f.hash == 1482334108) invKey = "1505278293";
        // 3468066401 The Nine 885593286
        if (f.hash == 3468066401) invKey = "885593286";

        // 1761642340 Iron Banner 1873857625
        if (f.hash == 1761642340) invKey = "1873857625";

        if (invKey == null) return null;

        for (let cntr = 0; cntr < gear.length; cntr++) {
            const i = gear[cntr];
            if (i.hash == invKey) {
                return i.quantity;
            }
        }
        return 0;

    }

    private parseInvItem(itm: _InventoryItem, equipped: boolean, owner: Character, vaultChar: Character, itemComp: any) {
        //vault bucket
        if (itm.bucketHash == 138197802) {
            owner = vaultChar;
        }

        let desc: any = this.destinyCacheService.cache.InventoryItem[itm.itemHash];
        if (desc == null) {
            return null;
            //return new InventoryItem(""+itm.itemHash, "Classified", equipped, owner, null, ItemType.None, "Classified");
        }

        if (desc.itemType != ItemType.Weapon
            && desc.itemType != ItemType.Armor
            && desc.itemType != ItemType.Mod
            //faction tokens and such
            && (desc.inventory.bucketTypeHash != 1469714392)) {
            return null;
        }
        let type: ItemType = desc.itemType;
        if (desc.inventory.bucketTypeHash == 1469714392) {
            type = ItemType.Consumable;
        }

        //TODO parse perks

        let power: number = 0;
        let damageType: DamageType = DamageType.None;
        let perks: Perk[] = [];
        let stats: InventoryStat[] = [];
        let sockets: InventorySocket[] = [];

        if (itemComp != null) {
            if (itemComp.instances != null && itemComp.instances.data != null) {
                let inst: _InventoryInstanceData = itemComp.instances.data[itm.itemInstanceId];
                if (inst != null) {
                    if (inst.primaryStat != null)
                        power = inst.primaryStat.value;
                    equipped = inst.isEquipped;
                    damageType = inst.damageType;
                }

            }

            if (itemComp.perks != null && itemComp.perks.data != null) {
                let _i = itemComp.perks.data[itm.itemInstanceId];
                if (_i != null) {
                    let _perks: _InventoryPerk[] = itemComp.perks.data[itm.itemInstanceId].perks;
                    _perks.forEach(_perk => {
                        let pDesc = this.destinyCacheService.cache.Perk[_perk.perkHash];
                        if (pDesc != null) {
                            let perk = new Perk("" + _perk.perkHash, pDesc.displayProperties.name, pDesc.displayProperties.description, _perk.iconPath, _perk.isActive, _perk.visible);
                            perks.push(perk);
                        }
                    });
                }
            }
            if (itemComp.stats != null && itemComp.stats.data != null) {

                let _i = itemComp.stats.data[itm.itemInstanceId];
                if (_i != null) {
                    let _stats: { [statHash: string]: _InventoryStat } = _i.stats;
                    Object.keys(_stats).forEach((key) => {
                        let _stat: _InventoryStat = _stats[key];
                        let statDesc = this.destinyCacheService.cache.Stat[_stat.statHash];
                        if (statDesc != null) {
                            let stat = new InventoryStat(statDesc.displayProperties.name,
                                statDesc.displayProperties.description, _stat.value);
                            stats.push(stat);
                        }
                    });
                }
            }

            if (itemComp.sockets != null && itemComp.sockets.data != null) {
                let _i = itemComp.sockets.data[itm.itemInstanceId];
                if (_i != null) {
                    let _sockets: { [statHash: string]: _InventorySocket } = _i.sockets;
                    Object.keys(_sockets).forEach((key) => {
                        let plugs: InventoryPlug[] = [];
                        let _socket: _InventorySocket = _sockets[key];
                        //if (!_socket.isEnabled) return;
                        let plugDesc = this.destinyCacheService.cache.InventoryItem[_socket.plugHash];
                        if (plugDesc == null) return;
                        let bonusLight = 0;
                        if (plugDesc.investmentStats!=null){
                            plugDesc.investmentStats.forEach(s => {
                                if (s.statTypeHash == 1935470627) {
                                    bonusLight = s.value;
                                }
                            });
                        }
                        let plug: InventoryPlug = new InventoryPlug(_socket.plugHash + "",
                            plugDesc.displayProperties.name, plugDesc.displayProperties.description, true);
                        plugs.push(plug);
                        if (_socket.reusablePlugHashes != null) {
                            _socket.reusablePlugHashes.forEach(h => {
                                //this one was selected and we're done
                                if (h + "" == plug.hash) return;
                                let plugDesc = this.destinyCacheService.cache.InventoryItem[h];
                                if (plugDesc != null) {
                                    let rPlug = new InventoryPlug(h + "", plugDesc.displayProperties.name,
                                        plugDesc.displayProperties.description, false);
                                    plugs.push(rPlug);
                                }

                            });
                        }
                        sockets.push(new InventorySocket(plugs, bonusLight));
                    });
                }
            }
            // objectives /data/itemInstanceId/stuff?
            // talentGrids
            // plugStates?
        }

        if (perks.length == 0 && desc.perks != null && desc.perks.length > 0) {
            desc.perks.forEach(_perk => {
                let pHash: string = _perk.perkHash;
                let pDesc = this.destinyCacheService.cache.Perk[_perk.perkHash];
                let perk = new Perk("" + _perk.perkHash, pDesc.displayProperties.name,
                    pDesc.displayProperties.description, pDesc.displayProperties.icon, true, pDesc.isDisplayable);
                perks.push(perk);


            });
        }


        return new InventoryItem("" + itm.itemHash, desc.displayProperties.name,
            equipped, owner, desc.displayProperties.icon, type, desc.itemTypeDisplayName, itm.quantity,
            power, damageType, perks, stats, sockets
        );
    }

    public parseClanInfo(j: any): ClanInfo {

        let c: ClanInfo = new ClanInfo();
        c.groupId = j.groupId;
        c.name = j.name;
        c.creationDate = j.creationDate;
        c.memberCount = j.memberCount;
        c.avatarPath = j.avatarPath;
        c.bannerPath = j.bannerPath;
        let progs: Progression[] = [];
        if (j.clanInfo != null && j.clanInfo.d2ClanProgressions != null) {
            Object.keys(j.clanInfo.d2ClanProgressions).forEach((key) => {
                let p: _Progression = j.clanInfo.d2ClanProgressions[key];
                let prog: Progression = this.parseProgression(p, this.destinyCacheService.cache.Progression[p.progressionHash]);
                if (prog != null) {
                    progs.push(prog);
                }

            });

        }
        c.progressions = progs;
        return c;
    }

    public parseClanMembers(members: any[]): BungieGroupMember[] {
        if (members == null) return [];
        let returnMe: BungieGroupMember[] = [];
        members.forEach(x => {
            let b: BungieGroupMember = new BungieGroupMember();
            b.groupId = x.groupId;
            b.isOnline = x.isOnline;
            b.memberType = x.memberType;
            b.destinyUserInfo = this.parseUserInfo(x.destinyUserInfo);
            b.bungieNetUserInfo = x.bungieNetUserInfo;
            returnMe.push(b);
        });


        returnMe.sort(function (a, b) {
            let bs: string = b.destinyUserInfo.displayName;
            let as: string = a.destinyUserInfo.displayName;
            if (bs < as) return 1;
            if (bs > as) return -1;
            return 0;
        });

        return returnMe;
    }

    private parsePGCREntry(e: any): PGCREntry {
        let r: PGCREntry = new PGCREntry();
        r.characterId = e.characterId;
        r.standing = e.standing;
        r.score = ParseService.getBasicValue(e.score);
        if (e.values != null) {

            r.kills = ParseService.getBasicValue(e.values.kills);
            r.deaths = ParseService.getBasicValue(e.values.deaths);

            if (r.deaths == 0) {
                r.kd = r.kills;
            }
            else {
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
                    let data = new PGCRWeaponData();

                    data.hash = w.referenceId;
                    data.kills = ParseService.getBasicValue(w.values.uniqueWeaponKills);
                    data.precPct = ParseService.getBasicValue(w.values.uniqueWeaponKillsPrecisionKills);

                    let desc: any = this.destinyCacheService.cache.InventoryItem[data.hash];
                    if (desc != null) {
                        data.type = desc.itemTypeAndTierDisplayName;
                        data.name = desc.displayProperties.name;
                    }
                    else {
                        data.type = "Classified";
                        data.name = "Classified";
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
            r.ll = desc.activityLightLevel+1;
        }
        else {
            r.name = "redacted";
        }

        r.isPrivate = p.activityDetails.isPrivate;
        r.entries = [];
        let fireTeamCounts: any = {};

        let teamPveSuccess = false;
        r.pve = !desc.isPvP;

        p.entries.forEach((ent) => {
            let entry = this.parsePGCREntry(ent);

            //pve
            if (r.pve) {
                if (entry.completionReason == 0) {
                    teamPveSuccess = true;
                }
            }


            if (entry.activityDurationSeconds != null) {
                r.activityDurationSeconds = entry.activityDurationSeconds;
                //TODO fix this, period is start, not finish
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
                let team = new PGCRTeam();
                team.name = t.teamName;
                team.standing = ParseService.getBasicDisplayValue(t.standing);
                team.score = ParseService.getBasicValue(t.score);
                r.teams.push(team);
            });
            r.teams.sort(function (a, b) {
                return b.score - a.score;
            });
        }

        let fireTeamList = {};

        r.entries.forEach((ent) => {
            let list = fireTeamList[ent.fireteamId];
            if (list == null) {
                fireTeamList[ent.fireteamId] = [];
                list = fireTeamList[ent.fireteamId];
            }
            list.push(ent);
        });

        let cntr: number = 0;
        Object.keys(fireTeamList).forEach((key) => {
            cntr++;

            let list = fireTeamList[key];
            list.forEach((ent) => {
                ent.fireteam = cntr;
            });
        });
        r.entries.sort(function (a, b) {
            let returnMe = b.score - a.score;
            if (returnMe == 0) {
                returnMe = b.kills - a.kills;
            }
            return returnMe;
        });


        return r;

    }

    public static lookupMode(mode: number): string {
        if (mode == 0) return "None";
        if (mode == 2) return "Story";
        if (mode == 3) return "Strike";
        if (mode == 4) return "Raid";
        if (mode == 5) return "All PvP";
        if (mode == 6) return "Patrol";
        if (mode == 7) return "All PvE";
        if (mode == 9) return "Reserved9";
        if (mode == 10) return "Control";
        if (mode == 11) return "Reserved11";
        if (mode == 12) return "Clash";
        if (mode == 13) return "Reserved13";
        if (mode == 15) return "Crimson Doubles";
        if (mode == 16) return "Nightfall";
        if (mode == 17) return "Heroic Nightfall";
        if (mode == 18) return "All Strikes";
        if (mode == 19) return "Iron Banner";
        if (mode == 20) return "Reserved20";
        if (mode == 21) return "Reserved21";
        if (mode == 22) return "Reserved22";
        if (mode == 24) return "Reserved24";
        if (mode == 25) return "All Mayhem";
        if (mode == 26) return "Reserved26";
        if (mode == 27) return "Reserved27";
        if (mode == 28) return "Reserved28";
        if (mode == 29) return "Reserved29";
        if (mode == 30) return "Reserved30";
        if (mode == 31) return "Supremacy";
        if (mode == 32) return "Private Matches All";
        if (mode == 37) return "Survival";
        if (mode == 38) return "Countdown";
        if (mode == 39) return "Trials";
        if (mode == 40) return "Social";
        if (mode == 43) return "Iron Banner Control";
        if (mode == 44) return "Iron Banner Clash";
        if (mode == 45) return "Iron Banner Supremacy";
        if (mode == 46) return "Nightfall (Scored)";
        if (mode == 47) return "Heroic NightFall (Scored)";
        if (mode == 48) return "Rumble";
        if (mode == 49) return "All Doubles";
        if (mode == 50) return "Doubles";
        if (mode == 51) return "Clash (Private)";
        if (mode == 52) return "Control (Private)";
        if (mode == 53) return "Supremacy (Private)";
        if (mode == 54) return "Countdown (Private)";
        if (mode == 55) return "Survival (Private)";
        if (mode == 56) return "Mayhem (Private)";
        if (mode == 57) return "Rumble (Private)";
        if (mode == 58) return "Heroic Adventure";
        if (mode == 59) return "Showdown";
        return "Unknown" + mode;
    }

    public parseBungieMembership(resp: any) {

        let returnMe: BungieMembership = new BungieMembership();
        returnMe.bungieId = resp.bungieNetUser.membershipId;
        let aUser: UserInfo[] = [];
        resp.destinyMemberships.forEach(u => {
            aUser.push(this.parseUserInfo(u));
        });
        returnMe.destinyMemberships = aUser;
        return returnMe;

    }


    public parseBungieMembers(results: _BungieMember[]): BungieMember[] {
        if (results == null) return null;
        let returnMe: BungieMember[] = [];
        results.forEach(r => {
            if (r.isDeleted == true) return;
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
            if (xbl == null && psn == null && bnet == null) return;

            returnMe.push(new BungieMember(r.displayName, r.membershipId, xbl, psn, bnet));

        });
        return returnMe;
    }

    public parseRaidHistory(msNames: MileStoneName[], c: Character, hist: Activity[]){
        var totalRaid: number = 0;
        var totalNormal: number = 0;
        var totalPrestige: number = 0;
        var totalEater: number = 0;
        var totalSpire: number = 0;
        hist.forEach(a => {
            //ignore not completed
            if (!a.completed) return;

            let desc: any = this.destinyCacheService.cache.Activity[a.referenceId];
            let name: string = null;
            let tier: number = null;
            if (desc) {
                name = desc.displayProperties.name;
                tier = desc.tier;
            }
            else{
                console.log("No entry found for activity hash: "+a.referenceId);
            }

            
            let d: Date = new Date(a.period);

            if (name==="Leviathan"){
                if (tier<2){
                    totalNormal++;
                    // if after reset?
                    if (d.getTime() > c.startWeek.getTime()) {
                        c.hasLevNm = true;
                    }
                }
                else{
                    totalPrestige++;
                    // if after reset?
                    if (d.getTime() > c.startWeek.getTime()) {
                        c.hasLevHm = true;
                    }
                }
            }
            else if (name==="Leviathan, Eater of Worlds"){
                totalEater++;
                // if after reset?
                if (d.getTime() > c.startWeek.getTime()) {
                    c.hasEater = true;
                }
            }
            else if (name==="Leviathan, Spire of Stars"){
                totalSpire++;
                // if after reset?
                if (d.getTime() > c.startWeek.getTime()) {
                    c.hasSpire = true;
                }
            }
            totalRaid++;
        });
        c.lifetimeRaid = totalRaid;
        c.lifetimeRaidNormal = totalNormal;
        c.lifetimeRaidPrestige = totalPrestige;
        c.lifetimeEater = totalEater;
        c.lifetimeSpire = totalSpire;


        const EATER_KEY = "1234";
        const SPIRE_KEY = "2345";
        const LEV_NM_KEY = "1235";
        const LEV_HM_KEY = "1236";
        //add psuedo milestone for eater
        let foundEater = false;
        let foundSpire = false;
        let foundNm = false;
        let foundHm = false;
        for (const msName of msNames){
            if (msName.key===EATER_KEY){
                foundEater = true;
            } 
            else if (msName.key===SPIRE_KEY){
                foundSpire = true;
            } 
            else if (msName.key===LEV_NM_KEY){
                foundNm = true;
            }
            else if (msName.key===LEV_HM_KEY){
                foundHm = true;
            }
        }
        if (!foundEater){
            msNames.push({
                key: EATER_KEY,
                type: "Weekly",
                name: "Leviathan, Eater of Worlds",
                desc: "Complete the Leviathan Raid Lair from CoO",
                hasPartial: false
            });
        }
        if (!foundSpire){
            msNames.push({
                key: SPIRE_KEY,
                type: "Weekly",
                name: "Leviathan, Spire of Stars",
                desc: "Complete the Leviathan Raid Lair from Warmind",
                hasPartial: false
            });
        }
        if (!foundNm){
            msNames.push({
                key: LEV_NM_KEY,
                type: "Weekly",
                name: "Leviathan, Raid",
                desc: "Normal mode raid",
                hasPartial: false
            });
        }
        if (!foundHm){
            msNames.push({
                key: LEV_HM_KEY,
                type: "Weekly",
                name: "Leviathan, Prestige",
                desc: "Prestige mode raid",
                hasPartial: false
            });
        }
        const eaterPsuedoMs: MilestoneStatus = new MilestoneStatus(EATER_KEY, c.hasEater, c.hasEater ? 1 : 0, null);
        c.milestones[EATER_KEY] = eaterPsuedoMs;
        const spirePsuedoMs: MilestoneStatus = new MilestoneStatus(SPIRE_KEY, c.hasSpire, c.hasSpire ? 1 : 0, null);
        c.milestones[SPIRE_KEY] = spirePsuedoMs;
        const levNmPsuedoMs: MilestoneStatus = new MilestoneStatus(LEV_NM_KEY, c.hasLevNm, c.hasLevNm ? 1 : 0, null);
        c.milestones[LEV_NM_KEY] = levNmPsuedoMs;
        const levHmPsuedoMs: MilestoneStatus = new MilestoneStatus(LEV_HM_KEY, c.hasLevHm, c.hasLevHm ? 1 : 0, null);
        c.milestones[LEV_HM_KEY] = levHmPsuedoMs;
    }

    public parsePrestigeNfHistory(msNames: MileStoneName[], c: Character, hist: Activity[]){
        
        hist.forEach(a => {
            //ignore not completed
            if (!a.completed) return;

            let desc: any = this.destinyCacheService.cache.Activity[a.referenceId];
            let name: string = null;
            let tier: number = null;
            if (desc) {
                name = desc.displayProperties.name;
                tier = desc.tier;
            }
            else{
                console.log("No entry found for activity hash: "+a.referenceId);
            }            
            let d: Date = new Date(a.period);
            if (d.getTime() > c.startWeek.getTime()) {
                c.hasPrestigeNf = true;
            }
        });
        const NF_HM_KEY = "1237";
        //add psuedo milestone for eater
        let foundNfHmKey = false;
       
        for (const msName of msNames){
            if (msName.key===NF_HM_KEY){
                foundNfHmKey = true;
            } 
        }
        if (!foundNfHmKey){
            msNames.unshift({
                key: NF_HM_KEY,
                type: "Weekly",
                name: "Prestige Nightfall",
                desc: "Complete the Prestige Nightfall",
                hasPartial: false
            });
        }
        
        const prestigeNfPsuedoMs: MilestoneStatus = new MilestoneStatus(NF_HM_KEY, c.hasPrestigeNf, c.hasPrestigeNf ? 1 : 0, null);
        c.milestones[NF_HM_KEY] = prestigeNfPsuedoMs;

    }
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

interface _Milestone {
    milestoneHash: number;
    availableQuests: _AvailableQuest[];
    rewards: any; //special for clan
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


interface _BungieMember {
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

interface _InventoryItem {
    itemHash: number;
    itemInstanceId: string;
    quantity: number;
    bindStatus: number;
    location: number;
    bucketHash: number;
    transferStatus: number;
    lockable: boolean;
    state: number;
}

interface _InventoryInstanceData {
    damageType: number; //YES
    damageTypeHash: number; //YES
    primaryStat: _InventoryStat; //YES
    itemLevel: number;
    quality: number;
    isEquipped: boolean; //YES
    canEquip: boolean;
    equipRequiredLevel: number;
    unlockHashesRequiredToEquip: number[];
    cannotEquipReason: number;
}

interface _InventoryStat {
    statHash: number;
    value: number;
    maximumValue: number;
}

interface _InventoryPerk {
    perkHash: number;
    iconPath: string;
    isActive: boolean;
    visible: boolean;
}

interface _InventorySocket {
    plugHash: number;
    isEnabled: boolean;
    reusablePlugHashes: number[];
}