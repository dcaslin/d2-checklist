import { Injectable } from '@angular/core';
import { BungieService } from './bungie.service';
import { MarkService } from './mark.service';
import { BucketService, Bucket } from './bucket.service';
import { InventoryItem, SelectedUser, Player, ClassAllowed, Character, Target, Vault } from './model';

@Injectable()
export class GearService {
    loading = false;

    constructor(private bungieService: BungieService,
        public markService: MarkService, private bucketService: BucketService) {
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
                if (gearById[g.hash]==null){
                    gearById[g.hash] = [];
                }
                gearById[g.hash].push(g);
            }
            for (const key of Object.keys(gearById)) {
                const items = gearById[key];
                for (const item of items){
                    item.copies = items.length;
                }
            }

            this.bucketService.init(player.characters, player.vault, player.shared, player.gear);
            this.markService.processItems(player.gear);
            return player;
        } finally {
            this.loading = false;
        }
    }

    public canEquip(itm: InventoryItem) {
        //ignore itm.canEquip
        if (itm.equipped == true || !(itm.owner instanceof Character)){ 
            itm.canReallyEquip = false;
        }
        else if (itm.classAllowed === ClassAllowed.Any || ClassAllowed[itm.classAllowed] === (itm.owner as Character).className){
            itm.canReallyEquip = true;
        }
        else{
            itm.canReallyEquip = false;   
        }
    }

    public async transfer(player: Player, itm: InventoryItem, target: Target): Promise<boolean> {
        try {
            this.loading = true;
            //equip something else from our bucket, if we can
            if (itm.equipped) {
                let equipMe: InventoryItem = this.bucketService.getBucket(itm.owner, itm.inventoryBucket).otherItem(itm);
                if (equipMe == null) {
                    throw new Error("Nothing to equip to replace " + itm.name);
                }
                const equipSuccess = this.equip(player, equipMe);
                if (!equipSuccess) {
                    return false;
                }
            }
            //if the target is the vault, we just need to put it there
            let success;
            if (target instanceof Vault) {
                
                success = await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    itm.owner, itm, true);
                if (success) {
                    itm.options.push(itm.owner);
                    itm.owner = player.vault;
                    itm.options.splice(itm.options.indexOf(itm.owner), 1);
                }
            }
            //if it's in the vault, we just need to pull it out to our char
            else if (itm.owner instanceof Vault) {
                success = await this.bungieService.transfer(player.profile.userInfo.membershipType,
                    target, itm, false);
                if (success) {
                    itm.options.push(itm.owner);
                    itm.owner = target;
                    itm.options.splice(itm.options.indexOf(itm.owner), 1);
                }
            }
            //otherwise we need to put it in vault, then pull it again
            else {
                success = await this.bungieService.transfer(player.profile.userInfo.membershipType, itm.owner, itm, true);
                if (success) {
                    itm.options.push(itm.owner);
                    itm.owner = player.vault;
                    itm.options.splice(itm.options.indexOf(itm.owner), 1);
                }
                success = await this.bungieService.transfer(player.profile.userInfo.membershipType, target, itm, false);
                if (success) {
                    itm.options.push(itm.owner);
                    itm.owner = target;
                    itm.options.splice(itm.options.indexOf(itm.owner), 1);
                }
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
            const success = await this.bungieService.setLock(player.profile.userInfo.membershipType, itm, locked);
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