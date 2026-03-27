import { Injectable } from '@angular/core';
import { parseISO } from 'date-fns';
import { DestinyCacheService } from './destiny-cache.service';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import {
    Activity,
    BoostInfo,
    Character,
    ClanMilestoneResult,
    Const,
    DynamicStrings,
    MilestoneActivity,
    MileStoneName,
    MilestoneStatus,
    NameDesc,
    PrivPublicMilestone,
    PublicMilestone,
    PublicMilestonesAndActivities
} from './model';
import { SimpleParseService } from './simple-parse.service';
import { dynamicStringClear, dynamicStringReplace, getBasicValue } from './parse-utils';

@Injectable({ providedIn: 'root' })
export class MilestoneParserService {

    constructor(private destinyCacheService: DestinyCacheService) {
    }

    public async addPseudoMilestone(key: string, milestonesByKey: { [id: string]: MileStoneName }, milestoneList: MileStoneName[], dependsOn?: string[], ms?: any) {
        if (milestonesByKey[key] == null ) {
            const skipDesc = await this.destinyCacheService.getMilestone(key);
            
            if (skipDesc!= null) {
                // Ignore tuturials (1) and one time milestone (2). This may change over time so check here
                // Right now IB is now 5 = "Special"
                // https://bungie-net.github.io/multi/schema_Destiny-Definitions-Milestones-DestinyMilestoneType.html#schema_Destiny-Definitions-Milestones-DestinyMilestoneType
                if (skipDesc.milestoneType > 2) {
                    let descRewards = await this.parseMilestoneRewards(skipDesc, null, ms);
                    if (descRewards == null || descRewards.trim().length == 0) {
                        descRewards = 'Unknown';
                    }
                    const ms2: MileStoneName = {
                        key: skipDesc.hash + '',
                        resets: milestonesByKey['4196566271']?.resets, // use "Salvation's Edge"
                        rewards: descRewards,
                        boost: this.parseMilestonePl(descRewards),
                        name: skipDesc.displayProperties.name,
                        desc: skipDesc.displayProperties.description,
                        hasPartial: false,
                        dependsOn: dependsOn==null ? []: dependsOn
                    };
                    milestoneList.push(ms2);
                    milestonesByKey[ms2.key] = ms2;
                } else {
                    // console.log(`Skipping known milestone ${skipDesc.displayProperties.name} (${skipDesc.hash}) type = ${skipDesc.milestoneType}`);
                    return;
                }
            } else {
                // console.log('Skipping unknown milestone: ' + key);
                return;
            }
        }
    }

    private async parseActivity(a: any): Promise<Activity> {
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
            act.completed = getBasicValue(a.values.completed);
            act.timePlayedSeconds = getBasicValue(a.values.timePlayedSeconds);
            act.playerCount = getBasicValue(a.values.playerCount);
            act.standing = getBasicValue(a.values.standing);
            act.kills = getBasicValue(a.values.kills);
            act.deaths = getBasicValue(a.values.deaths);
            act.assists = getBasicValue(a.values.assists);
            act.score = getBasicValue(a.values.score);
            act.teamScore = getBasicValue(a.values.teamScore);
            act.kd = getBasicValue(a.values.killsDeathsRatio);
            act.completionReason = getBasicValue(a.values.completionReason);
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
        let name: string | null = null;
        let desc: string | null = null;
        let icon: string | null = null;
        if (jDesc != null) {
            name = jDesc.displayProperties.name;
            desc = jDesc.displayProperties.description;
            icon = jDesc.displayProperties.icon;
        }
        if (name != null && name !== '' && name !== 'Classified') {
            // Bungie doesn't return string variables in their public milestone endpoint, so just strip that part so it's not ugly
            desc = dynamicStringClear(desc!);
            return new NameDesc(name, desc, icon!, hash);
        }
        return new NameDesc('Classified', 'Keep it secret, keep it safe');
    }


