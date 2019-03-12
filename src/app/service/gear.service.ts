import { Injectable } from '@angular/core';
import { BungieService } from './bungie.service';
import { MarkService } from './mark.service';
import { BucketService, Bucket } from './bucket.service';
import { InventoryItem, SelectedUser, Player, ClassAllowed, Character, Target, Vault } from './model';
import { WishlistService } from './wishlist.service';
import { NotificationService } from './notification.service';

@Injectable()
export class GearService {
    loading = false;

    constructor(private bungieService: BungieService,
        public markService: MarkService,
        private notificationService: NotificationService,
        private bucketService: BucketService,
        private wishlistService: WishlistService) {
    }

    public async loadGear(selectedUser: SelectedUser): Promise<Player> {
        try {
            this.loading = true;
            const player = await this.bungieService.getChars(selectedUser.userInfo.membershipType,
                selectedUser.userInfo.membershipId, ['Profiles', 'Characters',
                    'CharacterEquipment', 'CharacterInventories', 'ItemObjectives',
                    'ItemInstances', 'ItemPerks', 'ItemStats', 'ItemSockets', 'ItemPlugStates',
                    'ItemTalentGrids', 'ItemCommonData', 'ProfileInventories'], false, true);
            const gearById: { [key: string]: InventoryItem[]; } = {};
            for (const g of player.gear) {
                this.canEquip(g);
                if (gearById[g.hash] == null) {
                    gearById[g.hash] = [];
                }
                gearById[g.hash].push(g);
            }
            for (const key of Object.keys(gearById)) {
                const items = gearById[key];
                for (const item of items) {
                    item.copies = items.length;
                }
            }
            this.bucketService.init(player.characters, player.vault, player.shared, player.gear);
            this.markService.processItems(player.gear);
            this.wishlistService.processItems(player.gear);
            return player;
        } finally {
            this.loading = false;
        }
    }


    public canEquip(itm: InventoryItem) {
        //ignore itm.canEquip
        if (itm.equipped == true || (itm.owner.id == "vault") || (itm.owner.id == "shared")) {
            itm.canReallyEquip = false;
        }
        else if (itm.classAllowed === ClassAllowed.Any || ClassAllowed[itm.classAllowed] === (itm.owner as Character).className) {
            itm.canReallyEquip = true;
        }
        else {
            itm.canReallyEquip = false;
        }
        // console.log("Can Really Equip " + itm.name + " on " + itm.owner.label + ": " + itm.canReallyEquip);
    }

    private static async delay(ms: number) {
        await new Promise(resolve => setTimeout(() => resolve(), ms)).then(() => console.log("fired"));
    }

    private async clearInvForMode(target: Target, player: Player, ignoreMark: string): Promise<number> {
        console.log("Clearing inventory ahead of a mode.");
        this.notificationService.info("Clearing inventory ahead of time...");
        const buckets = this.bucketService.getBuckets(target);
        let totalErr = 0;
        let moved = 0;
        let err = 0;
        for (const bucket of buckets) {
            const items = bucket.items.slice();
            for (const i of items) {
                if (i.equipped == false && (i.mark != ignoreMark)) {
                    try {
                        this.notificationService.info("Moving " + i.name + " to vault");
                        await this.transfer(player, i, player.vault);
                        moved++;
                    }
                    catch (e) {
                        console.log("Error moving " + i.name + " to vault: " + e);
                        err++;
                        totalErr++;
                    }
                }
                else {
                    // console.log("Skipped "+i.name +" "+i.equipped+" "+i.mark);
                }
            }
        }
        if (err == 0)
            this.notificationService.info("Removed " + moved + " items from " + target.label + " to vault");
        else
            this.notificationService.info("Removed " + moved + " items from " + target.label + " to vault. " + err + " items failed to move.");
        console.log("Done clearing inventory. " + totalErr + " errors.");
        return totalErr;
    }

