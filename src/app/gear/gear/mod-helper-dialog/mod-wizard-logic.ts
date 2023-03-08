import { ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { DestinyAmmunitionType, InventoryItem, InventorySocket } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { BehaviorSubject } from 'rxjs';

export interface ModChoices {
    pve: boolean;
    priorityEnergy: EnergyApproach;
    secondarEnergy: EnergyApproach;
    otherModApproach: OtherModApproach;
    preferredStat: PreferredStat;
}

export enum OtherModApproach {
    LeaveAlone = 0,
    Empty = 1
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
    if (name == null) {
        return null;
    }
    if (name == 'Bow Loader') {
        return 'Bow Reloader';
    }
    if (name == 'Unflinching Machine Gun Aim') {
        return 'Unflinching Machine Gun';
    }
    if (name == 'Linear Fusion Rifle Scavenger' || name === 'Fusion Rifle Scavenger') {
        if (options.find(x => x.displayProperties.name === 'Fusion Scavenger')) {
            return 'Fusion Scavenger';
        }

    }
    // todo Fusion Scavenger (not "Fusion Rifle Scavenger") applies to Linears and Regular Fusion rifles
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

function chooseWeaponPlug(socket: InventorySocket, primaryTargetType: string, secondaryTargetType: string, previousChoices: ManifestInventoryItem[], prefix: string, suffix: string, nodupes?: boolean): ManifestInventoryItem {
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

function chooseGeneralTarget(item: InventoryItem, socket: InventorySocket, choices: ModChoices): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.General) {
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

function tryForSeasonMod(modName: string, item: InventoryItem, socket: InventorySocket, previousChoices: ManifestInventoryItem[], log$: BehaviorSubject<string[]>) {
    const hasProtectiveLight = previousChoices.find(x => x.displayProperties.name.includes(modName));
    if (!hasProtectiveLight) {
        const target = socket.sourcePlugs.find(x => x.displayProperties.name == modName);
        if (target && item.canFit(socket, target)) {
            return target;
        } else if (target) {
            const msg = `  [Tried to insert ${modName}(${target.plug?.energyCost?.energyCost}) but not enough room]`;
            log$.getValue().push(msg);
            log$.next(log$.getValue());
        }
    }
    return null;
}

function chooseSeasonTarget(item: InventoryItem, socket: InventorySocket, choices: ModChoices, previousChoices: ManifestInventoryItem[], log$: BehaviorSubject<string[]>): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.Season) {
        return null;
    }
    if (choices.pve) {
        // try protective light first
        const prot = tryForSeasonMod('Protective Light', item, socket, previousChoices, log$);
        if (prot) {
            return prot;
        }
    } else {
        // try high energy firefirst
        const hef = tryForSeasonMod('High-Energy Fire', item, socket, previousChoices, log$);
        if (hef) {
            return hef;
        }
    }
    const tc = tryForSeasonMod('Taking Charge', item, socket, previousChoices, log$);
    return tc;
}

function cookTargetTypename(item: InventoryItem): string | null {
    if (item == null) {
        return null;
    }
    const typeName = item.typeName;
    if (typeName == 'Combat Bow') {
        return 'Bow';
    }
    return typeName;
}

function chooseModTarget(item: InventoryItem, weapons: InventoryItem[], socket: InventorySocket, choices: ModChoices, previousChoices: ManifestInventoryItem[]): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.Mod) {
        return null;
    }
    const primaryTargetType = cookTargetTypename(choices.priorityWeapon);
    const secondaryTargetType = cookTargetTypename(choices.secondaryWeapon);
    if (item.inventoryBucket.displayProperties.name == 'Helmet') {
        if (choices.pve) {
            if (choices.priorityWeapon.ammoType == DestinyAmmunitionType.Primary) {
                if (choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary) {
                    // TODO holster?
                    return chooseWeaponPlug(socket, secondaryTargetType, secondaryTargetType, previousChoices, '', ' Ammo Finder');
                }
                return null;
            }
            const secondaryScavHelpful = choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary;
            return chooseWeaponPlug(socket, primaryTargetType, secondaryScavHelpful ? secondaryTargetType : null, previousChoices, '', ' Ammo Finder');
        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Targeting');
        }
    } else if (item.inventoryBucket.displayProperties.name == 'Gauntlets') {

        if (choices.pve) {
            if (choices.champions) {
                const available = getAvailChampionPlugs(socket);
                console.log('Found champion mods');
                console.dir(available.map(x => x.displayProperties.name));
                // champion plugs are available, do they have a weapon that can use it?
                for (const plug of available) {
                    // plug already loaded
                    console.log(`xxx ${plug.displayProperties.name}`);
                    if (previousChoices.find(x => x.displayProperties.name == plug.displayProperties.name)) {
                        continue;
                    }
                    for (const w of weapons) {
                        console.log(`Checking ${w.name} for ${plug.displayProperties.name}`);
                        if (doesChampionModMatch(plug, w)) {
                            return plug;
                        }
                    }
                }
            }
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Loader');
        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Dexterity');
        }

    } else if (item.inventoryBucket.displayProperties.name == 'Chest Armor') {
        if (choices.pve) {
            if (!previousChoices.find(x => x.displayProperties.name.includes('Concussive'))) {
                const concussive = socket.sourcePlugs.find(x => x.displayProperties.name.startsWith('Concussive'));
                if (concussive) {
                    return concussive;
                }
            }
            if (!previousChoices.find(x => x.displayProperties.name.includes('Sniper'))) {
                const sniper = socket.sourcePlugs.find(x => x.displayProperties.name.startsWith('Sniper'));
                if (sniper) {
                    return sniper;
                }
            }

        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, 'Unflinching ', ' Aim');
        }
    } else if (item.inventoryBucket.displayProperties.name == 'Leg Armor') {
        let target: ManifestInventoryItem = null;

        const primaryScavHelpful = choices.priorityWeapon.ammoType !== DestinyAmmunitionType.Primary;
        const secondaryScavHelpful = choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary;

        // any scavs worth getting? note that they don't double stack
        if (primaryScavHelpful && secondaryScavHelpful) {
            target = chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Scavenger', true);
        } else if (primaryScavHelpful) {
            target = chooseWeaponPlug(socket, primaryTargetType, null, previousChoices, '', ' Scavenger', true);
        } else if (secondaryScavHelpful) {
            target = chooseWeaponPlug(socket, secondaryTargetType, null, previousChoices, '', ' Scavenger', true);
        }
        if (target) {
            return target;
        }
        target = chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Holster');
        if (target) {
            return target;
        }
        return null;
    } else if (item.inventoryBucket.displayProperties.name == 'Class Armor') {
        // TODO later
        // if pve and they have a fusion and they have particle deconstruction, use it
        // if pve and they have a sword and passive guard, use it
        // if pve and champions and they're a solar subclass with withering heat use it
        // if pve and light class and focusing lens, use it

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
    modChoices: ModChoices, armor: InventoryItem[], weapons: InventoryItem[], log$: BehaviorSubject<string[]>, previewOnly: boolean): Promise<void> {

    if (previewOnly) {
        // clone armor deeply enough to avoid mucking up our live items
        armor = armor.slice();
        for (let i = 0; i < armor.length; i++) {
            armor[i] = armor[i].cloneForDryRun();
        }
    }
    const log = [];
    log$.next(log);
    if (modChoices.priorityWeapon == null) {
        alert('Please select a primary weapon.');
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
        if (item.inventoryBucket.displayProperties.name == 'Class Armor') {
            continue;
        }
        await clearModsOnItem(gearService, item, log$, modChoices.preferredStat == PreferredStat.LeaveAlone, modChoices.seasonApproach == SeasonalApproach.LeaveAlone, previewOnly);
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
            const target = chooseModTarget(item, weapons, socket, modChoices, choices);
            await tryToInsertMod(gearService, item, socket, target, choices, log$, previewOnly);
        }
    }

    // 3 apply seasonal mods if possible
    if (modChoices.seasonApproach != SeasonalApproach.LeaveAlone) {
        log.push('* Applying seasonal mods for armor');
        log$.next(log);

        const seasonalChoices = [];
        for (const item of armor) {
            for (const socket of item.sockets) {
                const target = chooseSeasonTarget(item, socket, modChoices, seasonalChoices, log$);
                await tryToInsertMod(gearService, item, socket, target, seasonalChoices, log$, previewOnly);
            }
        }
    }

    // 4 apply general mods if possible
    if (modChoices.preferredStat != PreferredStat.LeaveAlone) {
        log.push('* Applying general mods for armor');
        log$.next(log);
        for (const item of armor) {
            const choices = [];
            for (const socket of item.sockets) {
                const target = chooseGeneralTarget(item, socket, modChoices);
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


async function clearModsOnItem(gearService: GearService, item: InventoryItem, log$: BehaviorSubject<string[]>, ignoreGeneral: boolean, ignoreSeasonal: boolean, previewOnly: boolean): Promise<void> {
    for (const socket of item.sockets) {
        // is this an armor mod we can work on
        if (!(socket.isArmorMod && socket.sourcePlugs && socket.sourcePlugs.length > 0)) {
            continue;
        }
        // is it already empty?
        if (!socket.active || socket.active.empty) {
            continue;
        }
        if (ignoreGeneral || ignoreSeasonal) {
            const type = getSocketSlotType(socket);
            if (ignoreGeneral && type == SocketSlotType.General) {
                continue;
            }
            if (ignoreSeasonal && type == SocketSlotType.Season) {
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
            // do we need to sleep here?
        }
    }
}

export async function clearMods(gearService: GearService, armor: InventoryItem[], log$: BehaviorSubject<string[]>): Promise<void> {
    const log = ['Starting to clear mods...'];
    log$.next(log);
    for (const item of armor) {
        await clearModsOnItem(gearService, item, log$, false, false, false);
    }
    log.push('Done!');
    log$.next(log);

}
