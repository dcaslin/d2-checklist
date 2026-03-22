import { Injectable } from '@angular/core';
import { DestinyCacheService, ManifestInventoryItem } from './destiny-cache.service';
import {
    ApiInventoryBucket,
    BoostInfo,
    BUCKETS_ARMOR,
    BUCKETS_WEAPON,
    ClanInfo,
    ClassAllowed,
    Const,
    DamageType,
    DestinyAmmunitionType,
    DestinyObjectiveUiStyle,
    DynamicStrings,
    InventoryItem,
    InventoryPlug,
    InventorySocket,
    InventoryStat,
    ItemObjective,
    ItemState,
    ItemType,
    MasterworkInfo,
    NameDesc,
    NameQuantity,
    PrivPlugSetEntry,
    Progression,
    Questline,
    StatHashes,
    Target,
    WeaponShapeLevelObjective
} from './model';
import { TriumphParserService } from './triumph-parser.service';
import { dynamicStringClear, dynamicStringReplace, parseProgression, PrivInventoryItem, PrivItemEnergy, PrivProgression } from './parse-utils';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';

const IGNORE_WEAPON_PERK_STATS = [3511092054]; // Elemental capacitor

@Injectable({ providedIn: 'root' })
export class GearParserService {

    constructor(
        private destinyCacheService: DestinyCacheService,
        private triumphParser: TriumphParserService
    ) {
    }

