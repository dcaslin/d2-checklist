import { ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { DestinyAmmunitionType, InventoryItem, InventorySocket } from '@app/service/model';
import { sleep } from '@app/shared/utilities';
import { BehaviorSubject } from 'rxjs';

export interface ModChoices {
    pve: boolean;
    priorityWeapon: InventoryItem;
    secondaryWeapon: InventoryItem;
    champions: boolean;
    protectiveLight: boolean;
    highEnergyFire: boolean;
}

function cookTargetType(targetType: string): string {
    if (targetType == null) {
        return null;
    }
    if (targetType.startsWith('Linear ')) {

    }
}


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

function chooseTargetPlug(socket: InventorySocket, primaryTargetType: string, secondaryTargetType: string, previousChoices: ManifestInventoryItem[], prefix: string, suffix: string): ManifestInventoryItem {
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

function chooseTarget(item: InventoryItem, socket: InventorySocket,  choices: ModChoices, previousChoices: ManifestInventoryItem[]): ManifestInventoryItem {
    const socketSlotType = getSocketSlotType(socket);

    // item specific mod slots are where we start to care about weapons and such
    if (socketSlotType == SocketSlotType.General) {
        // TODO handle
    }
     if (socketSlotType == SocketSlotType.Season) {
         // TODO handle
     }
    if (socketSlotType == SocketSlotType.Mod) {

        const primaryTargetType = choices.priorityWeapon.typeName;
        const secondaryTargetType = choices.secondaryWeapon?.typeName;

        if (item.inventoryBucket.displayProperties.name == 'Helmet') {
            if (choices.pve) {
                if (choices.priorityWeapon.ammoType == DestinyAmmunitionType.Primary) {
                    if (choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary) {
                        // TODO holster?
                        return chooseTargetPlug(socket, secondaryTargetType, secondaryTargetType, previousChoices, '', ' Ammo Finder');
                    }
                    return null;
                }
                return chooseTargetPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Ammo Finder');
            } else {
                return chooseTargetPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Targeting');
            }
        } else if (item.inventoryBucket.displayProperties.name == 'Gauntlets') {

            if (choices.pve) {
                // TODO worry about champion mods
                return chooseTargetPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Loader');
            } else {
                return chooseTargetPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Dexterity');
            }

        } else if (item.inventoryBucket.displayProperties.name == 'Chest Armor') {
            if (choices.pve) {
                // Concussive Dampener
                // Melee Damage Resistance
                // Sniper Damage Resistance

            } else {
                return chooseTargetPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, 'Unflinching ', ' Aim');
            }
        } else if (item.inventoryBucket.displayProperties.name == 'Leg Armor') {
            // don't return scav on primary weapons
            if (choices.priorityWeapon.ammoType == DestinyAmmunitionType.Primary) {
                if (choices.secondaryWeapon?.ammoType !== DestinyAmmunitionType.Primary) {
                    // TODO holster?
                    return chooseTargetPlug(socket, secondaryTargetType, secondaryTargetType, previousChoices, '', ' Scavenger');
                }
                return null;
            }
            return chooseTargetPlug(socket, primaryTargetType, secondaryTargetType, previousChoices, '', ' Scavenger');

        } else if (item.inventoryBucket.displayProperties.name == 'Class Armor') {
            // if pve and they have a fusion and they have particle deconstruction, use it
            return null;
        }
    }
    return null;
}

export function applyMods(gearService: GearService, modChoices: ModChoices, armor: InventoryItem[], log$: BehaviorSubject<string[]>): void {
    const log = [];
    log$.next(log);
    if (modChoices.priorityWeapon == null) {
        alert('Please select a primary weapon.');
        return;
    }
    for (const item of armor) {

        clearModsOnItem(gearService, item, log$);
        const choices = [];
        for (const socket of item.sockets) {
            if (!(socket.isArmorMod && socket.sourcePlugs && socket.sourcePlugs.length > 0)) {
                continue;
            }
            const target = chooseTarget(item, socket, modChoices, choices);
            if (target) {
                choices.push(target);
                console.dir(target);
                log.push(target.displayProperties.name);
                log$.next(log);
            }
        }
    }

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
        clearModsOnItem(gearService, item, log$);
    }
    log.push('Done!');
    log$.next(log);

}