    public async shardMode(player: Player) {
        const target = player.characters[0];
        const totalErr = await this.clearInvForMode(target, player, "junk");
        let moved = 0;
        let storeErr = 0;
        for (const i of player.gear) {
            //might we move it?
            if (i.mark == "junk" && i.owner.id != target.id) {
                //is bucket full?
                const targetBucket = this.bucketService.getBucket(target, i.inventoryBucket);
                if (targetBucket.items.length < 10) {
                    console.log("Move " + i.name + " to " + target.label + " " + targetBucket.name);
                    try {
                        await this.transfer(player, i, target);
                        moved++;
                    }
                    catch (e) {
                        storeErr++;
                    }
                }
            }
        }
        const msg = "Moved " + moved + " items to " + target.label;

        // re sync locks to work around bungie bug where things get locked
        await this.processGearLocks(player);

        if (totalErr>0){
            this.notificationService.success("There were "+totalErr+" problems moving your gear. Despite that: "+msg);
        }
        else if (moved==0){
            this.notificationService.success("Nothing left to shard!");
        }
        else{
            this.notificationService.success("Done! All set to start sharding! "+msg);
        }
    }

    public findCopies(i: InventoryItem, player: Player): InventoryItem[] {
        const copies = [i];
        for (const g of player.gear) {
            if (g.hash === i.hash && g.id != i.id) {
                copies.push(g);
            }
        }
        copies.sort(function (a, b) {
            if (a.power < b.power)
                return 1;
            if (a.power > b.power)
                return -1;
            return 0;
        });
        return copies;
    }

    public async upgradeMode(player: Player) {
        const target = player.characters[0];
        let totalErr = await this.clearInvForMode(target, player, "xxx");
        let moved = 0;
        for (const i of player.gear) {
            //is it marked for upgrade
            if (i.mark == "upgrade") {
                let copies = this.findCopies(i, player);
                copies = copies.filter(copy => copy.mark == "infuse");
                copies = copies.filter(copy => copy.power > i.power);
                //nothing to infuse
                if (copies.length == 0) {
                    continue;
                }
                copies.push(i);

                copies = copies.filter(copy => copy.owner.id != target.id);
                //nothing to infuse
                if (copies.length == 0) {
                    continue;
                }

                const targetBucket = this.bucketService.getBucket(target, i.inventoryBucket);
                if ((targetBucket.items.length + copies.length) <= 10) {
                    console.log("Move " + i.name + " to " + target.label + " " + targetBucket.name);
                    this.notificationService.info("Prepping " + i.name + " for upgrade (" + copies.length + " total)");
                    for (const moveMe of copies) {
                        console.log("    From " + moveMe.owner.label);
                        try {
                            await this.transfer(player, moveMe, target);
                            moved++;
                        }
                        catch (e) {
                            console.log("Couldn't move " + moveMe.name);
                            this.notificationService.fail("Unable to move " + moveMe.name + " from " + moveMe.owner.label + ". Nothing else to equip?");
                            totalErr++;
                        }
                    }

                }
            }
        }
        const msg = "Moved " + moved + " items to " + target.label;

        // re sync locks to work around bungie bug where things get locked
        await this.processGearLocks(player);

        if (totalErr>0){
            this.notificationService.success("There were "+totalErr+" problems moving your gear. Despite that: "+msg);
        }
        else if (moved==0){
            this.notificationService.success("Nothing left to cheaply upgrade!");
        }
        else{
            this.notificationService.success("Done! All set to start upgrading! "+msg);
        }
    }


    public async processGearLocks(player: Player): Promise<void> {
        const gear = player.gear;
        let lockCnt = 0;
        let unlockedCnt = 0;
        let errCnt = 0;
        for (const i of gear) {
            if (i.mark == null) continue;
            if (i.mark == "upgrade" || i.mark == "keep") {
                if (i.locked == false) {
                    try {
                        await this.setLock(player, i, true);
                        this.notificationService.info('Locked ' + i.name + ' on ' + i.owner.label);
                        lockCnt++;
                    }
                    catch (e) {
                        this.notificationService.info('Failed to lock ' + i.name + ' on ' + i.owner.label);
                        errCnt++;
                    }
                }
            }
            else if (i.mark == "junk" || i.mark == "infuse") {
                if (i.locked == true) {
                    try {
                        await this.setLock(player, i, false);
                        this.notificationService.info('Unlocked ' + i.name + ' on ' + i.owner.label);
                        unlockedCnt++;
                    }
                    catch (e) {
                        this.notificationService.info('Failed to unlock ' + i.name + ' on ' + i.owner.label);
                        errCnt++;
                    }
                }
            }
        }
        this.notificationService.info('Sync complete. Locked ' + lockCnt + ' items. Unlocked ' + unlockedCnt + ' items. ' + errCnt + ' errors.');
    }

