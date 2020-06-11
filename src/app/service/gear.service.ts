import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Bucket, BucketService } from './bucket.service';
import { BungieService } from './bungie.service';
import { MarkService } from './mark.service';
import { Character, ClassAllowed, InventoryItem, ItemType, Player, SelectedUser, Target } from './model';
import { NotificationService } from './notification.service';
import { PreferredStatService } from './preferred-stat.service';
import { PandaGodrollsService } from './panda-godrolls.service';



@Injectable()
export class GearService {

    public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);

    public static sortGear(sortBy: string, sortDesc: boolean, tempGear: InventoryItem[]) {
        if (sortBy.startsWith('masterwork.') || sortBy == 'mods' || sortBy.startsWith('stat.')) {
            tempGear.sort((a: InventoryItem, b: InventoryItem): number => {
                let aV: any = '';
                let bV: any = '';
                if (sortBy.startsWith('stat.')) {
                    const hash = +sortBy.substr('stat.'.length);
                    for (const s of a.stats) {
                        if (s.hash == hash) {
                            aV = s.getValue();
                        }
                    }
                    for (const s of b.stats) {
                        if (s.hash == hash) {
                            bV = s.getValue();
                        }
                    }
                } else if (sortBy == 'masterwork.tier') {
                    aV = a.masterwork != null ? a.masterwork.tier : -1;
                    bV = b.masterwork != null ? b.masterwork.tier : -1;
                } else if (sortBy == 'masterwork.name') {
                    aV = a.masterwork != null ? a.masterwork.name : '';
                    bV = b.masterwork != null ? b.masterwork.name : '';
                } else if (sortBy == 'mods') {
                    aV = a[sortBy] != null && a[sortBy].length > 0 ? a[sortBy][0].name : '';
                    bV = b[sortBy] != null && b[sortBy].length > 0 ? b[sortBy][0].name : '';
                }

                if (aV < bV) {
                    return sortDesc ? 1 : -1;
                } else if (aV > bV) {
                    return sortDesc ? -1 : 1;
                } else {
                    if (sortBy != 'mods') {
                        aV = a[sortBy] != null ? a[sortBy].name : '';
                        bV = b[sortBy] != null ? b[sortBy].name : '';
                        if (aV < bV) {
                            return sortDesc ? 1 : -1;
                        } else if (aV > bV) {
                            return sortDesc ? -1 : 1;
                        }
                    }
                    return 0;
                }
            });
        } else {
            tempGear.sort((a: any, b: any): number => {
                try {
                    const aV = a[sortBy] != null ? a[sortBy] : '';
                    const bV = b[sortBy] != null ? b[sortBy] : '';

                    if (aV < bV) {
                        return sortDesc ? 1 : -1;
                    } else if (aV > bV) {
                        return sortDesc ? -1 : 1;
                    } else {
                        return 0;
                    }
                } catch (e) {
                    console.log('Error sorting: ' + e);
                    return 0;
                }
            });
        }
    }

    constructor(private bungieService: BungieService,
        public markService: MarkService,
        private notificationService: NotificationService,
        private bucketService: BucketService,
        private pandaService: PandaGodrollsService,
        private preferredStatService: PreferredStatService) {
    }

    public async loadGear(selectedUser: SelectedUser): Promise<Player> {
        try {
            this.loading.next(true);
            const player = await this.bungieService.getChars(selectedUser.userInfo.membershipType,
                selectedUser.userInfo.membershipId, ['Profiles', 'Characters',
                'CharacterEquipment', 'CharacterInventories', 'ItemObjectives',
                'ItemInstances', 'ItemPerks', 'ItemStats', 'ItemSockets', 'ItemPlugStates',
                'ItemTalentGrids', 'ItemCommonData', 'ProfileInventories', 'ItemReusablePlugs', 'ItemPlugObjectives'], false, true);
            const gearById: { [key: string]: InventoryItem[]; } = {};
            for (const g of player.gear) {
                this.canEquip(g);
                if (gearById[g.hash] == null) {
                    gearById[g.hash] = [];
                }
                gearById[g.hash].push(g);
            }
            this.bucketService.init(player.characters, player.vault, player.shared, player.gear);
            this.markService.processItems(player.gear);
            for (const key of Object.keys(gearById)) {
                const items = gearById[key];
                for (const item of items) {
                    item.copies = items.length;
                    let copies = null;
                    if (item.type === ItemType.Armor && item.seasonalModSlot) {
                        copies = this.findSimilarArmor(item, player, true, true);
                        item.dupesByEnergyAndSeason = copies.length;
                    }
                    if (item.type === ItemType.Weapon) {
                        copies = this.findSimilarWeaponsByFrame(item, player, true, true);
                        item.dupesByFrameSlotAndEnergy = copies.length;
                    }
                    if (copies) {
                        let taggedToKeep = 0;
                        for (const i of copies) {
                            if (i.mark == 'upgrade' || i.mark == 'keep') {
                                taggedToKeep++;
                            }
                        }
                        item.dupesTaggedToKeep = taggedToKeep;
                        if (taggedToKeep > 1) {
                            item.searchText += ' is:extratagged ';
                        }
                    }
                }
            }
            this.pandaService.processItems(player.gear);
            this.preferredStatService.processGear(player);
            return player;
        } finally {
            this.loading.next(false);
        }
    }


    public canEquip(itm: InventoryItem) {
        // ignore itm.canEquip
        if (itm.equipped.getValue() == true || (itm.owner.getValue().id == 'vault') || (itm.owner.getValue().id == 'shared')) {
            itm.canReallyEquip = false;
        } else if (itm.classAllowed === ClassAllowed.Any || ClassAllowed[itm.classAllowed] === (itm.owner.getValue() as Character).className) {
            itm.canReallyEquip = true;
        } else {
            itm.canReallyEquip = false;
        }
    }

    private async clearInvForMode(target: Target, player: Player, ignoreMark: string[], itemType: ItemType): Promise<number> {
        console.log('Clearing inventory ahead of a mode.');
        this.notificationService.info('Clearing inventory ahead of time...');
        const buckets = this.bucketService.getBuckets(target);
        let totalErr = 0;
        let moved = 0;
        let err = 0;
        for (const bucket of buckets) {
            const items = bucket.items.slice();
            for (const i of items) {
                if (i.equipped.getValue() == false && (ignoreMark.indexOf(i.mark) === -1)) {
                    if (itemType == null || i.type == itemType) {
                        if (i.type == ItemType.Weapon
                            || i.type == ItemType.Armor
                            || i.type == ItemType.Ghost
                            || i.type == ItemType.Vehicle) {
                            if (i.postmaster === true) {
                                continue;
                            }
                            try {
                                this.notificationService.info('Moving ' + i.name + ' to vault');
                                await this.transfer(player, i, player.vault);
                                moved++;
                            } catch (e) {
                                console.log('Error moving ' + i.name + ' to vault: ' + e);
                                err++;
                                totalErr++;
                            }
                        }

                    }
                }
            }
        }
        if (err == 0) {
            this.notificationService.info('Removed ' + moved + ' items from ' + target.label + ' to vault');
        } else {
            this.notificationService.info('Removed ' + moved + ' items from ' + target.label + ' to vault. ' + err + ' items failed to move.');
        }
        console.log('Done clearing inventory. ' + totalErr + ' errors.');
        return totalErr;
    }

    public async shardMode(player: Player, itemType?: ItemType) {
        const target = player.characters[0];
        const totalErr = await this.clearInvForMode(target, player, ['junk'], itemType);
        let moved = 0;
        for (const i of player.gear) {
            // might we move it?
            if (i.mark == 'junk' && i.owner.getValue().id != target.id &&
                (itemType == null || i.type == itemType)) {
                // is bucket full?
                const targetBucket = this.bucketService.getBucket(target, i.inventoryBucket);
                if (targetBucket.items.length < 10) {
                    console.log('Move ' + i.name + ' to ' + target.label + ' ' + targetBucket.desc.displayProperties.name);
                    try {
                        if (i.postmaster === true) {
                            const owner = i.owner.getValue();
                            await this.transfer(player, i, owner);
                            if (owner.id === target.characterId) {
                                moved++;
                                continue;
                            }
                        }
                        await this.transfer(player, i, target);
                        moved++;
                    } catch (e) {
                        console.log('Error on move: ' + e);
                    }
                }
            }
        }
        const msg = 'Moved ' + moved + ' items to ' + target.label;

        // re sync locks to work around bungie bug where things get locked
        // await this.processGearLocks(player);

        if (totalErr > 0) {
            this.notificationService.success('There were ' + totalErr + ' problems moving your gear. Despite that: ' + msg);
        } else if (moved == 0) {
            this.notificationService.success('Nothing left to shard!');
        } else {
            this.notificationService.success('Done! All set to start sharding! ' + msg);
        }
    }

    public findSimilarWeaponsByFrame(i: InventoryItem, player: Player, bySlot: boolean, byEnergy: boolean): InventoryItem[] {
        const copies = [i];
        for (const g of player.gear) {
            if (g.id == i.id) {
                continue;
            }
            if (i.type == ItemType.Weapon) {
                if (i.typeName != g.typeName) {
                    continue;
                }
                let iArchetype = null;
                let gArchetype = null;
                for (const s of i.sockets) {
                    if (s.socketCategoryHash == '3956125808' && s.plugs && s.plugs.length == 1) {
                        iArchetype = s.plugs[0].hash;
                        break;
                    }
                }
                for (const s of g.sockets) {
                    if (s.socketCategoryHash == '3956125808' && s.plugs && s.plugs.length == 1) {
                        gArchetype = s.plugs[0].hash;
                        break;
                    }
                }
                if (iArchetype && gArchetype && iArchetype == gArchetype) {
                    if (!bySlot || (g.inventoryBucket.displayProperties.name == i.inventoryBucket.displayProperties.name)) {
                        if (!byEnergy || (g.damageType == i.damageType)) {
                            copies.push(g);
                        }
                    }
                }
            }
        }
        return copies;
    }

    public findSimilarArmor(i: InventoryItem, player: Player, season?: boolean, seasonAndBurn?: boolean): InventoryItem[] {
        const copies = [i];
        for (const g of player.gear) {
            if (g.id == i.id) {
                continue;
            }
            if (i.type == ItemType.Armor) {
                if (i.classAllowed != g.classAllowed) {
                    continue;
                }
                if (!i.inventoryBucket || !g.inventoryBucket) {
                    continue;
                }
                if (i.inventoryBucket.displayProperties.name != g.inventoryBucket.displayProperties.name) {
                    continue;
                }
                if (i.tier != g.tier) {
                    continue;
                }
                if (seasonAndBurn) {
                    if (i.seasonalModSlot != g.seasonalModSlot) {
                        continue;
                    }
                    if (i.energyType != g.energyType) {
                        continue;
                    }
                } else if (season) {
                    if (i.seasonalModSlot != g.seasonalModSlot) {
                        continue;
                    }
                } else {
                    if (i.energyType != g.energyType) {
                        continue;
                    }
                }
                copies.push(g);
            }
        }
        return copies;
    }

    public findCopies(i: InventoryItem, player: Player): InventoryItem[] {
        const copies = [i];
        for (const g of player.gear) {
            if (g.hash === i.hash && g.id != i.id) {
                copies.push(g);
            }
        }
        return copies;
    }

    public async bulkMove(player: Player, items: InventoryItem[], target: Target) {
        console.log('Moving ' + items.length + ' items.');
        for (const i of items) {
            try {
                if (target.id !== i.owner.getValue().id) {
                    this.notificationService.info('Moving ' + i.name + ' to ' + target.label);
                    await this.transfer(player, i, target);
                }
            } catch (e) {
                // ignore
                console.log('Error moving ' + i.name + ': ' + e);
            }
        }
    }

    public async clearInv(player: Player, itemType?: ItemType) {
        const target = player.characters[0];
        const totalErr = await this.clearInvForMode(target, player, ['keep', 'upgrade', null], itemType);
        if (totalErr > 0) {
            this.notificationService.info('Inventory was cleared of all junk/infuse except for ' + totalErr + ' items that failed and were skipped.');
        } else {
            this.notificationService.success('Inventory was cleared of all junk/infuse');
        }

    }


    public async upgradeMode(player: Player, itemType?: ItemType) {
        const target = player.characters[0];
        let totalErr = await this.clearInvForMode(target, player, [], itemType);
        let moved = 0;
        for (const i of player.gear) {
            // is it marked for upgrade
            if (i.mark == 'upgrade' && (itemType == null || i.type == itemType)) {
                let copies = this.findCopies(i, player);
                copies = copies.filter(copy => copy.mark == 'infuse');
                copies = copies.filter(copy => copy.power > i.power);
                // nothing to infuse
                if (copies.length == 0) {
                    continue;
                }
                copies.push(i);
                console.dir(copies);
                copies = copies.filter(copy => (copy.owner.getValue().id != target.id) || copy.postmaster);

                console.dir(copies);
                // nothing to infuse
                if (copies.length == 0) {
                    continue;
                }

                const targetBucket = this.bucketService.getBucket(target, i.inventoryBucket);
                if ((targetBucket.items.length + copies.length) <= 10) {
                    console.log('Move ' + i.name + ' to ' + target.label + ' ' + targetBucket.desc.displayProperties.name);
                    this.notificationService.info('Prepping ' + i.name + ' for upgrade (' + copies.length + ' total)');
                    for (const moveMe of copies) {
                        console.log('    From ' + moveMe.owner.getValue().label);
                        try {
                            if (moveMe.postmaster === true) {
                                const owner = moveMe.owner.getValue();
                                await this.transfer(player, moveMe, owner);
                                if (owner.id === target.characterId) {
                                    moved++;
                                    continue;
                                }
                            }
                            if (moveMe.owner.getValue().id != target.id) {
                                await this.transfer(player, moveMe, target);
                            }
                            moved++;
                        } catch (e) {
                            console.log('Couldn\'t move ' + moveMe.name);
                            this.notificationService.fail('Unable to move ' + moveMe.name + ' from ' + moveMe.owner.getValue().label + '. Nothing else to equip?');
                            totalErr++;
                        }
                    }

                }
            }
        }
        const msg = 'Moved ' + moved + ' items to ' + target.label;

        // re sync locks to work around bungie bug where things get locked
        // await this.processGearLocks(player);

        if (totalErr > 0) {
            this.notificationService.success('There were ' + totalErr + ' problems moving your gear. Despite that: ' + msg);
        } else if (moved == 0) {
            this.notificationService.success('Nothing left to cheaply upgrade!');
        } else {
            this.notificationService.success('Done! All set to start upgrading! ' + msg);
        }
    }


    public async processGearLocks(player: Player): Promise<void> {
        const gear = player.gear;
        let lockCnt = 0;
        let unlockedCnt = 0;
        let errCnt = 0;
        for (const i of gear) {
            if (i.mark == null) { continue; }
            if (i.mark == 'upgrade' || i.mark == 'keep') {
                if (i.locked.getValue() == false) {
                    try {
                        await this.setLock(player, i, true);
                        this.notificationService.info('Locked ' + i.name + ' on ' + i.owner.getValue().label);
                        lockCnt++;
                    } catch (e) {
                        this.notificationService.info('Failed to lock ' + i.name + ' on ' + i.owner.getValue().label);
                        errCnt++;
                    }
                }
            } else if (i.mark == 'junk' || i.mark == 'infuse') {
                if (i.locked.getValue() == true) {
                    try {
                        await this.setLock(player, i, false);
                        this.notificationService.info('Unlocked ' + i.name + ' on ' + i.owner.getValue().label);
                        unlockedCnt++;
                    } catch (e) {
                        this.notificationService.info('Failed to unlock ' + i.name + ' on ' + i.owner.getValue().label);
                        errCnt++;
                    }
                }
            }
        }
        this.notificationService.info('Sync complete. Locked ' + lockCnt + ' items. Unlocked ' + unlockedCnt + ' items. ' + errCnt + ' errors.');
    }

    public async transfer(player: Player, itm: InventoryItem, target: Target): Promise<void> {
        try {
            this.loading.next(true);

            // equip something else from our bucket, if we can
            if (itm.equipped.getValue() == true) {
                let equipMe: InventoryItem = this.bucketService.getBucket(itm.owner.getValue(), itm.inventoryBucket).otherItem(itm);
                if (equipMe == null) {
                    // grab something from the vault
                    const vaultItem: InventoryItem = this.bucketService.getBucket(player.vault, itm.inventoryBucket).otherItem(itm);
                    if (vaultItem == null) {
                        throw new Error('Nothing to equip to replace ' + itm.name);
                    }
                    // transfer to source player
                    await this.transfer(player, vaultItem, itm.owner.getValue());
                    // get a reference to it now that it's on that other player
                    equipMe = this.bucketService.getBucket(itm.owner.getValue(), itm.inventoryBucket).otherItem(itm);
                    if (equipMe == null) {
                        throw new Error('2) Nothing to equip to replace ' + itm.name);
                    }
                }
                console.log(itm.name + ' was equipped. Equipping ' + equipMe.name + ' in its place.');
                const equipSuccess = await this.equip(player, equipMe);
                if (!equipSuccess) {
                    throw new Error(('Could not equip ' + equipMe.name + ' on ' + equipMe.owner.getValue().label));
                }
            }

            // if the target is the vault, we just need to put it there
            if (target.id == 'vault') {
                let owner = itm.owner.getValue();
                if (owner == player.shared) {
                    owner = player.characters[0];
                }

                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    owner, itm, true, player.vault, this.bucketService);
                itm.options.push(itm.owner.getValue());
                itm.owner.next(player.vault);
                itm.options.splice(itm.options.indexOf(itm.owner.getValue()), 1);

            } else if (itm.owner.getValue().id == 'vault' || itm.postmaster) {
                let tempTarget = target;
                if (target == player.shared) {
                    tempTarget = player.characters[0];
                }
                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    tempTarget, itm, false, player.vault, this.bucketService, itm.postmaster);
                if (itm.postmaster === true) {
                    itm.postmaster = false;
                } else {
                    itm.options.push(itm.owner.getValue());
                    itm.owner.next(target);
                    itm.options.splice(itm.options.indexOf(itm.owner.getValue()), 1);
                }

            } else {
                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    itm.owner.getValue(), itm, true, player.vault, this.bucketService);
                itm.options.push(itm.owner.getValue());
                itm.owner.next(player.vault);
                itm.options.splice(itm.options.indexOf(itm.owner.getValue()), 1);

                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    target, itm, false, player.vault, this.bucketService);
                itm.options.push(itm.owner.getValue());
                itm.owner.next(target);
                itm.options.splice(itm.options.indexOf(itm.owner.getValue()), 1);
            }

        }
        finally {
            this.canEquip(itm);
            this.loading.next(false);
        }
    }

    public async setLock(player: Player, itm: InventoryItem, locked: boolean): Promise<boolean> {
        try {
            this.loading.next(true);
            let owner;
            if (itm.owner.getValue() == player.vault || itm.owner.getValue() == player.shared) {
                owner = player.characters[0];
            } else {
                owner = itm.owner.getValue();
            }
            const success = await this.bungieService.setLock(player.profile.userInfo.membershipType, owner.id, itm, locked);
            if (success === true) {
                itm.locked.next(locked);
                return true;
            }
            return false;
        }
        finally {
            this.loading.next(false);
        }
    }

    public async equip(player: Player, itm: InventoryItem): Promise<boolean> {
        try {
            this.loading.next(true);
            const success = await this.bungieService.equip(player.profile.userInfo.membershipType, itm);
            if (success === true) {
                const bucket: Bucket = this.bucketService.getBucket(itm.owner.getValue(), itm.inventoryBucket);
                const oldEquipped = bucket.equipped;
                oldEquipped.equipped.next(false);
                bucket.equipped = itm;
                itm.equipped.next(true);
                this.canEquip(itm);
                this.canEquip(oldEquipped);
                return true;
            }
            return false;
        }
        finally {
            this.loading.next(false);
        }
    }
}