    public static cookDamageType(damageType: DamageType): string {
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
        } else if (damageType == DamageType.Strand) {
            return 'Strand';
        } else {
            return '';
        }
    }

    public static isDamageTypeEnergy(damageType: DamageType): boolean {
        if (damageType == DamageType.Arc) {
            return true;
        } else if (damageType == DamageType.Thermal) {
            return true;
        } else if (damageType == DamageType.Void) {
            return true;
        } else if (damageType == DamageType.Stasis) {
            return true;
        } else if (damageType == DamageType.Strand) {
            return true;
        } else {
            return false;
        }
    }

    private parseCraftedMasterwork(plugDesc: any): MasterworkInfo {
        let invStat = null;

        // find max invstat 
        for (const i of plugDesc.investmentStats) {
            if (invStat == null || i.value > invStat.value) {
                invStat = i;
            }
        }
        if (invStat==null){
             return null!;
        }
        const tier = invStat.value;
        const statHash = invStat.statTypeHash;
        const statDesc: any = this.destinyCacheService.cacheLite.Stat[statHash];        
        if (statDesc == null) {
            return null!;
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

    private parseMasterwork(plugDesc: any): MasterworkInfo {
        if (plugDesc.plug == null) { return null!; }
        if (plugDesc.plug.plugCategoryIdentifier == null) { return null!; }
        if (plugDesc.plug.plugCategoryIdentifier.indexOf('masterworks.stat.') < 0) {
            return null!;
        }
        // from here on out we know its MW
        if (plugDesc.investmentStats == null || plugDesc.investmentStats.length == 0) {
            return null!;
        }
        const invStats = plugDesc.investmentStats[0];
        const tier = invStats.value;
        const statHash = invStats.statTypeHash;
        const statDesc: any = this.destinyCacheService.cacheLite.Stat[statHash];
        if (statDesc == null) {
            return null!;
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

    public static getPlugName(plugDesc: any): string {
        const name = plugDesc.displayProperties.name;
        if (name == null) { return null!; }
        if (name.trim().length == 0) { return null!; }
        if (plugDesc.plug == null) { return null!; }
        if (plugDesc.plug.plugCategoryIdentifier == null) { return null!; }
        if (plugDesc.plug.plugCategoryHash == null) { return null!; }
        const ch = plugDesc.plug.plugCategoryHash;
        if (ch == 2947756142) { // hide trackers
            return null!;
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
                    statDict[key] = new InventoryStat(+key, jDesc.displayProperties.name,
                        jDesc.displayProperties.description, val.value, jDesc.index);
                });
                // also grab the stats from the API architetype
                const ostats = desc.stats.stats;
                Object.keys(ostats).forEach(key => {
                    const val: any = ostats[key];
                    // if we already got the real instance data, ignore the architetype stats
                    if (statDict[key] == null) {
                        const jDesc: any = this.destinyCacheService.cacheLite.Stat[key];
                        statDict[key] = new InventoryStat(+key, jDesc.displayProperties.name,
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
        // for debugging, show only one specific item, 
        // ONLY DO THIS FOR EQUIPPED ITEMS, this will us into thinking the inv load failed
        // if you do it for unequipped items, we'll think the entire inv loaded properly and it will delete all your tags!
        // if (itm.itemInstanceId!='6917529867878011327') {
        //     return null;
        // }
        try {
            const desc: any = await this.destinyCacheService.getInventoryItem(itm.itemHash);
            if (desc == null) {
                console.log('Skipping - no desc: ' + itm.itemHash);
                return null!;
                // return new InventoryItem(""+itm.itemHash, "Classified", equipped, owner, null, ItemType.None, "Classified");
            }
            // anything with no type goes away too

            let type: ItemType = desc.itemType;
            let itemTypeDisplayName = desc.itemTypeDisplayName;
            
            let craftProgress: WeaponShapeLevelObjective | null = null;

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
                            console.log('Skipping no type: ' + itm.itemHash);
                            return null!;
                        }

                    }
                } else {
                    return null!;
                }
            } else {
                type = desc.itemType;
            }
            const postmaster = (itm.bucketHash == 215593132);
            let ammoType: DestinyAmmunitionType | null = null;
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
                return null!;
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
                } else if (type === ItemType.None && desc.itemTypeDisplayName.indexOf('Shader') >= 0) {
                    type = ItemType.Shader;
                } else if ((type === ItemType.Dummy || type == ItemType.Mod || type === ItemType.None) && desc.displayProperties.name.endsWith('Element')) {
                    // type = ItemType.ExchangeMaterial;       
                    // itemTypeDisplayName = 'Shaping Material';
                    return null!;
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
                } else if (desc.itemType === ItemType.None && desc.inventory.recipeItemHash) {
                    type = ItemType.Weapon;
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
                    return null!;
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
                    let objs: any[] | null = null;
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
                                progressDescription: dynamicStringReplace(oDesc.progressDescription, null!, dynamicStrings!),
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
                        const craftedLevel = pObj.objectivesPerPlug['659359923'] || pObj.objectivesPerPlug['1922808508'] || pObj.objectivesPerPlug['4029346515'];
                        if (craftedLevel != null && craftedLevel.length>0) {
                            let dateCrafted: number | null = null;
                            let level: number | null = null;
                            let objective: WeaponShapeLevelObjective | null = null;
                            for (const o of craftedLevel) {
                                const oDesc = await this.destinyCacheService.getObjective(o.objectiveHash);
                                if (oDesc.uiStyle == DestinyObjectiveUiStyle.CraftingWeaponLevel || oDesc.progressDescription == 'Weapon Level' ) {
                                    level = o.progress;
                                    continue;
                                }
                                if (oDesc.uiStyle == DestinyObjectiveUiStyle.CraftingWeaponLevelProgress || oDesc.progressDescription=='Level Progress' ) {
                                    const iObj: WeaponShapeLevelObjective = {
                                        hash: o.objectiveHash,
                                        completionValue: oDesc.completionValue,
                                        progressDescription: dynamicStringReplace(oDesc.progressDescription, null!, dynamicStrings!),
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
                                if (oDesc.uiStyle == DestinyObjectiveUiStyle.CraftingWeaponTimestamp || oDesc.progressDescription == 'Shaping Date' ) {
                                    dateCrafted = o.progress ? o.progress * 1000 : null;
                                    continue;
                                }
                            }
                            if (objective) {
                                objective.level = level!;
                                objective.date = dateCrafted!;
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
            let armorCapacity: number | null = null;
            let capacityUsed: number | null = null;
            let totalStatPoints: number | null = null;
            let equipped = false;
            let canEquip = false;
            let searchText = '';
            let seasonalModSlot = -1;
            const coveredSeasons = [];


            const specialModSockets: string[] = [];
            let stats: InventoryStat[] = [];
            const sockets: InventorySocket[] = [];
            let mw: MasterworkInfo | null = null;
            let inventoryBucket: ApiInventoryBucket | null = null;
            let tier = null;
            let isRandomRoll = false;
            let deepsight = false;
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
                            armorCapacity = itmEnergy.energyCapacity;
                            capacityUsed = itmEnergy.energyUsed;

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
                                        // Adept mods are loaded from the response below
                                        // if you remove this line it won't change many things, but it will cause adept mods 
                                        // to stop showing as an option for Adept weapons
                                        const compData = resp?.itemComponents?.reusablePlugs?.data[itm.itemInstanceId]
                                        if (compData && compData.plugs && compData.plugs[index]) {
                                            const respComponentPlugs: PrivPlugSetEntry[] = compData.plugs[index];
                                            pp = pp.concat(respComponentPlugs);
                                        }

                                        pp = pp.filter(x => x.enabled && x.canInsert);
                                        let plugDefs = [];
                                        for (const x of pp) {
                                            const plugDef = await this.destinyCacheService.getInventoryItem(x.plugItemHash);
                                            plugDefs.push(plugDef);
                                        }
                                        plugDefs = plugDefs.filter(x => x != null);
                                        sourcePlugs = plugDefs;
                                        const socketTypeDesc = await this.destinyCacheService.getSocketType(socketDesc.socketTypeHash);
                                        if (socketTypeDesc?.plugWhitelist) {
                                            plugWhitelist = socketTypeDesc.plugWhitelist.map((x: any) => x.categoryIdentifier);
                                        }
                                    }
                                    const modSocketType = emptyModSocketDesc?.itemTypeDisplayName;
                                    if ('enhancements.raid_garden'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('gos');
                                        searchText += 'has:modgos';
                                        seasonalModSlot = 2;
                                        coveredSeasons.push(2);
                                    } else if ('enhancements.raid_descent'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('deepstone');
                                        searchText += 'has:moddeepstone';
                                        seasonalModSlot = 3;
                                        coveredSeasons.push(3);
                                    } else if ('enhancements.raid_v520'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('vog');
                                        searchText += 'has:modvog';
                                        seasonalModSlot = 4;
                                        coveredSeasons.push(4);
                                    } else if ('enhancements.raid_v600'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('vod');
                                        searchText += 'has:modvod';
                                        seasonalModSlot = 5;
                                        coveredSeasons.push(5);                                   
                                    }  else if ('enhancements.raid_v620'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('kf');
                                        searchText += 'has:modkf';
                                        seasonalModSlot = 6;
                                        coveredSeasons.push(6);                                   
                                    } else if (modSocketType?.indexOf('Last Wish Raid Mod') >= 0) {
                                        specialModSockets.push('lw');
                                        searchText += 'has:modlw';
                                        seasonalModSlot = 1;
                                        coveredSeasons.push(1);
                                    } else if ('enhancements.raid_v800'==emptyModSocketDesc?.plug?.plugCategoryIdentifier) {
                                        specialModSockets.push('se');
                                        searchText += 'has:modse';
                                        seasonalModSlot = 8;
                                        coveredSeasons.push(8);                                   
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
                                        const plugName = GearParserService.getPlugName(plugDesc);
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
                                    } else  if (plugDesc.itemTypeAndTierDisplayName.indexOf('Enhanced Intrinsic')>0 && plugDesc.investmentStats?.length > 0) {
                                        const mwInfo = this.parseCraftedMasterwork(plugDesc);
                                        if (mwInfo != null) {
                                            mw = mwInfo;
                                        }
                                    }

                                    // this is where the Artifice Armor perk shows up, but not the slot
                                    const plugName = GearParserService.getPlugName(plugDesc);
                                    if (plug.plugHash == 3727270518) {
                                        specialModSockets.push('artifice');
                                        searchText += 'has:modartifice';
                                        seasonalModSlot = 10;
                                        coveredSeasons.push(10);
                                    }
                                    if (plugName == null) { continue; }

                                    // this will have name "Deepsight Resonance"
                                    // this is how we deptect deepsight armor now
                                    if (plugDesc.plug?.plugCategoryHash==2748073883) {
                                        deepsight = true;
                                    }
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
                                sockets.push(new InventorySocket(jCat.socketCategoryHash, plugWhitelist, plugs, possiblePlugs, index, sourcePlugs!));
                                if (socketDesc.randomizedPlugSetHash) {                                    
                                    const randomRollsDesc: any = await this.destinyCacheService.getPlugSet(socketDesc.randomizedPlugSetHash);
                                    if (randomRollsDesc && randomRollsDesc.reusablePlugItems) {
                                        for (const option of randomRollsDesc.reusablePlugItems) {
                                            const plugDesc: any = await this.destinyCacheService.getInventoryItem(option.plugItemHash);
                                            const plugName = GearParserService.getPlugName(plugDesc);
                                            if (plugName == null) { continue; }
                                            // this is used to show perks on weapons on "Possible Rolls"
                                            const oPlug = new InventoryPlug(plugDesc.hash,
                                                plugName, plugDesc.displayProperties.description,
                                                plugDesc.displayProperties.icon, false, plugDesc.plug.energyCost,
                                                plugDesc.itemTypeDisplayName);
                                            if (option.craftingRequirements?.requiredLevel > 0) {
                                                oPlug.requiredLevel = option.craftingRequirements.requiredLevel;
                                            }
                                            oPlug.currentlyCanRoll = option.currentlyCanRoll;
                                            possiblePlugs.push(oPlug);
                                        }
                                    }
                                } else if (socketDesc.singleInitialItemHash) {
                                    const plugDesc: any = await this.destinyCacheService.getInventoryItem(socketDesc.singleInitialItemHash);
                                    const plugName = GearParserService.getPlugName(plugDesc);
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
            const masterworked = (itm.state & ItemState.Masterwork) > 0 || mw!?.tier >= 10;
            const tracked = (itm.state & ItemState.Tracked) > 0;
            const crafted = (itm.state & ItemState.Crafted) > 0;
            if (crafted && mw==null) {
                mw = {
                    hash: '0',
                    name: 'None',
                    desc: '',
                    icon: null!,
                    tier: 0,
                    godTierPve: false,
                    godTierPvp: false,
                    recommendedPvpMws: [],
                    recommendedPveMws: []
                };
            }
            let notCrafted = desc.inventory.recipeItemHash && !crafted;

            const bucketOrder: number | null = null;

            let questline: Questline | null = null;
            if (desc.objectives != null && type == ItemType.QuestStep) {
                const qli = desc.objectives.questlineItemHash;

                if (qli != null && qli != 0) {
                    questline = await this.triumphParser.parseQuestLine(qli, itm.itemHash);
                    if (questline == null) {
                        return null!;
                    }
                }
            }
            if (mw != null) {
                searchText += ' is:mw:' + mw.name;
            }
            if (masterworked) {
                searchText += ' is:masterwork';
            }
            if (crafted) {
                searchText += ' is:crafted';
            }
            if (deepsight) {
                searchText += ' is:deepsight';
            }
            if (notCrafted) {
                searchText += ' is:notcrafted';
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
                searchText += ' ' + GearParserService.cookDamageType(damageType);
            }
            if (GearParserService.isDamageTypeEnergy(damageType)) {
                searchText += ' energy';
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
                    totalStatPoints! += s.value;
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
            if ('Jötunn' === desc.displayProperties.name) {
                searchText += 'Jotunn ';
            }
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
                power, damageType, stats, sockets, objectives,
                description,
                desc.classType, bucketOrder!, aggProgress, values, itm.expirationDate,
                locked, masterworked, mw!, tracked, questline!, searchText, inventoryBucket!, tier, options.slice(),
                isRandomRoll, ammoType!, postmaster, capacityUsed!, armorCapacity!, totalStatPoints!, seasonalModSlot,
                coveredSeasons, powerCap, redacted, specialModSockets, desc.collectibleHash, itm.versionNumber!, crafted, deepsight, craftProgress!, notCrafted
            );
        } catch (exc) {
            console.dir(itemComp);
            console.error(exc);
            return null!;
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