    public async transfer(player: Player, itm: InventoryItem, target: Target): Promise<void> {
        try {
            this.loading = true;

            //equip something else from our bucket, if we can
            if (itm.equipped == true) {
                let equipMe: InventoryItem = this.bucketService.getBucket(itm.owner, itm.inventoryBucket).otherItem(itm);
                if (equipMe == null) {
                    // grab something from the vault
                    const vaultItem: InventoryItem = this.bucketService.getBucket(player.vault, itm.inventoryBucket).otherItem(itm);
                    if (vaultItem == null) {
                        throw new Error("Nothing to equip to replace " + itm.name);
                    }
                    // transfer to source player
                    await this.transfer(player, vaultItem, itm.owner);
                    // get a reference to it now that it's on that other player
                    equipMe = this.bucketService.getBucket(itm.owner, itm.inventoryBucket).otherItem(itm);
                    if (equipMe == null) {
                        throw new Error("2) Nothing to equip to replace " + itm.name);
                    }
                }
                console.log(itm.name + " was equipped. Equipping " + equipMe.name + " in its place.");
                const equipSuccess = await this.equip(player, equipMe);
                if (!equipSuccess) {
                    throw ("Could not equip " + equipMe.name + " on " + equipMe.owner.label);
                }
            }

            //if the target is the vault, we just need to put it there
            if (target.id == "vault") {
                let owner = itm.owner;
                if (owner == player.shared) {
                    owner = player.characters[0];
                }

                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    owner, itm, true, player.vault, this.bucketService);
                itm.options.push(itm.owner);
                itm.owner = player.vault;
                itm.options.splice(itm.options.indexOf(itm.owner), 1);

            }
            //if it's in the vault, we just need to pull it out to our char
            else if (itm.owner.id == "vault") {
                let tempTarget = target;
                if (target == player.shared) {
                    tempTarget = player.characters[0];
                }
                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    tempTarget, itm, false, player.vault, this.bucketService);
                itm.options.push(itm.owner);
                itm.owner = target;
                itm.options.splice(itm.options.indexOf(itm.owner), 1);

            }
            //otherwise we need to put it in vault, then pull it again
            else {
                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    itm.owner, itm, true, player.vault, this.bucketService);
                itm.options.push(itm.owner);
                itm.owner = player.vault;
                itm.options.splice(itm.options.indexOf(itm.owner), 1);

                await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    target, itm, false, player.vault, this.bucketService);
                itm.options.push(itm.owner);
                itm.owner = target;
                itm.options.splice(itm.options.indexOf(itm.owner), 1);
            }

        }
        finally {
            this.canEquip(itm);
            this.loading = false;
        }
    }

    public async setLock(player: Player, itm: InventoryItem, locked: boolean): Promise<boolean> {
        try {
            this.loading = true;
            let owner;
            if (itm.owner == player.vault || itm.owner == player.shared) {
                owner = player.characters[0];
            }
            else {
                owner = itm.owner;
            }
            const success = await this.bungieService.setLock(player.profile.userInfo.membershipType, owner.id, itm, locked);
            if (success === true) {
                itm.locked = locked;
                return true;
            }
            return false;
        }
        finally {
            this.loading = false;
        }
    }

    public async equip(player: Player, itm: InventoryItem): Promise<boolean> {
        try {
            this.loading = true;
            const success = await this.bungieService.equip(player.profile.userInfo.membershipType, itm);
            if (success === true) {
                const bucket: Bucket = this.bucketService.getBucket(itm.owner, itm.inventoryBucket);
                const oldEquipped = bucket.equipped;
                oldEquipped.equipped = false;
                itm.equipped = true;
                bucket.equipped = itm;
                itm.equipped = true;

                this.canEquip(itm);
                this.canEquip(oldEquipped);
                return true;
            }
            return false;
        }
        finally {
            this.loading = false;
        }
    }


}