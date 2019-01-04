import { Injectable, OnDestroy } from '@angular/core';
import { InventoryItem, Character, Target } from './model';

@Injectable()
export class BucketService {
    constructor() {
    }


    private buckets: any;

    getBucket(target: Target, bucketName: string): Bucket {
        return this.buckets[target.id][bucketName];
    }

    public getBuckets(target: Target): Bucket[]{
        const aBuckets = [];
        for (const key in this.buckets[target.id]){
            aBuckets.push(this.buckets[target.id][key]);;
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
            if (!itm.inventoryBucket || !itm.owner) continue;
            let buckets: any = this.buckets[itm.owner.id];
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


export class Bucket {
    equipped: InventoryItem;

    readonly items: InventoryItem[] = [];
    readonly name: string;

    constructor(name: string) {
        this.name = name;
    }

    remove(item: InventoryItem): boolean{
        let index = this.items.indexOf(item);
        if (index==-1) return false;
        this.items.splice(index, 1);
        return true;
    }

    otherItem(notMe: InventoryItem): InventoryItem {
        for (let cntr = 0; cntr < this.items.length; cntr++) {
            if (this.items[cntr] != notMe) {
                if (this.items[cntr].tier != "Exotic")
                    return this.items[cntr];
            }
        }
        return null;
    }

}