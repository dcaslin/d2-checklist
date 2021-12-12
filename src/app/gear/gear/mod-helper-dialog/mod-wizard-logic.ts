import { ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { DestinyAmmunitionType, InventoryItem, InventorySocket } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { sleep } from '@app/shared/utilities';
import { BehaviorSubject } from 'rxjs';

export interface ModChoices {
    pve: boolean;
    priorityWeapon: InventoryItem;
    secondaryWeapon: InventoryItem;
    champions: boolean;
    protectiveLight: boolean;
    highEnergyFire: boolean;
    preferredStat: string;
}

function cookTargetType(targetType: string): string {
    if (targetType == null) {
        return null;
    }
    if (targetType.startsWith('Linear ')) {

    }
}

export const PreferredStats = [
    'Mobility',
    'Resilience',
    'Recovery',
    'Discipline',
    'Intellect',
    'Strength',
];

enum SocketSlotType {
    None = 0,
    General = 1,
    Mod = 2,
    Season = 3
}


function getSocketSlotType(socket: InventorySocket): SocketSlotType {
    if (socket.plugWhitelist.length == 0) {
        return SocketSlotType.None;
    }
    if (socket.plugWhitelist.find(x => x.startsWith('enhancements.season_'))) {
        return SocketSlotType.Season;
    }
    if (socket.plugWhitelist.find(x => x.startsWith('enhancements.v2_general'))) {
        return SocketSlotType.General;
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
    if (w.typeName.includes('Bow')) {
        if (plug.displayProperties.name.includes('Bow')) {
            return true;
        }

    } else if (w.typeName.includes('Pulse')) {
        if (plug.displayProperties.name.includes('Pulse')) {
            return true;
        }

    } else if (w.typeName.includes('Fusion')) {
        if (plug.displayProperties.name.includes('Fusion')) {
            return true;
        }

    } else if (w.typeName.includes('Sword')) {
        if (plug.displayProperties.name.includes('Blade')) {
            return true;
        }
    }
    return false;
}

function chooseWeaponPlug(socket: InventorySocket, primaryTargetType: string, secondaryTargetType: string, previousChoices: ManifestInventoryItem[], prefix: string, suffix: string): ManifestInventoryItem {
    const primaryFilterName = cookTargetPlugName(`${prefix}${primaryTargetType}${suffix}`, socket.sourcePlugs);
    const secondaryFilterName = cookTargetPlugName(secondaryTargetType ? `${prefix}${secondaryTargetType}${suffix}` : null, socket.sourcePlugs);
    // we care about Finder, did we already equip our primary weapon finder?
    if (previousChoices.find(x => x.displayProperties.name == primaryFilterName)) {
        // if yes, do we have a secondary weapon?
        if (secondaryFilterName) {
            const target = socket.sourcePlugs.find(x => x.displayProperties.name == secondaryFilterName);
            // if yes, then try to equip its finder
            if (target) {
                return target;
            }
            // if we didn't have it, now what?
        }
    } else {
        // if no, try to equip it
        const target = socket.sourcePlugs.find(x => x.displayProperties.name == primaryFilterName);
        if (target) {
            return target;
        }
        // if we didn't have it, try secondary
        if (secondaryFilterName) {
            const target = socket.sourcePlugs.find(x => x.displayProperties.name == secondaryFilterName);
            // if yes, then try to equip its finder
            if (target) {
                return target;
            }
        }
    }
    return null;
}

function chooseGeneralTarget(item: InventoryItem, socket: InventorySocket, choices: ModChoices, previousChoices: ManifestInventoryItem[]): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.General) {
        return null;
    }
    // if we have remaining energy, use the best possible mod for the preferred perk
    return null;
}

function chooseSeasonTarget(item: InventoryItem, socket: InventorySocket, choices: ModChoices, previousChoices: ManifestInventoryItem[]): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.Season) {
        return null;
    }
    // if we have protective light checked, don't have it equipped yet, and are armor that can use it, apply it
    // if we have high energy fire checked, don't have it equipped yet, and are armor that can use it, apply it
    // if we have protective light checked or high energy fire checked, don't it checked yet, and can equip it, use it
    return null;
}