    public async parseMilestoneRewards(desc: any, publicMs: any, charMs: any): Promise<string> {
        
        if (desc == null) { return ''; }
        const hash = desc.hash;
        const name = desc.displayProperties.name;
        // list of potential rewards 
        const accumulatedRewards: DestinyItemQuantity[] = [];
        // weekly rituals span almost 200 activities and don't even report the active challenge on public milestones, we know it's a powerful reward, so just use that
        if (hash == 1049998279 ||  hash == 1049998276 || hash == 1049998277) {
            accumulatedRewards.push({itemHash: 2643364263, quantity: 0, hasConditionalVisibility: false});
        } else if (hash === 3603098564) {
            // It's in the cards is a pinnacle, not a powerful
            accumulatedRewards.push({itemHash: 73143230, quantity: 0, hasConditionalVisibility: false});
          } else if (hash === 3243997895) {
            // Captain's Log is a powerful level 2 even though it's listed as a pinnacle.
            accumulatedRewards.push({itemHash: 3114385606, quantity: 0, hasConditionalVisibility: false});
          } else if (hash === 373284212) {
            // Enterprising Explorer II is powerful level 2
            accumulatedRewards.push({itemHash: 3114385606, quantity: 0, hasConditionalVisibility: false});
          } else if (hash === 373284213) {
            // Enterprising Explorer III is powerful level 3
            accumulatedRewards.push({itemHash: 3114385607, quantity: 0, hasConditionalVisibility: false});
          } else if (hash === 4196566271) { 
            // Savation's Edge is a pinnacle
            accumulatedRewards.push({itemHash: 73143230, quantity: 5, hasConditionalVisibility: false});
          } else if (hash === 3427325023) {
            // IB is 9 pinnacle rewards
            accumulatedRewards.push({itemHash: 73143230, quantity: 8, hasConditionalVisibility: false});

          }



        // built directly into the milestone like this https://data.destinysets.com/i/InventoryItem:214619924/Milestone:2029743966
        else if (desc.rewards != null && Object.keys(desc.rewards).length>0) {
            for (const entryKey of Object.keys(desc.rewards)) {
                const entry = desc.rewards[entryKey];
                if (entry.rewardEntries != null) {
                    for (const rewEntKey of Object.keys(entry.rewardEntries)) {
                        const rewEnt = entry.rewardEntries[rewEntKey];
                        if (rewEnt.items != null) {
                            for (const i of rewEnt.items) {
                                accumulatedRewards.push(i);
                            }
                        }
                    }
                }
            }
        } else if (desc.quests && Object.keys(desc.quests).length>0) { // quests is an associative array
            // for it's in the cards 3603098564 we have a milestone def https://data.destinysets.com/i/Milestone:3603098564 with a quest attached to it
            // which has questRewards.items[].legendary engram (which is actually wrong since it's a pinnacle =/ )
            const filteredEntries = Object.values(desc.quests).filter((value: any) => 
                value.questRewards && value.questRewards.items && value.questRewards.items.length > 0
            ).map((value: any) => value.questRewards.items);
            if (filteredEntries.length > 0) {
                for (const entry of filteredEntries) {
                    for (const rewEnt of entry) {
                        // console.log(`${name} has direct quest rewards`)
                        accumulatedRewards.push(rewEnt);
                    }
                }
            }

            const questItemEntries = Object.values(desc.quests).filter((x:any) => x.questItemHash).map((x:any) => x.questItemHash);
            if (questItemEntries.length > 0) {
                for (const questHash of questItemEntries) {
                    const iDesc: any = await this.destinyCacheService.getInventoryItem(questHash);
                    iDesc?.value?.itemValue?.map((value: any) => {
                        // console.log(`${name} has quest item rewards`)
                        accumulatedRewards.push(value);
                    });
                }

            }
        } else if (desc.activities && desc.activities.length>0) {
            for (const act of desc.activities) {
            
                const aDesc: any = await this.destinyCacheService.getActivity(act.activityHash);
                if (!aDesc) { continue; }
                if (aDesc.rewards) {
                    aDesc.rewards.map((value: any) => { 
                        value.rewardItems.map((value: any) => {
                            // console.log(`${name} has direct activity rewards ${value.itemHash}`);
                            accumulatedRewards.push(value);
                        })
                    });

                }
                if (act.challenges && aDesc.challenges) {                    
                    const manifestChallengeHashes = act.challenges?.map((value: any) => value.challengeObjectiveHash);
                    let challengeHashes: string[] = [];
                    if (publicMs && charMs) {
                        throw new Error('Both public and char milestones are not expected');
                    } else if (publicMs) {
                        challengeHashes = publicMs.activities.map((x: any) => x.challengeObjectiveHashes).flat().filter((x: any) => manifestChallengeHashes.includes(x))

                    } else if (charMs) {
                        challengeHashes = charMs.activities.flatMap((x: any) => x.challenges).map((x: any)=>x.objective?.objectiveHash).filter((x: any) => manifestChallengeHashes.includes(x))
                    }

                    aDesc.challenges.filter((x: any) =>  challengeHashes.includes(x.objectiveHash) && x.dummyRewards).map((x: any)=>{
                        x.dummyRewards.map((value: any) => {
                            // console.log(`${name} has activity challenge rewards`)
                            accumulatedRewards.push(value);
                        })
                    })

                }
            }

        }
        // referenced via the activities dummy rewards like this legendary Iconoclasm https://data.destinysets.com/i/Milestone:3940691952
        // to https://data.destinysets.com/i/Milestone:3940691952/Activity:1475344277
        // this one is tough, it's a milestone pointing to an activity. The activity has both rewards directly
        // plus challenges that have their own dummy rewards. The challenge hashes map back to the challnge from the milestone, so we should pick the right one
        // in this case iconoclasm 3940691952 + challenge objective 1702821073 -> activity 1475344277 with challenge objective 1702821073 -> dummyrewards that includes a pinnacle

        // for iron banner it's even nastier, we have to look at the character's milestone progression to see which challenges are active, 
        // and it may vary by char, since one might be on match 0/3 and another 15/18 the rewards are the same though so it doesn't really matter
        // we'll just cheat and show a single reward


        // repeat for all accumatedRewards 
        let rewards = 'Legendary Gear (below PL)';
        let bestBoost = Const.BOOST_DROP_TABLE[Const.BOOST_UNKNOWN];
        for (const re of accumulatedRewards) {
            const rewDesc = await this.destinyCacheService.getInventoryItem(re.itemHash);
            if (rewDesc != null) {
                const boost = this.parseMilestonePl(rewDesc.displayProperties.name);
                if (boost.sortVal > bestBoost.sortVal) {
                    bestBoost = boost;
                    if (re.quantity > 1) {

                        rewards = `${rewDesc.displayProperties.name} (${re.quantity} total)`;
                    } else {
                        rewards = `${rewDesc.displayProperties.name}`;
                    }
                }
            }
        }
        return rewards;
    }


