import { Injectable } from '@angular/core';
import { ClassAllowed, InventoryItem, Target, ApiInventoryBucket, ItemType } from './model';
import { ArmorPerksDialogComponent } from '@app/gear/gear/armor-perks-dialog/armor-perks-dialog.component';

export class Pile {
    highest: InventoryItem[] = [];
    readonly items: InventoryItem[] = [];
    readonly desc: ApiInventoryBucket;

    constructor(desc: ApiInventoryBucket) {
        this.desc = desc;
    }
}


export class ArmorPile extends Pile  {
    readonly classAllowed: ClassAllowed;

    constructor(classAllowed: ClassAllowed, desc: ApiInventoryBucket) {
        super(desc);
    }
}

export class Bucket {
    equipped: InventoryItem;
    readonly items: InventoryItem[] = [];
    readonly desc: ApiInventoryBucket;

    constructor(desc: ApiInventoryBucket) {
        this.desc = desc;
    }

    remove(item: InventoryItem): boolean {
        const index = this.items.indexOf(item);
        if (index == -1) { return false; }
        this.items.splice(index, 1);
        return true;
    }

    otherItem(notMe: InventoryItem): InventoryItem {
        for (let cntr = 0; cntr < this.items.length; cntr++) {
            if (this.items[cntr] != notMe) {
                if (this.items[cntr].tier != 'Exotic') {
                    return this.items[cntr];
                }
            }
        }
        return null;
    }
}

@Injectable()
export class BucketService {
    // owner id -> bucket hash -> item[]
    private buckets:  { [key: string]: { [key: string]: Bucket } };

    // these are global groups across bucket type for weapons and armor
    // key is bucket hash
    private weaponPiles: {[key: string]: Pile};
    // key is classallowed + bucketHash
    private armorPiles: {[key: string]: ArmorPile};

    constructor() {
    }

    getBucket(target: Target, desc: ApiInventoryBucket): Bucket {
        let returnMe = this.buckets[target.id][desc.hash];
        if (returnMe == null) {
            console.log('No bucket found for ' + target.label + '|' + desc.displayProperties.name + ', using shared');
            returnMe = this.buckets['shared'][desc.hash];
        }
        // if our bucket is truly empty b/c we hvae a classified weapon equipped, we need to make it on the fly
        if (returnMe == null) {
            this.buckets[target.id][desc.hash] = new Bucket(desc);
            returnMe = this.buckets[target.id][desc.hash];
        }
        return returnMe;
    }

    public getBuckets(target: Target): Bucket[] {
        const aBuckets = [];
        for (const key of Object.keys(this.buckets[target.id])) {
            aBuckets.push(this.buckets[target.id][key]);
        }
        return aBuckets;
    }

    init(chars: Target[], vault: Target, shared: Target, items: InventoryItem[]) {
        this.buckets = {};
        for (let cntr = 0; cntr < chars.length; cntr++) {
            this.buckets[chars[cntr].id] = {};
        }
        this.buckets[vault.id] = {};
        this.buckets[shared.id] = {};

        for (let cntr = 0; cntr < items.length; cntr++) {
            const itm = items[cntr];
            if (!itm.inventoryBucket || !itm.owner.getValue()) { continue; }
            const buckets: any = this.buckets[itm.owner.getValue().id];
            let bucket: Bucket = buckets[itm.inventoryBucket.hash];
            if (bucket == null) {
                bucket = new Bucket(itm.inventoryBucket);
                buckets[itm.inventoryBucket.hash] = bucket;
            }
            bucket.items.push(itm);
            if (itm.equipped.getValue()) {
                bucket.equipped = itm;
            }
            if (itm.type == ItemType.Weapon || itm.type == ItemType.Armor) {
                // TODO parse as weapon or armor
            } 
        }
    }

    markHighest() {
        // buckets 0-2 are weapons and don't care about class
        // buckets 3-7 are armor and need to be grouped by class
        const weaponBuckets: Bucket[] = [];
        const armorBuckets: Bucket[] = [];
        for (const key of Object.keys(this.buckets)) {
            const buckets = this.buckets[key];
            for (const key2 of Object.keys(buckets)) {
                const bucket = buckets[key2];
                if (bucket.desc.index <= 2) {
                    weaponBuckets.push(bucket);
                } else if (bucket.desc.index <= 7) {
                    armorBuckets.push(bucket);
                }
            }

        }
    }


}
