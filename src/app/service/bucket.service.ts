import { Injectable, OnDestroy } from '@angular/core';
import { InventoryItem, Character, Target } from './model';

export class Bucket {
    equipped: InventoryItem;

    readonly items: InventoryItem[] = [];
    readonly name: string;

    constructor(name: string) {
        this.name = name;
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


    private buckets: any;
    constructor() {
    }

    getBucket(target: Target, bucketName: string): Bucket {
        const returnMe = this.buckets[target.id][bucketName];
        if (returnMe == null) {
            console.log('No bucket found for ' + target.label + '|' + bucketName + ', using shared');
            return this.buckets['shared'][bucketName];
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
            if (!itm.inventoryBucket || !itm.owner) { continue; }
            const buckets: any = this.buckets[itm.owner.id];
            let bucket: Bucket = buckets[itm.inventoryBucket];
            if (bucket == null) {
                bucket = new Bucket(itm.inventoryBucket);
                buckets[itm.inventoryBucket] = bucket;
            }
            bucket.items.push(itm);
            if (itm.equipped) {
                bucket.equipped = itm;
            }
        }
    }


}
