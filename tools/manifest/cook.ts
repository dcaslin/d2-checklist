import { Sqlite3Promise } from './sqlite3-promisify';
import { cookChecklists } from './post-process/checklists';
import { DestinyCache } from './common';

const GLOBAL_REMOVE = [
    'acquireRewardSiteHash', 'acquireUnlockHash', 'action', 'allowActions', 'backgroundColor',
    'translationBlock', 'itemList', 'interactions',
    'summaryItemHash', 'uiItemDisplayStyle', 'specialItemType', 'nonTransferrable',
    'screenshot', 'preview', 'talentGrid', 'doesPostmasterPullHaveSideEffects', 'defaultDamageType',
    'sourceData'
];

const DB_TABLES: TableConfig[] = [
    { table: 'DestinyVendorDefinition', label: 'Vendor', remove: [
        'groups', 'ignoreSaleItemHashes', 'interactions', 'inventoryFlyouts', 'itemList',
        'locations', 'originalCategories', 'services', 'acceptedItems', 'actions', 'blacklisted',
        'categories', 'consolidateCategories', '\uFEFFdisplayCategories', 'displayItemHash',
        'BungieNet.Engine.Contract.Destiny.World.Definitions.IDestinyDisplayDefinition.displayProperties'
    ]},
    { table: 'DestinyRaceDefinition', label: 'Race' },
    { table: 'DestinyGenderDefinition', label: 'Gender' },
    { table: 'DestinyClassDefinition', label: 'Class' },
    { table: 'DestinyActivityDefinition', label: 'Activity' },
    { table: 'DestinyActivityTypeDefinition', label: 'ActivityType' },
    { table: 'DestinyActivityModeDefinition', label: 'ActivityMode' },
    { table: 'DestinyMilestoneDefinition', label: 'Milestone' },
    { table: 'DestinyFactionDefinition', label: 'Faction' },
    { table: 'DestinyProgressionDefinition', label: 'Progression' },
    { table: 'DestinyInventoryItemDefinition', label: 'InventoryItem', remove: [
        'sack', 'traitIds', 'flavorText', 'secondaryIcon', 'metrics', 'crafting',
        'tooltipNotifications', 'iconWatermarkShelved', 'iconWatermarkFeatured',
    ]},
    { table: 'DestinyStatDefinition', label: 'Stat' },
    { table: 'DestinyObjectiveDefinition', label: 'Objective' },
    { table: 'DestinyActivityModifierDefinition', label: 'ActivityModifier' },
    { table: 'DestinySandboxPerkDefinition', label: 'Perk' },
    { table: 'DestinySocketTypeDefinition', label: 'SocketType' },
    { table: 'DestinyPlugSetDefinition', label: 'PlugSet' },
    { table: 'DestinySocketCategoryDefinition', label: 'SocketCategory' },
    { table: 'DestinyPowerCapDefinition', label: 'PowerCap' },
    { table: 'DestinyChecklistDefinition', label: 'Checklist' },
    { table: 'DestinyInventoryBucketDefinition', label: 'InventoryBucket' },
    { table: 'DestinyPresentationNodeDefinition', label: 'PresentationNode' },
    { table: 'DestinyRecordDefinition', label: 'Record' },
    { table: 'DestinyCollectibleDefinition', label: 'Collectible' },
    { table: 'DestinyItemTierTypeDefinition', label: 'ItemTierType' },
    { table: 'DestinyHistoricalStatsDefinition', label: 'HistoricalStats', useKeyInsteadOfId: true },
    { table: 'DestinySeasonDefinition', label: 'Season' },
    { table: 'DestinySeasonPassDefinition', label: 'SeasonPass' },
];

export async function generateJsonFromDb(dbPath: string, version: string): Promise<DestinyCache> {
    const db = await Sqlite3Promise.open(dbPath);

    const cache: DestinyCache = { version };
    readRows(db, cache);
    db.close();
    cookChecklists(cache);
    return cache;
}

function readRows(db: Sqlite3Promise, cache: any) {
    for (const config of DB_TABLES) {
        saveDBRows(db, cache, config);
    }
}

export function saveDBRows(db: Sqlite3Promise, cache: any, config: TableConfig): Summary {
    const { table: tableName, label, remove = [], useKeyInsteadOfId } = config;
    cache[label] = {};
    const idCol = useKeyInsteadOfId ? 'key' : 'id';
    const sql = `SELECT ${idCol}, json FROM ${tableName}`;
    const rows = db.all(sql);

    for (const row of rows) {
        const jo = JSON.parse(row.json);
        const id = useKeyInsteadOfId ? jo.statId : jo.hash;
        if (id == null) throw new Error('No id found for ' + row.json);

        // Extract custom properties before removing fields
        if (jo.sourceData?.vendorSources != null) {
            const vHashes = jo.sourceData.vendorSources.map((v: any) => v.vendorHash);
            if (vHashes.length > 0) {
                jo.customVendorSourceHashes = vHashes;
            }
        }

        for (const x of GLOBAL_REMOVE) {
            delete jo[x];
        }
        for (const x of remove) {
            delete jo[x];
        }
        cache[label][id] = jo;
    }

    return { name: tableName, rows: rows.length, jsonSize: JSON.stringify(cache[label]).length };
}

export interface TableConfig {
    table: string;
    label: string;
    remove?: string[];
    useKeyInsteadOfId?: boolean;
}

interface Summary {
    name: string;
    rows: number;
    jsonSize: number;
}
