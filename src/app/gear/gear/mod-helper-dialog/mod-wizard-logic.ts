import { ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { DestinyAmmunitionType, InventoryItem, InventorySocket } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { BehaviorSubject } from 'rxjs';

export interface ModChoices {
    pve: boolean;
    priorityEnergy: EnergyApproach;
    secondaryEnergy: EnergyApproach;
    preferredStat: PreferredStat;
}

export enum EnergyApproach {
    Harmonic = 0,
    Kinetic = 1,
    Arc = 2,
    Solar = 3,
    Void = 4,
    Stasis = 6,
    Strand = 7,
}

// return EnergyApproach as a string
export function getEnergyApproachString(energyApproach: EnergyApproach): string {
    switch (energyApproach) {
        case EnergyApproach.Harmonic:
            return 'Harmonic';
        case EnergyApproach.Kinetic:
            return 'Kinetic';
        case EnergyApproach.Arc:
            return 'Arc';
        case EnergyApproach.Solar:
            return 'Solar';
        case EnergyApproach.Void:
            return 'Void';
        case EnergyApproach.Stasis:
            return 'Stasis';
        case EnergyApproach.Strand:
            return 'Strand';
        default:
            return 'Unknown';
    }
}

// return array of all energy types
export function getEnergyApproachArray(): EnergyApproach[] {
    return [
        EnergyApproach.Harmonic,
        EnergyApproach.Kinetic,
        EnergyApproach.Arc,
        EnergyApproach.Solar,
        EnergyApproach.Void,
        EnergyApproach.Stasis,
        EnergyApproach.Strand
    ];
}

export enum PreferredStat {
    LeaveAlone = 0,
    Mobility = 1,
    Resilience = 2,
    Recovery = 3,
    Discipline = 4,
    Intellect = 5,
    Strength = 6,
}

export const PreferredStats = [
    {
        name: 'Leave Alone',
        value: PreferredStat.LeaveAlone
    },
    {
        name: 'Mobility',
        value: PreferredStat.Mobility
    },
    {
        name: 'Resilience',
        value: PreferredStat.Resilience
    },
    {
        name: 'Recovery',
        value: PreferredStat.Recovery
    },
    {
        name: 'Discipline',
        value: PreferredStat.Discipline
    },
    {
        name: 'Intellect',
        value: PreferredStat.Intellect
    },
    {
        name: 'Strength',
        value: PreferredStat.Strength
    }
];


enum SocketSlotType {
    None = 0,
    StatEnhancement = 1,
    Mod = 2,
}

function getSocketSlotType(socket: InventorySocket): SocketSlotType {
    if (socket.plugWhitelist.length == 0) {
        return SocketSlotType.None;
    }
    if (socket.plugWhitelist.find(x => x.startsWith('enhancements.v2_general'))) {
        return SocketSlotType.StatEnhancement;
    }
    if (socket.plugWhitelist.find(x => x.startsWith('enhancements.v2_'))) {
        return SocketSlotType.Mod;
    }
}

function cookTargetPlugName(name: string, options: ManifestInventoryItem[]): string {
    // if (name == null) {
    //     return null;
    // }
    // if (name == 'Bow Loader') {
    //     return 'Bow Reloader';
    // }
    // if (name == 'Unflinching Machine Gun Aim') {
    //     return 'Unflinching Machine Gun';
    // }
    // if (name == 'Linear Fusion Rifle Scavenger' || name === 'Fusion Rifle Scavenger') {
    //     if (options.find(x => x.displayProperties.name === 'Fusion Scavenger')) {
    //         return 'Fusion Scavenger';
    //     }
    // }
    return name;
}

function getAvailChampionPlugs(socket: InventorySocket): ManifestInventoryItem[] {
    const b = socket.sourcePlugs.filter(x => x.displayProperties.name.startsWith('Anti-Barrier'));
    const o = socket.sourcePlugs.filter(x => x.displayProperties.name.includes('Overload') || x.displayProperties.name.includes('Disrupting'));
    const u = socket.sourcePlugs.filter(x => x.displayProperties.name.includes('Unstoppable'));
    return b.concat(o).concat(u);
}

function doesChampionModMatch(plug: ManifestInventoryItem, w: InventoryItem): boolean {
    // Auto Rifle, Pulse Rifle, Sidearm 
    if (plug.displayProperties.name.includes(w.typeName)) {
        return true;
    }
    // Bow/Fusion/Sword doesn't quite match
    if (w.typeName.includes('Bow') && plug.displayProperties.name.includes('Bow')) {
        return true;

    }
    if (w.typeName.includes('Fusion') && plug.displayProperties.name.includes('Fusion')) {
        return true;

    }
    if (w.typeName.includes('Sword') && plug.displayProperties.name.includes('Blade')) {
        return true;
    }
    return false;
}

function chooseWeaponPlug(socket: InventorySocket, primaryTargetTypeEnum: EnergyApproach, secondaryTargetTypeEnum: EnergyApproach, previousChoices: ManifestInventoryItem[], prefix: string, suffix: string, nodupes?: boolean): ManifestInventoryItem {
    const primaryTargetType = getEnergyApproachString(primaryTargetTypeEnum);
    const secondaryTargetType = getEnergyApproachString(secondaryTargetTypeEnum);
    const primaryFilterName = cookTargetPlugName(`${prefix}${primaryTargetType}${suffix}`, socket.sourcePlugs);
    const secondaryFilterName = secondaryTargetType == null ? null : cookTargetPlugName(secondaryTargetType ? `${prefix}${secondaryTargetType}${suffix}` : null, socket.sourcePlugs);
    // we care about Finder, did we already equip our primary weapon finder?
    let target: ManifestInventoryItem = null;
    const isAlreadyPickedPrimary = previousChoices.find(x => x.displayProperties.name == primaryFilterName) != null;
    const sourcePlugs = socket.sourcePlugs.slice();
    // sort source plugs by cost ascending
    sourcePlugs.sort((a, b) => a.plug?.energyCost?.energyCost - b.plug?.energyCost?.energyCost);
    target = sourcePlugs.find(x => x.displayProperties.name == primaryFilterName);
    if (!isAlreadyPickedPrimary && target) {
        return target;
    }
    // we either already had it, or it wasn't available try secondary if we have an option
    if (secondaryFilterName) {
        const isAlreadyPickedSecondary = previousChoices.find(x => x.displayProperties.name == secondaryFilterName) != null;
        if (!isAlreadyPickedSecondary) {
            target = socket.sourcePlugs.find(x => x.displayProperties.name == secondaryFilterName);
            // if yes, then try to equip its finder
            if (target) {
                return target;
            }
        }
    }
    if (nodupes) {
        return null;
    }
    // check again, not worrying if we're duping the mod
    target = sourcePlugs.find(x => x.displayProperties.name == primaryFilterName);
    if (target) {
        return target;
    }
    if (secondaryFilterName) {
        target = sourcePlugs.find(x => x.displayProperties.name == secondaryFilterName);
        if (target) {
            return target;
        }
    }
    return null;
}

function chooseStatEnhancementTarget(item: InventoryItem, socket: InventorySocket, choices: ModChoices): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.StatEnhancement) {
        return null;
    }
    const preferredStatString = PreferredStat[choices.preferredStat];
    const options = socket.sourcePlugs.filter(x => x.displayProperties.name.includes(preferredStatString));
    // sort options by energy cost descending
    options.sort((a, b) => {
        const aCost = a.plug?.energyCost?.energyCost || 0;
        const bCost = b.plug?.energyCost?.energyCost || 0;
        return bCost - aCost;
    });
    for (const target of options) {
        if (item.canFit(socket, target)) {
            return target;
        }
    }
    return null;
}

