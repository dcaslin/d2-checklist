import fs from 'fs';
import path from 'path';
import { CacheLite, DestinyCache } from './common';
import { PROJECT_ROOT } from './config';

const SHARD_COUNT = 8;
const SHARDED_TABLES = ['InventoryItem'];
const ASSETS_DIR = path.join(PROJECT_ROOT, 'src/assets');

export function buildCacheLite(cache: DestinyCache): CacheLite {
    return {
        Class: cache.Class!,
        Gender: cache.Gender,
        InventoryBucket: cache.InventoryBucket,
        ItemTierType: cache.ItemTierType,
        PowerCap: cache.PowerCap,
        Race: cache.Race!,
        Stat: cache.Stat!,
        destiny2CoreSettings: cache.destiny2CoreSettings!,
        version: cache.version
    };
}

// Splits an object's keys round-robin across `count` shards.
// d2-checklist reassembles them with Object.assign(...shards).
export function shardObject(obj: { [key: string]: any }, count: number): { [key: string]: any }[] {
    const shards: { [key: string]: any }[] = Array.from({ length: count }, () => ({}));
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        shards[i % count][keys[i]] = obj[keys[i]];
    }
    return shards;
}

export async function save(cache: DestinyCache) {
    for (const key of Object.keys(cache)) {
        if (key === 'version') continue;

        const value = (cache as any)[key];

        if (SHARDED_TABLES.includes(key)) {
            const shards = shardObject(value, SHARD_COUNT);
            for (let i = 0; i < shards.length; i++) {
                const filename = `destiny2-${key.toLowerCase()}-${i}.json`;
                console.log(filename);
                await fs.promises.writeFile(path.join(ASSETS_DIR, filename), JSON.stringify(shards[i]));
            }
        } else {
            const filename = `destiny2-${key.toLowerCase()}.json`;
            console.log(filename);
            await fs.promises.writeFile(path.join(ASSETS_DIR, filename), JSON.stringify(value));
        }
    }

    const cacheLite = buildCacheLite(cache);
    const jsonLite = JSON.stringify(cacheLite);
    await fs.promises.writeFile(path.join(ASSETS_DIR, 'destiny2-cache-lite.json'), jsonLite);
    console.log('destiny2-cache-lite.json');

    await fs.promises.writeFile(path.join(ASSETS_DIR, 'destiny2-version.json'), JSON.stringify(cache.version));
    console.log('destiny2-version.json');
}