    public parseMilestonePl(rewards: string): BoostInfo {
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


    public async parsePublicMilestones(resp: any): Promise<PublicMilestonesAndActivities> {
        const msMilestones: PrivPublicMilestone[] = [];
        const returnMe: PublicMilestone[] = [];
        Object.keys(resp).forEach(key => {
            const ms: any = resp[key];
            msMilestones.push(ms);
        });
        for (const ms of msMilestones) {
            let skipMe = false; // flag to skip a milestone we detect as should be hidden
            let specialRaidWeekly = false;
            let specialDungeonWeekly = false;
            let specialName = null;
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
                    
                    if (act.challengeObjectiveHashes) {
                        // skip weekly dungeons that aren't active
                        // Grasp of Avarice 1092691445 does not show up in the weekly public profile if active
                        if (desc?.friendlyName?.indexOf('_WEEKLY_DUNGEON_')>=0) {
                            // skip if not active
                            if (act.challengeObjectiveHashes.length == 0) {
                                skipMe = true;
                            }
                        }
                        // handle weekly raid rotation
                        for (const ch of act.challengeObjectiveHashes) {
                            const oDesc = await this.destinyCacheService.getObjective(ch);
                            if (oDesc?.displayProperties?.name.toLowerCase().indexOf('weekly raid') >= 0) {
                                specialRaidWeekly = true;
                                specialName = `Weekly Raid Challenge: ${desc.displayProperties.name}`;
                            } else if (oDesc?.displayProperties?.name.toLowerCase().indexOf('weekly dungeon') >= 0) {
                                specialDungeonWeekly = true;
                                // this week the Milestone name is "Pit of Heresy" but the activity name is "Shattered Throne"
                                // ST is the correct one
                                specialName = `Weekly Dungeon Challenge: ${aDesc.displayProperties.name}`;
                            }
                        }
                    }
                    
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
                if (skipMe) {
                    continue;
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
                            ll: null!,
                            tier: null!,
                            icon: iDesc.displayProperties.icon,
                            modifiers: []
                        });
                    }
                }
            }
            const dAct: Record<string, any> = {};
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
            const rewards = await this.parseMilestoneRewards(desc, ms, null);
        
            const boost = this.parseMilestonePl(rewards);
            const pushMe: PublicMilestone = {
                hash: ms.milestoneHash + '',
                name: specialName ? specialName: desc.displayProperties.name,
                desc: desc.displayProperties.description,
                start: ms.startDate,
                end: ms.endDate,
                order: ms.order,
                icon: icon,
                activities: activities,
                rewards: rewards,
                boost,
                milestoneType: desc.milestoneType,
                dependsOn: [],
                doubled: this.isDoubled(activities),
                weeklyDungeon: specialDungeonWeekly,
                weeklyRaid: specialRaidWeekly
            };
           

            // weekly ritual 3 1049998279 is 1
            // weekly ritual 6 1049998276 is 2
            // Weekly ritual 9 1049998277 is 3
            if (pushMe.hash == '1049998276') { // Ritual 2
                pushMe.dependsOn = ['1049998279'];
            } else if (pushMe.hash == '1049998277') { // Ritual 3
                pushMe.dependsOn = ['1049998279', '1049998276'];
           
            // breach executuble - enterprising explorer, 1 pinnacle, then 2 powerfuls 
            // 1 is 373284215
            // 2 is 373284212
            // 3 is 373284213
            } else if (pushMe.hash == '373284213') { // 3 depends on 1 and 2
                pushMe.dependsOn = ['373284215', '373284212'];
            } else if (pushMe.hash == '373284212') { // 2 depends on 1
                pushMe.dependsOn = ['373284215'];
            }
            returnMe.push(pushMe);
        }
        // if we have no special weekly dungeon, its Grasp of Avarice 1092691445, which is missing due to bug
        if (returnMe.find(m => m.weeklyDungeon)== null) {
            const raid = returnMe.find(m => m.weeklyRaid);
            if (raid) {
                console.log(`Missing weekly dungeon, adding GoA`)
                const GOA_HASH = 1092691445;
                const GOA_ACT_HASH = 3774021532;
                const desc = await this.destinyCacheService.getMilestone(GOA_HASH);
                const aDesc = await this.destinyCacheService.getActivity(GOA_ACT_HASH);
                const pushMe: PublicMilestone = {
                    hash: GOA_HASH + '',
                    name: `Weekly Dungeon Challenge: ${desc.displayProperties.name}`,
                    desc: desc.displayProperties.description,
                    start: raid.start,
                    end: raid.end,
                    order: 31,
                    icon: desc.displayProperties.icon,
                    activities: [
                        {
                            hash: GOA_ACT_HASH+'',
                            name: aDesc.displayProperties.name,
                            desc: aDesc.displayProperties.description,
                            ll: aDesc.activityLightLevel,
                            tier: aDesc.tier,
                            icon: aDesc.displayProperties.icon,
                            modifiers: []
                        }
                    ],
                    rewards: 'Pinnacle Gear',
                    boost: this.parseMilestonePl('Pinnacle Gear'),
                    milestoneType: desc.milestoneType,
                    dependsOn: [],
                    doubled: false,
                    weeklyDungeon: true,
                    weeklyRaid: false
                };
                returnMe.push(pushMe);
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
        let weekStart: Date | null = null;

        // grab special milestones to have them for the home screen and such
        for (const m of returnMe) {
            if (m.milestoneType == 3 && m.start && weekStart == null) {
                weekStart = parseISO(m.start);
            }
        }
        const pmsa: PublicMilestonesAndActivities = {
            publicMilestones: returnMe,
            nightfall: returnMe.find(x => x.hash == '2029743966')!,
            weekStart: weekStart!
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
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP + 30)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP + 30;
                    }
                } else if (nfa.name.endsWith('Master')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP + 30)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP + 30;
                    }
                } else if (nfa.name.endsWith('Legend')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP + 20)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP + 20;
                    }
                } else if (nfa.name.endsWith('Hero')) {
                    if (nfa.ll < (Const.SEASON_PINNACLE_CAP - 40)) {
                        nfa.ll = Const.SEASON_PINNACLE_CAP - 40;
                    }
                }
            }
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

    public async addDisappearingMileStones(milestonesByKey: { [id: string]: MileStoneName }, milestoneList: MileStoneName[]) {
        // if we don't have a hawthorne It's in the Cards, e we probably don't have any milestones, nm
        if (milestonesByKey['3603098564'] == null) {
            return;
        }
    
        // Salvation's Edge 4196566271
        await this.addPseudoMilestone('2136320298', milestonesByKey, milestoneList);
        // breach executuble 1 is 373284215
        await this.addPseudoMilestone('373284215', milestonesByKey, milestoneList);
        // breach executuble 2 is 373284212
        await this.addPseudoMilestone('373284212', milestonesByKey, milestoneList);
        // breach executuble 3 is 373284213
        await this.addPseudoMilestone('373284213', milestonesByKey, milestoneList);

        // Ritual pathfinder
        await this.addPseudoMilestone('3480513797', milestonesByKey, milestoneList);
    }

    public cookMileStones(milestoneList: MileStoneName[], dynamicStrings: DynamicStrings, resp: any, weeklyRitualPathfinderHash: string, chars: Character[]) {
        const ritualPathFinder = milestoneList.find(x => x.key == '3480513797');
        if (ritualPathFinder && weeklyRitualPathfinderHash) {
            ritualPathFinder.rewards = 'Pinnacle Gear (3 total)';
            ritualPathFinder.boost = this.parseMilestonePl(ritualPathFinder.rewards);

            const finalRitualPresNode = resp.profileRecords.data.records[weeklyRitualPathfinderHash];
            let pinnaclesTaken = 0;
            if (finalRitualPresNode) {
                const firstTrue = finalRitualPresNode.rewardVisibilty.findIndex((x: any) => x == true);
                // https://data.destinysets.com/i/Record:3234374170
                // at this moment the first 3 sets of rewards are a prime/bright/enhancement prism/challenger xp
                // after that it's enhancement prism/bright dust/xp only
                // so we can deduce the number of pulls by the index of the rewards
                pinnaclesTaken = Math.min(Math.floor(firstTrue / 4), 3);
            }
            for (const char of chars) {
                const ms = char.milestones['3480513797'];
                ms.phases = [];
                if (ms) {
                    for (let i = 1; i <= 3; i++) {
                        ms.phases.push(i<=pinnaclesTaken);
                    }
                }
           }
        }
 
        const nfScore = milestoneList.find(x => x.key == '2029743966');
        if (nfScore) {
            nfScore.name = 'Nightfall 200K';
            nfScore.desc = 'Complete Nightfalls until your total score reaches 200K';
        }
        const rootOfNightmares = milestoneList.find(x => x.key == '3699252268');
        if (rootOfNightmares?.name?.indexOf('###') > -1) {
            rootOfNightmares!.name = 'Root of Nightmares Raid';
        }
        // weekly ritual
        milestoneList.filter(x => x.key == '1049998276' || x.key == '1049998277' || x.key == '1049998279').map((x) => {
            // weekly ritual 3 1049998279 is 1
            // weekly ritual 6 1049998276 is 2
            // Weekly ritual 9 1049998277 is 3
            if (x.key == '1049998279') {
                x.name += ' 1';
            } else if (x.key == '1049998276') {
                x.name += ' 2';
            } else if (x.key == '1049998277') {
                x.name += ' 3';
            }
        });
        for (const m of milestoneList) {
            m.desc = dynamicStringReplace(m.desc, null!, dynamicStrings);
        }
    }
}