function chooseModTarget(item: InventoryItem, socket: InventorySocket, choices: ModChoices, previousChoices: ManifestInventoryItem[]): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.Mod) {
        return null;
    }
    const primaryTargetType = choices.priorityEnergy;
    const secondaryTargetType = choices.secondaryEnergy;
    if (item.inventoryBucket.displayProperties.name == 'Helmet') {
        if (choices.pve) {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Siphon', true);
        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Targeting');
        }
    } else if (item.inventoryBucket.displayProperties.name == 'Gauntlets') {
        if (choices.pve) {            
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Loader');
        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Dexterity');
        }

    } else if (item.inventoryBucket.displayProperties.name == 'Chest Armor') {
        if (choices.pve) {
            return null;
        }
       
        // if (choices.pve) {
        //     if (!previousChoices.find(x => x.displayProperties.name.includes('Concussive'))) {
        //         const concussive = socket.sourcePlugs.find(x => x.displayProperties.name.startsWith('Concussive'));
        //         if (concussive) {
        //             return concussive;
        //         }
        //     }
        //     if (!previousChoices.find(x => x.displayProperties.name.includes('Sniper'))) {
        //         const sniper = socket.sourcePlugs.find(x => x.displayProperties.name.startsWith('Sniper'));
        //         if (sniper) {
        //             return sniper;
        //         }
        //     }
        return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, 'Unflinching ', ' Aim');
    } else if (item.inventoryBucket.displayProperties.name == 'Leg Armor') {
        if (choices.pve) {
            let target: ManifestInventoryItem = null;
            target = chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Scavenger', true);        
            if (target) {
                return target;
            }
            target = chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Weapon Surge', true);
            if (target) {
                return target;
            }
            target = chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', '  Holster', true);
            if (target) {
                return target;
            }
        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Holster');
        }
    } else if (item.inventoryBucket.displayProperties.name == 'Class Armor') {
        // TODO later        
        return null;
    }
    return null;
}

function isSocketInteresting(socket: InventorySocket): boolean {
    return socket.isArmorMod && socket.sourcePlugs && socket.sourcePlugs.length > 0;
}

