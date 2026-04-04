import { DestinyCache } from '../common';
import checklistData from '../checklist-data.json';

interface ChecklistEntry {
    hash: number;
    displayProperties: { description: string; name: string; hasIcon: boolean; icon?: string };
    scope: number;
    destinationHash?: number;
    locationHash?: number;
    bubbleHash?: number;
    activityHash?: number;
}

interface Checklist {
    displayProperties: { description: string; name: string; hasIcon: boolean };
    viewActionString: string;
    scope: number;
    entries: ChecklistEntry[];
    hash: number;
    index: number;
    blacklisted: boolean;
    video?: string;
}

function updateClEntry(cl: Checklist, hash: string, name: string, video?: string) {
    if (cl == null) {
        throw new Error(`Missing cl for ${hash} ${name}`);
    }
    if (cl.entries == null) {
        throw new Error(`Missing cl.entries for ${hash} ${name}`);
    }
    const entry = cl.entries.find(x => x.hash == Number(hash));
    if (entry == null) {
        throw new Error(`Missing entry for ${hash} ${name}`);
    }
    entry.displayProperties.name = name;
    (entry as any).video = video;
}

export function cookChecklists(cache: DestinyCache) {
    cache.Checklist[1297424116] = checklistData.AHAMKARA_BONES;
    cache.Checklist[2609997025] = checklistData.CORRUPTED_EGGS;
    cache.Checklist[2726513366] = checklistData.CATS;
    cache.Checklist[1912364094] = checklistData.RABBITS;

    // penguins
    if (cache.Checklist[817948795]?.entries) {
        const cl = cache.Checklist[817948795];
        updateClEntry(cl, '1629596387', '#1 Cadmus Ridge', 'https://youtu.be/wsogtpKMsxQ');
        updateClEntry(cl, '271815222', '#2 Well of infinitude', 'https://www.youtube.com/watch?v=UDvDF7KrSnA');
        updateClEntry(cl, '3880966469', '#3 Eventide Ruins', 'https://www.youtube.com/watch?v=Iuwx4HTQrv4');
        updateClEntry(cl, '3420140384', '#4 Bray Exoscience', 'https://www.youtube.com/watch?v=xnQjYlN_hf4');
        updateClEntry(cl, '3890313479', '#5 Asterion Abyss', 'https://www.youtube.com/watch?v=BNGMoCwsRoY');
        updateClEntry(cl, '290570570', '#6 Riis-Reborn', 'https://www.youtube.com/watch?v=ZCn2Ge2P7wk');
        updateClEntry(cl, '3254863625', '#7 Nexus', 'https://www.youtube.com/watch?v=2z1SUCBjnoI');
        updateClEntry(cl, '1313979588', '#8 Kell\'s Rising', 'https://www.youtube.com/watch?v=L0FPZORkzaM');
        updateClEntry(cl, '1610085355', '#9 Eternity', 'https://www.youtube.com/watch?v=p-tlrW96Y0M');
        cl.index = -1;
    }

    // entropic shards
    if (cache.Checklist[1885088224]?.entries) {
        const cl = cache.Checklist[1885088224];
        cl.video = 'https://www.youtube.com/watch?v=qR7_yCjMw6w';
        updateClEntry(cl, '2679813844', '#1 Eventide Ruins, Bunker E15 LS', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=94s');
        updateClEntry(cl, '3482887819', '#2 Eventide Ruins, Wreckage', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=74s');
        updateClEntry(cl, '1146417010', '#3 Creation', 'https://www.youtube.com/watch?v=IymmxdNJOqE');
        updateClEntry(cl, '3527611025', '#4 RIIS Reborn Approach', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=150s');
        updateClEntry(cl, '951414128', '#5 Kell\'s Rising', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=275s');
        updateClEntry(cl, '1217064983', '#6 Technocrat\'s Iron', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=464s');
        updateClEntry(cl, '2677830030', '#7 Asterion Abyss, Glassway Strike Start', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=0s');
        updateClEntry(cl, '2927552589', '#8 Cadmus Ridge, Outside', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=575s');
        updateClEntry(cl, '523132396', '#9 Asterion Abyss, Concealed Void LS Ceiling', 'https://www.youtube.com/watch?v=qR7_yCjMw6w&t=35s');
        cl.index = -3;
    }

    // dead exos
    if (cache.Checklist[2568476210]?.entries) {
        const cl = cache.Checklist[2568476210];
        cl.video = 'https://www.youtube.com/watch?v=uu-W653ZZBE';
        updateClEntry(cl, '1287812596', '#1 Asteryion Abyss, Outside', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=319s');
        updateClEntry(cl, '2578791723', '#2 Cadmus Ridge, Outside', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=0s');
        updateClEntry(cl, '1291596818', '#3 Well of Infinitude', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=339s');
        updateClEntry(cl, '2717332017', '#4 Bray Exoscience', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=23s');
        updateClEntry(cl, '3854379920', '#5 Asteryion Abyss, Concealed Void LS', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=262s');
        updateClEntry(cl, '4176343351', '#6 Eventide Ruins, Bunker E15', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=220s');
        updateClEntry(cl, '2039102766', '#7 Cadmus Ridge, Perdition LS', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=163s');
        updateClEntry(cl, '3497190125', '#8 Eventide Ruins', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=186s');
        updateClEntry(cl, '3239366412', '#9 Creation', 'https://www.youtube.com/watch?v=uu-W653ZZBE&t=74s');
        cl.index = -2;
    }
}