function chooseModTarget(item: InventoryItem, weapons: InventoryItem[], socket: InventorySocket, choices: ModChoices, previousChoices: ManifestInventoryItem[]): ManifestInventoryItem {
    if (!(isSocketInteresting(socket))) {
        return null;
    }
    const socketSlotType = getSocketSlotType(socket);
    if (socketSlotType !== SocketSlotType.Mod) {
        return null;
    }
    const primaryTargetType = choices.priorityWeapon.typeName;
    const secondaryTargetType = choices.secondaryWeapon?.typeName;
    if (item.inventoryBucket.displayProperties.name == 'Helmet') {
        if (choices.pve) {
            if (choices.priorityWeapon.ammoType == DestinyAmmunitionType.Primary) {
                if (choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary) {
                    // TODO holster?
                    return chooseWeaponPlug(socket, secondaryTargetType, secondaryTargetType, previousChoices, '', ' Ammo Finder');
                }
                return null;
            }
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Ammo Finder');
        } else {
            return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Targeting');
        }
    } else if (item.inventoryBucket.displayProperties.name == 'Gauntlets') {

        if (choices.pve) {
            if (choices.champions) {
                const available = getAvailChampionPlugs(socket);
                // champion plugs are available, do they have a weapon that can use it?
                for (const plug of available) {
                    // plug already loaded
                    if (previousChoices.find(x => x.displayProperties.name == plug.displayProperties.name)) {
                        continue;
                    }
                    for (const w of weapons) {
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
        // don't return scav on primary weapons
        if (choices.priorityWeapon.ammoType == DestinyAmmunitionType.Primary) {
            if (choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary) {
                // TODO holster?
                return chooseWeaponPlug(socket, secondaryTargetType, secondaryTargetType, previousChoices, '', ' Scavenger');
            }
            return null;
        }
        return chooseWeaponPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Scavenger');

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

async function tryToInsertMod(gearService: GearService, item: InventoryItem, socket: InventorySocket, target: ManifestInventoryItem, choices: ManifestInventoryItem[], log: string[], log$: BehaviorSubject<string[]>): Promise<boolean> {
    if (target) {
        if (item.canFit(socket, target)) {
            choices.push(target);
            console.dir(target);
            log.push(target.displayProperties.name);
            log$.next(log);
            const success = await gearService.insertFreeSocketForArmorMod(item, socket, target);
            if (!success) {
                const msg = `Failed to insert ${target.displayProperties.name} on ${item.name}`;
                log.push(msg);
                log$.next(log);
            }
            return success;
        } else {
            const msg = `No room for ${target.displayProperties.name} on ${item.name}`;
            log.push(msg);
            log$.next(log);
        }
    }
    return false;
}

export async function applyMods(gearService: GearService, notificationService: NotificationService, modChoices: ModChoices, armor: InventoryItem[], weapons: InventoryItem[], log$: BehaviorSubject<string[]>): Promise<void> {
    const log = [];
    log$.next(log);
    if (modChoices.priorityWeapon == null) {
        alert('Please select a primary weapon.');
        return;
    }
    log.push('Starting...');
    log$.next(log);
    // cycle through armor
    // 1 remove all mods
    log.push('Removing mods from armor');
    log$.next(log);
    for (const item of armor) {
        await clearModsOnItem(gearService, item, log$);
    }
    // 2 apply middle mods, if possible
    log.push('Applying weapon mods for armor');
    log$.next(log);
    for (const item of armor) {
        const choices = [];
        for (const socket of item.sockets) {
            const target = chooseModTarget(item, weapons, socket, modChoices, choices);
            await tryToInsertMod(gearService, item, socket, target, choices, log, log$);
        }
    }
    // 3 apply seasonal mods if possible
    log.push('Applying seasonal mods for armor');
    log$.next(log);
    for (const item of armor) {
        const choices = [];
        for (const socket of item.sockets) {
            const target = chooseSeasonTarget(item, socket, modChoices, choices);
            if (target) {
                choices.push(target);
                console.dir(target);
                log.push(target.displayProperties.name);
                log$.next(log);
            }
        }
    }
    // 4 apply general mods if possible
    log.push('Applying general mods for armor');
    log$.next(log);
    for (const item of armor) {
        const choices = [];
        for (const socket of item.sockets) {
            const target = chooseGeneralTarget(item, socket, modChoices, choices);
            if (target) {
                choices.push(target);
                console.dir(target);
                log.push(target.displayProperties.name);
                log$.next(log);
            }
        }
    }
    log.push('Complete!');
    log$.next(log);
    notificationService.success('Mods applied!');
}

async function clearModsOnItem(gearService: GearService, item: InventoryItem, log$: BehaviorSubject<string[]>): Promise<void> {
    for (const socket of item.sockets) {
        // is this an armor mod we can work on
        if (!(socket.isArmorMod && socket.sourcePlugs && socket.sourcePlugs.length > 0)) {
            continue;
        }
        // is it already empty?
        if (socket.active.empty) {
            continue;
        }
        // can we empty it?
        const target = socket.sourcePlugs.find(p => p.displayProperties.name.includes('Empty'));
        if (target) {
            const logMe = `Removing ${socket.active.name} from ${item.name}`;
            const log = log$.getValue();
            log.push(logMe);
            log$.next(log);
            await gearService.insertFreeSocketForArmorMod(item, socket, target);
            sleep(500);
        }
    }
}

export async function clearMods(gearService: GearService, armor: InventoryItem[], log$: BehaviorSubject<string[]>): Promise<void> {
    const log = ['Starting to clear mods...'];
    log$.next(log);
    for (const item of armor) {
        await clearModsOnItem(gearService, item, log$);
    }
    log.push('Done!');
    log$.next(log);

}