async function tryToInsertMod(gearService: GearService, item: InventoryItem, socket: InventorySocket, target: ManifestInventoryItem,
    choices: ManifestInventoryItem[], log$: BehaviorSubject<string[]>, previewOnly: boolean): Promise<boolean> {
    if (target) {
        if ((target.hash + '') == socket.active?.hash) {
            // already loaded
            const msg = `  [${target.displayProperties.name} already loaded on ${item.name}]`;
            log$.getValue().push(msg);
            log$.next(log$.getValue());
            return true;
        }
        if (item.canFit(socket, target)) {
            choices.push(target);
            const success = await gearService.insertFreeSocketForArmorMod(item, socket, target, previewOnly);
            if (!success) {
                const msg = `  [Failed to insert ${target.displayProperties.name}(${target.plug?.energyCost?.energyCost}) on ${item.name}]`;
                log$.getValue().push(msg);
                log$.next(log$.getValue());
            } else {
                const msg = `  + ${target.displayProperties.name}(${target.plug?.energyCost?.energyCost}) on ${item.name}`;
                log$.getValue().push(msg);
                log$.next(log$.getValue());
            }
            return success;
        } else {
            const msg = `  [No room for ${target.displayProperties.name}(${target.plug?.energyCost?.energyCost}) on ${item.name}]`;
            log$.getValue().push(msg);
            log$.next(log$.getValue());
        }
    }
    return false;
}

export async function applyMods(gearService: GearService, notificationService: NotificationService,
    modChoices: ModChoices, armor: InventoryItem[], log$: BehaviorSubject<string[]>, previewOnly: boolean): Promise<void> {

    if (previewOnly) {
        // clone armor deeply enough to avoid mucking up our live items
        armor = armor.slice();
        for (let i = 0; i < armor.length; i++) {
            armor[i] = armor[i].cloneForDryRun();
        }
    }
    const log = [];
    log$.next(log);
    if (modChoices.priorityEnergy == null) {
        alert('Please select a primary energy.');
        return;
    }
    if (previewOnly) {
        log.push('* Starting dry run (no mods will be applied)...');
    } else {
        log.push('* Starting...');
    }
    log$.next(log);
    // cycle through armor
    // 1 remove all mods
    log.push('* Removing mods from armor');
    log$.next(log);
    for (const item of armor) {
        // leave class items alone
        if (item.inventoryBucket.displayProperties.name == 'Class Armor') {
            continue;
        }
        // leave chest armor alone for pve
        if (modChoices.pve && item.inventoryBucket.displayProperties.name == 'Chest Armor') {
            continue;
        }
        await clearModsOnItem(gearService, item, log$, modChoices.preferredStat == PreferredStat.LeaveAlone, previewOnly);
    }
    // 2 apply middle mods, if possible
    log.push('* Applying weapon mods for armor');
    log$.next(log);
    for (const item of armor) {
        if (item.inventoryBucket.displayProperties.name == 'Class Armor') {
            continue;
        }
        const choices = [];
        for (const socket of item.sockets) {
            const target = chooseModTarget(item, socket, modChoices, choices);
            await tryToInsertMod(gearService, item, socket, target, choices, log$, previewOnly);
        }
    }

    // 4 apply stat mods if possible
    if (modChoices.preferredStat != PreferredStat.LeaveAlone) {
        log.push('* Applying stat mods for armor');
        log$.next(log);
        for (const item of armor) {
            const choices = [];
            for (const socket of item.sockets) {
                const target = chooseStatEnhancementTarget(item, socket, modChoices);
                await tryToInsertMod(gearService, item, socket, target, [], log$, previewOnly);
            }
        }
    }
    log.push('Complete!');
    log$.next(log);
    if (previewOnly) {
        notificationService.success('Dry run complete, view log above to see what would have happened');
    } else {
        notificationService.success('Mods applied!');
    }
}


async function clearModsOnItem(gearService: GearService, item: InventoryItem, log$: BehaviorSubject<string[]>, ignoreStatEnhancement: boolean, previewOnly: boolean): Promise<void> {
    for (const socket of item.sockets) {
        // is this an armor mod we can work on
        if (!(socket.isArmorMod && socket.sourcePlugs && socket.sourcePlugs.length > 0)) {
            continue;
        }
        // is it already empty?
        if (!socket.active || socket.active.empty) {
            continue;
        }
        if (ignoreStatEnhancement) {
            const type = getSocketSlotType(socket);
            if (ignoreStatEnhancement && type == SocketSlotType.StatEnhancement) {
                continue;
            }
        }
        // can we empty it?
        const target = socket.sourcePlugs.find(p => p.displayProperties.name.includes('Empty'));
        if (target) {
            const logMe = `- ${socket.active?.name} from ${item.name}`;
            const log = log$.getValue();
            log.push(logMe);
            log$.next(log);
            await gearService.insertFreeSocketForArmorMod(item, socket, target, previewOnly);
        }
    }
}

export async function clearMods(gearService: GearService, armor: InventoryItem[], log$: BehaviorSubject<string[]>): Promise<void> {
    const log = ['Starting to clear mods...'];
    log$.next(log);
    for (const item of armor) {
        await clearModsOnItem(gearService, item, log$, false, false);
    }
    log.push('Done!');
    log$.next(log);

}
