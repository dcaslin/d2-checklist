import { Injectable } from '@angular/core';
import { ApiInventoryBucket, BUCKET_ID_SHARED, ClassAllowed, InventoryItem, ItemType, Target } from './model';

export class Pile {
    highest: InventoryItem[] = [];
    readonly classAllowed: ClassAllowed;
    readonly items: InventoryItem[] = [];
    readonly desc: ApiInventoryBucket;

    constructor(classAllowed: ClassAllowed, desc: ApiInventoryBucket) {
        this.classAllowed = classAllowed;
        this.desc = desc;
    }

    markHighest() {

        // items are sorted by PL

        for (const itm of this.items) {
            if (itm.power < this.items[0].power) {
                return;
            }
            itm.searchText += 'is:highest ';
            itm.isHighest = true;
        }
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
    // key is classallowed + bucketHash
    private piles: {[key: string]: Pile};

    getBucket(target: Target, desc: ApiInventoryBucket): Bucket {
        let returnMe = this.buckets[target.id][desc.hash];
        if (returnMe == null) {
            console.log('No bucket found for ' + target.label + '|' + desc.displayProperties.name + ', using shared');
            returnMe = this.buckets[BUCKET_ID_SHARED][desc.hash];
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
        this.piles = {};

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
            // ignore rare weapons with specific class requirements
            if ((itm.type == ItemType.Weapon && itm.classAllowed == ClassAllowed.Any ) || itm.type == ItemType.Armor) {
                const key = itm.classAllowed + itm.inventoryBucket.hash;
                if (!this.piles[key]) {
                    this.piles[key] = new Pile(itm.classAllowed, itm.inventoryBucket);
                }
                this.piles[key].items.push(itm);
            }
        }
        for (const key of Object.keys(this.piles)) {
            const pile = this.piles[key];
            pile.items.sort((a, b) => {
                return a.power > b.power ? -1 : a.power < b.power ? 1 : 0;
            });
            pile.markHighest();
        }
    }
}
