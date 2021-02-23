
import { HttpClient, HttpHeaders } from '@angular/common/http';
/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { environment as env } from '@env/environment';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Bucket, BucketService } from './bucket.service';
import { Activity, ActivityMode, AggHistoryCache, AggHistoryEntry, BungieGroupMember, BungieMember, BungieMembership, Character, ClanInfo, ClanRow, Const, InventoryItem, ItemType, MileStoneName, MilestoneStatus, PGCR, Player, PublicMilestone, PublicMilestonesAndActivities, SearchResult, Target, UserInfo, Vault } from './model';
import { NotificationService } from './notification.service';
import { ParseService } from './parse.service';

export const API_ROOT = 'https://www.bungie.net/Platform/';
const MAX_PAGE_SIZE = 250;

@Injectable()
export class BungieService implements OnDestroy {
    private publicMilestonesAndActivities: PublicMilestonesAndActivities = null;
    private unsubscribe$: Subject<void> = new Subject<void>();
    apiDown = false;

    constructor(private httpClient: HttpClient,
        private notificationService: NotificationService,
        private destinyCacheService: DestinyCacheService,
        private authService: AuthService,
        private parseService: ParseService) {
    }

    public async searchBungieUsers(name: string): Promise<BungieMember[]> {
        try {
            const resp = await this.makeReq('User/SearchUsers/?q=' + encodeURIComponent(name));
            return this.parseService.parseBungieMembers(resp);
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }


    public async searchClans(name: string): Promise<ClanInfo> {
        try {
            const resp = await this.makeReq('GroupV2/Name/' + encodeURIComponent(name) + '/1/');
            return this.parseService.parseClanInfo(resp.detail);
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }


    public async getAggHistoryForChar(char: Character): Promise<{ [key: string]: AggHistoryEntry }> {
        try {
            const resp = await this.makeReq(
                'Destiny2/' + char.membershipType + '/Account/' +
                char.membershipId + '/Character/' + char.characterId +
                '/Stats/AggregateActivityStats/');
            return this.parseService.parseAggHistory2(char, resp);
        } catch (err) {
            console.log('Error getting aggregate history for char');
            console.dir(err);
            return {};
        }
    }

    private static getAgghistoryCacheKey(player: Player) {
        const key = 'aggHistory-' + env.versions.app + '-' + player.profile.userInfo.membershipType + '-' + player.profile.userInfo.membershipId;
        return key;
    }

    public static parsePlatform(s: string) {
        if (s == null) {
            return null;
        }
        s = s.toLowerCase().trim();
        for (const p of Const.PLATFORMS_ARRAY) {
            if (s === '' + p.type) {
                return p;
            }
            if (s === '' + p.name) {
                return p;
            }
        }
    }

    public async getCachedAggHistoryForPlayer(player: Player): Promise<AggHistoryCache> {
        const key = BungieService.getAgghistoryCacheKey(player);
        const cache = await idbGet(key) as AggHistoryCache;
        if (cache == null) {
            return null;
        }
        if (cache.membershipId == player.profile.userInfo.membershipId && cache.membershipType == player.profile.userInfo.membershipType) {
            if (history.length > 0) {
                const ms = Date.parse(player.profile.dateLastPlayed);
                if (ms > cache.lastLogon) {
                    cache.stale = true;
                }
                return cache;
            }
        }
        return null;
    }

    public setCachedAggHistoryForPlayer(player: Player): Promise<void> {
        const cacheMe: AggHistoryCache = {
            membershipType: player.profile.userInfo.membershipType,
            membershipId: player.profile.userInfo.membershipId,
            lastLogon: Date.parse(player.profile.dateLastPlayed),
            stale: false,
            data: player.aggHistory
        };
        const key = BungieService.getAgghistoryCacheKey(player);
        return idbSet(key, cacheMe);
    }


    // type can be 'force', 'cache' or 'best'
    public async applyAggHistoryForPlayer(player: Player, type: string): Promise<boolean> {
        if (type !== 'force') {
            const cache = await this.getCachedAggHistoryForPlayer(player);
            if (cache != null) {
                player.aggHistory = cache.data;
                if (type == 'cache') {
                    // console.log(player.profile.userInfo.displayName + ' found cached history, fresh = ' + (!cache.stale));
                    return cache.stale;
                } else if (!cache.stale) {
                    // console.log(player.profile.userInfo.displayName + ' found cached history, fresh = ' + (!cache.stale));
                    return cache.stale;
                }
            } else if (type == 'cache') {
                // console.log(player.profile.userInfo.displayName + ' no cached history');
                return true;
            }
        }
        console.log(player.profile.userInfo.displayName + ' stale/missing cached history, loading from API');
        const chars = player.characters;
        const promises: Promise<{ [key: string]: AggHistoryEntry }>[] = [];
        chars.forEach(c => {
            const p = this.getAggHistoryForChar(c);
            promises.push(p);
        });
        const x = await Promise.all(promises);
        const arr = ParseService.mergeAggHistory2(x);
        player.aggHistory = arr;
        this.setCachedAggHistoryForPlayer(player);
        // this isn't stale b/c we just loaded it
        return false;
    }


    public async observeUpdateAggHistory(player: BehaviorSubject<Player>, debug: boolean) {
        const p = player.getValue();
        const cacheType = debug ? 'force' : 'cache';
        const stale = await this.applyAggHistoryForPlayer(p, cacheType);
        player.next(p);
        if (stale) {
            await this.applyAggHistoryForPlayer(p, 'force');
            player.next(p);
        }
    }

    private static hasNfHighScores(player: Player): boolean {
        if (player.aggHistory == null) {
            return false;
        }
        for (const a of player.aggHistory) {
            if (a.activityCompletions > 0 && a.activityBestSingleGameScore && (a.highScore == null)) {
                return false;
            }
        }
        return true;
    }

    public async loadClansForUser(userInfo: UserInfo) {
        if (userInfo.bungieInfo == null) {
            const bungieMember: BungieMembership = await this.getBungieMembershipsById(userInfo.membershipId, userInfo.membershipType);
            // blocked by privacy settings?
            if (bungieMember == null) {
                return;
            }
            await this.setClans(bungieMember);
            userInfo.bungieInfo = bungieMember;
        }
    }

    public async loadClans(player: BehaviorSubject<Player>): Promise<void> {
        const p = player.getValue();
        const userInfo = p.profile.userInfo;
        await this.loadClansForUser(userInfo);
        player.next(p);
    }

    public async getClanInfo(clanId: string): Promise<ClanInfo> {
        const resp = await this.makeReq('GroupV2/' + clanId + '/');
        return this.parseService.parseClanInfo(resp.detail);
    }

    // clans never > 100
    public async getClanMembers(clanId: string): Promise<BungieGroupMember[]> {
        const resp = await this.makeReq('GroupV2/' + clanId + '/Members/?currentPage=1&memberType=0');
        return this.parseService.parseClanMembers(resp.results);
    }

    public async getClans(bungieId: string): Promise<ClanRow[]> {
        try {
            const resp = await this.makeReq('GroupV2/User/254/' + bungieId + '/0/1/');
            const returnMe: ClanRow[] = [];
            const clanMap = {};
            for (const r of resp.results) {
                if (r.group != null && r.group.groupType === 1) {
                    if (clanMap[r.group.groupId] === true) {
                        continue;
                    }
                    returnMe.push(new ClanRow(r.group.name, r.group.groupId));
                    clanMap[r.group.groupId] = true;
                }
            }
            return returnMe;
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }

    private async setClans(membership: BungieMembership) {
        const c = await this.getClans(membership.bungieId);
        if (c != null) {
            membership.clans = c;
        }
    }

    public getActivityModes(): ActivityMode[] {
        return [
            new ActivityMode(0, 'All', 'All'), // None
            new ActivityMode(7, 'All - PvE', 'All PvE'),
            new ActivityMode(5, 'All - PvP', 'All PvP'),
            new ActivityMode(4, 'Raid', 'Raid'),
            new ActivityMode(82, 'Dungeon', 'Dungeon'),
            new ActivityMode(46, 'Nightfall', 'Scored Nightfall'),
            new ActivityMode(69, 'Competitive - PvP', 'Competitive PvP'),
            // new ActivityMode(66, 'Forge', 'Forge'),
            new ActivityMode(64, 'Gambit', 'All Gambit'),
            new ActivityMode(19, 'Iron Banner', 'Iron Banner'),
            // new ActivityMode(77, 'Menagerie', 'Menagerie'),
            new ActivityMode(6, 'Patrol', 'Patrol'),
            // new ActivityMode(76, 'Reckoning', 'Reckoning'),
            new ActivityMode(84, 'Trials', 'Trials'),
            new ActivityMode(2, 'Story', 'Story'),
            // new ActivityMode(18, 'All Strikes', 'All Strikes'),
            // new ActivityMode(69, 'PvP Competitive', 'PvP Competitive'),
            // new ActivityMode(70, 'PvP Quickplay', 'PvP Quickplay'),
            // new ActivityMode(32, 'Private Matches', 'Private Matches'),
            // new ActivityMode(39, 'Trials', 'Trials'),
            // new ActivityMode(15, 'Crimson Doubles', 'Crimson Doubles'),
            // new ActivityMode(10, 'Control', 'Control'),
            // new ActivityMode(43, 'Iron Banner Control', 'Iron Banner Control'),
            // new ActivityMode(12, 'Clash', 'Clash'),
            // new ActivityMode(44, 'Iron Banner Clash', 'Iron Banner Clash'),
            // new ActivityMode(31, 'Supremacy', 'Supremacy'),
            // new ActivityMode(45, 'Iron Banner Supremacy', 'Iron Banner Supremacy'),
            // new ActivityMode(25, 'All Mayhem', 'All Mayhem'),
            // new ActivityMode(16, 'Nightfall (old)', 'Nightfall (old)'),
            // new ActivityMode(17, 'Heroic Nightfall (old)', 'Heroic Nightfall (old)'),
            // new ActivityMode(3, 'Strike', 'Strike'),
            // new ActivityMode(37, 'Survival', 'Survival'),
            // new ActivityMode(38, 'Countdown', 'Countdown'),
            // new ActivityMode(40, 'Social', 'Social'),
            // new ActivityMode(48, 'Rumble', 'Rumble'),
            // new ActivityMode(49, 'All Doubles', 'All Doubles'),
            // new ActivityMode(50, 'Doubles', 'Doubles')
        ];
    }

    public async buildReqOptions(): Promise<any> {
        try {
            const key = await this.authService.getKey();
            if (key == null) {
                let headers = new HttpHeaders();
                headers = headers
                    .set('X-API-Key', environment.bungie.apiKey);
                return {
                    headers: headers
                };
            } else {

                let headers = new HttpHeaders();
                headers = headers
                    .set('X-API-Key', environment.bungie.apiKey)
                    .set('Authorization', 'Bearer ' + key);
                return {
                    headers: headers
                };
            }
        } catch (err) {
            console.dir(err);
            let headers = new HttpHeaders();
            headers = headers
                .set('X-API-Key', environment.bungie.apiKey);
            return {
                headers: headers
            };
        }
    }

    public handleError(err) {
        if (err.error != null) {
            const j = err.error;
            if (j.ErrorCode && j.ErrorCode !== 1) {
                if (j.ErrorCode === 1665) {
                    return {
                        privacy: true
                    };
                }
                if (j.ErrorCode === 5) {
                    this.apiDown = true;
                }
                this.notificationService.fail(j.Message);
                return;
            }
        }
        console.dir(err);
        if (err.status === 0) {
            this.notificationService.fail('Connection refused? Is your internet connected? ' +
                'Are you using something like Privacy Badger? ' +
                'If so, please whitelist Bungie.net or disable it for this site');
        } else if (err.message != null) {
            this.notificationService.fail(err.message);
        } else if (err.status != null) {
            this.notificationService.fail(err.status + ' ' + err.statusText);
        } else {
            this.notificationService.fail('Unexpected problem: ' + err);
        }
    }

    public parseBungieResponse(j: any): any {
        if (j.ErrorCode && j.ErrorCode !== 1) {
            if (j.ErrorCode === 1665) {
                return {
                    privacy: true
                };
            }
            if (j.ErrorCode === 5) {
                this.apiDown = true;
            }
            throw new Error(j.Message);
        }
        if (!j.ErrorCode) {
            throw new Error('Unexpected response from Bungie');
        }
        this.apiDown = false;
        return j.Response;
    }

    public async getPGCR(instanceId: string): Promise<PGCR> {
        try {
            const opt = await this.buildReqOptions();
            const url = 'https://stats.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport/' + instanceId + '/';
            const hResp = await this.httpClient.get<any>(url, opt).toPromise();
            const resp = this.parseBungieResponse(hResp);
            return this.parseService.parsePGCR(resp);
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    // private createVendorMilestone(targetVendorHash: string, key: string, vendorData: SaleItem[], p: Player, c: Character) {
    //     const powerfulBounties: SaleItem[] = [];
    //     let vendorFound = false;
    //     for (const i of vendorData) {
    //         if (i.vendor.hash == targetVendorHash) {
    //             vendorFound = true;
    //             if (i.values != null && i.type == ItemType.Bounty) {
    //                 if (i.itemTypeDisplayName.indexOf('Weekly Bounty') >= 0  ) {
    //                     powerfulBounties.push(i);
    //                 }
    //                 // for (const v of i.values) {
    //                 //     // is powerful gear
    //                 //     if (v.hash == '4039143015') {
    //                 //         powerfulBounties.push(i);
    //                 //     } else if (v.hash == '3586070587') {
    //                 //         powerfulBounties.push(i);
    //                 //     } // is Firewalll Data Fragment
    //                 // }
    //             }
    //         }
    //     }
    //     // no powerful bounties avail
    //     if (powerfulBounties.length == 0) {
    //         return new MilestoneStatus(key, false, 0, null, ['Not available'], null, true, false);
    //     } else if (powerfulBounties.length == 1) {
    //         const i = powerfulBounties[0];
    //         const complete = i.status == 'Already completed';
    //         const held = i.status == 'Already held';
    //         let progress = complete ? 1 : 0;
    //         if (held) {
    //             const bounties: InventoryItem[] = p.bounties[c.characterId];
    //             let bounty: InventoryItem = null;
    //             if (bounties) {
    //                 for (const b of bounties) {
    //                     if (b.hash == i.hash) {
    //                         bounty = b;
    //                     }
    //                 }
    //             }

    //             if (bounty != null) {
    //                 progress = bounty.aggProgress / 100;
    //             }
    //         }
    //         const pseudoMs = new MilestoneStatus(key, complete, progress, null,
    //             complete ? null : held ? ['Held'] : ['Not Held'], null, false, false);
    //         return pseudoMs;
    //     } else {
    //         if (!vendorFound) {
    //             // const pseudoMs = new MilestoneStatus(key, false, 0, null,
    //             //     'Vendor not found', null);
    //             return null;
    //         }
    //         let complete = 0;
    //         let held = 0;
    //         for (const b of powerfulBounties) {
    //             if (b.status == 'Already completed') {
    //                 complete++;
    //             }
    //             if (b.status == 'Already held') {
    //                 held++;
    //             }
    //         }
    //         let info = complete + '/' + powerfulBounties.length;
    //         if (held > 0) {
    //             info += ', ' + held + ' held';
    //         }
    //         const allDone = complete === powerfulBounties.length;
    //         const pseudoMs = new MilestoneStatus(key, allDone,
    //             complete / powerfulBounties.length, null, allDone ? null : [info], null, false, false);
    //         return pseudoMs;
    //     }
    // }

    private async _publicMsHack(): Promise<any> {
        try {
            return await this.makeReq('Destiny2/Milestones/');
        } catch (err) {
            this.notificationService.info('Public milestone endpoint failed, falling back on saved milestones from 2-23-2021');
            return await this.makeFakeReq('/assets/fake-milestones.json');
        }

        // try {
        // } catch (err) {
        //     console.log('!!!Returning canned reply ');
        //     this.notificationService.info('Bungie Public milestone endpoint failed. Using canned response from 2/12');
        //     console.dir(err);
        //     return JSON.parse('asdf').Response;
        // }
    }

    public async getPublicMilestones(): Promise<PublicMilestonesAndActivities> {
        if (this.publicMilestonesAndActivities != null) {
            return this.publicMilestonesAndActivities;
        }
        try {
            const resp = await this._publicMsHack();
            const resp2 = await this.makeReq('Destiny2/1/Profile/4611686018434964640/?components=CharacterActivities,CharacterProgressions');
            const reply = this.parseService.parsePublicMilestones(resp, resp2);
            this.publicMilestonesAndActivities = reply;
            return reply;
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async getActivityHistoryPage(membershipType: number, membershipId: string,
        characterId: string, mode: number, page: number, count: number, ignoreErrors?: boolean): Promise<Activity[]> {
        try {
            const resp = await this.makeReq('Destiny2/' + membershipType + '/Account/' +
                membershipId + '/Character/' + characterId + '/Stats/Activities/?count=' +
                count + '&mode=' + mode + '&page=' + page);
            if (resp.privacy === true) {
                if (!ignoreErrors) {
                    this.notificationService.info('Player has blocked access to activity history');
                }
            } else if (resp.activities) {
                return this.parseService.parseActivities(resp.activities);
            }
            return [];
        } catch (err) {
            if (!ignoreErrors) {
                this.handleError(err);
            }
            return [];
        }
    }

    public async getActivityHistoryAsync(membershipType: number, membershipId: string,
        characterId: string, mode: number, max: number, ignoreErrors?: boolean): Promise<Activity[]> {
        return await this.getActivityHistory(membershipType, membershipId, characterId, mode, max, ignoreErrors);
    }

    public async getActivityHistoryUntilDate(membershipType: number, membershipId: string, characterId: string, mode: number, stopDate: Date): Promise<Activity[]> {
        let returnMe = [];
        let page = 0;
        // repeat until we run out of activities or we precede the start date or we hit 10 pages
        while (true) {
            const activities = await this.getActivityHistoryPage(membershipType, membershipId, characterId, mode, 0, MAX_PAGE_SIZE, true);
            returnMe = returnMe.concat(activities);
            // out of activities
            if (activities.length < MAX_PAGE_SIZE) {
                break;
            }
            const lastActivity = activities[activities.length - 1];
            const d: Date = new Date(lastActivity.period);
            // we're past the date
            if (d.getTime() < stopDate.getTime()) {
                break;
            }
            page++;
            // too many pages
            if (page > 10) {
                throw new Error('Too many pages of data, stopping');
            }
        }
        return returnMe.filter(a => {
            const d: Date = new Date(a.period);
            return d.getTime() >= stopDate.getTime();
        });
    }

    public async getActivityHistory(membershipType: number, membershipId: string,
        characterId: string, mode: number, max: number, ignoreErrors?: boolean): Promise<Activity[]> {
        let curPage = 0;
        let allMatches: any[] = [];
        while (true) {
            const matches = await this.getActivityHistoryPage(membershipType, membershipId, characterId,
                mode, curPage, MAX_PAGE_SIZE, ignoreErrors);
            if (matches == null) {
                break;
            }
            curPage++;
            allMatches = allMatches.concat(matches);
            if (matches.length < MAX_PAGE_SIZE || allMatches.length >= max) {
                break;
            }
        }
        if (allMatches.length > max) {
            allMatches = allMatches.slice(0, max);
        }
        return allMatches;
    }

    public async getCharsTryAllPlatforms(likelyMembershipType: number, membershipId: string, components: string[], detailedInv?: boolean): Promise<Player> {
        const player = await this.getChars(likelyMembershipType, membershipId, components, true, detailedInv);
        if (player?.characters?.length > 0) {
            return player;
        }
        // try STEAM, then XBL, then PSN then STADIA
        // skip the one we already tried above
        for (let cntr = 0; cntr < Const.PLATFORMS_ARRAY.length; cntr++) {
            const tryMe = Const.PLATFORMS_ARRAY[cntr].type;
            if (tryMe === likelyMembershipType) {
                continue;
            }
            const player = await this.getChars(tryMe, membershipId, components, true, detailedInv);
            if (player?.characters?.length > 0) {
                return player;
            }
        }
        return null;

    }


    public async getChars(membershipType: number, membershipId: string, components: string[], ignoreErrors?: boolean, detailedInv?: boolean, showZeroPtTriumphs?: boolean, showInvisTriumphs?: boolean, contentVaultOnly?: boolean): Promise<Player> {
        try {
            const sComp = components.join();
            const resp = await this.makeReq('Destiny2/' + membershipType + '/Profile/' +
                membershipId + '/?components=' + sComp);
            let ms: PublicMilestone[] = null;
            if (components.includes('CharacterProgressions')) {
                const publicInfo = await this.getPublicMilestones();
                if (publicInfo != null) {
                    ms = publicInfo.publicMilestones;
                }
            }
            return this.parseService.parsePlayer(resp, ms, detailedInv, showZeroPtTriumphs, showInvisTriumphs, contentVaultOnly);
        } catch (err) {
            if (err.error != null && err.error.ErrorStatus == 'DestinyAccountNotFound') {
                return null;
            }
            if (!ignoreErrors) {
                this.handleError(err);
            } else {
                console.log(err);
            }
            return null;
        }
    }

    public async searchPlayer(platform: number, gt: string): Promise<SearchResult> {
        try {
            const resp = await this.makeReq('Destiny2/SearchDestinyPlayer/' + platform + '/' + encodeURIComponent(gt) + '/');
            if (resp.length === 0) {
                return null;
            }
            if (resp.length > 1) {
                for (const item of resp) {
                    if (item.displayName === gt) {
                        return item;
                    }
                }
                return resp[0];
            }
            // hack for 2/informer  broken account
            if (resp.length === 1 && resp[0].membershipId === '4611686018465893351') {
                resp[0].membershipId = '4611686018428560404';
            }
            return resp[0];
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async getBungieMembershipsById(membershipId: string, membershipType: number): Promise<BungieMembership> {
        try {
            const resp = await this.makeReq('Destiny2/' + membershipType + '/Profile/' + membershipId + '/LinkedProfiles/');
            return this.parseService.parseLinkedProfiles(resp);
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async transfer(membershipType: number, target: Target, item: InventoryItem, isVault: boolean, vault: Vault, bucketService: BucketService, pullFromPostmaster?: boolean): Promise<boolean> {
        try {
            if (pullFromPostmaster) {
                await this.postReq('Destiny2/Actions/Items/PullFromPostmaster/', {
                    characterId: target.id,
                    itemId: item.id,
                    itemReferenceHash: item.hash,
                    membershipType: membershipType,
                    stackSize: item.quantity
                });
            } else {
                await this.postReq('Destiny2/Actions/Items/TransferItem/', {
                    characterId: target.id,
                    itemId: item.id,
                    itemReferenceHash: item.hash,
                    membershipType: membershipType,
                    stackSize: item.quantity,
                    transferToVault: isVault
                });
            }
            let to: Target;
            let from: Target;
            if (isVault == true) {
                to = vault;
                from = target;
            } else {
                to = target;
                from = vault;
            }
            const fromBucket: Bucket = bucketService.getBucket(from, item.inventoryBucket);
            const toBucket: Bucket = bucketService.getBucket(to, item.inventoryBucket);
            fromBucket.remove(item);
            toBucket.items.push(item);
            return true;
        } catch (err) {
            if (err.error && err.error.ErrorCode == 1642) {
                if (isVault) {
                    console.log(`Count not transfer ${item.name} to ${vault.label}: no space.`);
                } else {
                    console.log(`Count not transfer ${item.name} to ${target.label}: no space.`);
                }
                return false;
            }
            this.handleError(err);
            throw new Error('Failed to transfer ' + item.name);
        }
    }

    // use this once it works on enough things to be worthwhile

    // public async setTrackedState(membershipType: number, item: InventoryItem, tracked: boolean): Promise<boolean> {
    //     try {
    //         await this.postReq('Destiny2/Actions/Items/SetTrackedState/', {
    //             state: tracked,
    //             itemId: item.id,
    //             characterId: item.owner.getValue().id,
    //             membershipType: membershipType
    //         });
    //         item.tracked = tracked;
    //         return true;
    //     } catch (err) {
    //         this.handleError(err);
    //         return false;
    //     }
    // }

    public async equip(membershipType: number, item: InventoryItem): Promise<boolean> {
        try {
            await this.postReq('Destiny2/Actions/Items/EquipItem/', {
                characterId: item.owner.getValue().id,
                itemId: item.id,
                membershipType: membershipType
            });
            return true;
        } catch (err) {
            this.handleError(err);
            return false;
        }
    }

    public async setLock(membershipType: number, characterId: string, item: InventoryItem, locked: boolean): Promise<boolean> {
        try {
            await this.postReq('Destiny2/Actions/Items/SetLockState/', {
                characterId: characterId,
                itemId: item.id,
                membershipType: membershipType,
                state: locked
            });
            return true;
        } catch (err) {
            this.handleError(err);
            return false;
        }
    }


    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    private async makeFakeReq(url: string): Promise<any> {
        const hResp = await this.httpClient.get<any>(url).toPromise();
        const resp = this.parseBungieResponse(hResp);
        return resp;
    }

    private async makeReq(uri: string): Promise<any> {
        const opt = await this.buildReqOptions();
        const hResp = await this.httpClient.get<any>(API_ROOT + uri, opt).toPromise();
        const resp = this.parseBungieResponse(hResp);
        return resp;
    }

    private async postReq(uri: string, payload: any): Promise<any> {
        const opt = await this.buildReqOptions();
        const hResp = await this.httpClient.post<any>(API_ROOT + uri, payload, opt).toPromise();
        const resp = this.parseBungieResponse(hResp);
        return resp;
    }


    public loadActivityPseudoMilestones(playerSubject: BehaviorSubject<Player>) {
        const p = playerSubject.getValue();
        if (!p) {
            return;
        }

        // privacy will hide this
        if (!p.characters[0].endWeek) {
            return;
        }

        const ms1: MileStoneName = {
            key: Const.PSUEDO_HERESY_KEY,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Masterwork Armor',
            boost: Const.BOOST_DROP_TABLE[Const.BOOST_LEGENDARY],
            name: 'Pit of Heresy',
            desc: 'Complete the Pit of Heresy Dungeon',
            hasPartial: true,
            neverDisappears: true,
            dependsOn: []
        };
        p.milestoneList.push(ms1);
        // const ms2: MileStoneName = {
        //     key: Const.PROPHECY_KEY,
        //     resets: p.characters[0].endWeek.toISOString(),
        //     rewards: 'Pinnacle Gear',
            // boostKey: Const.BOOST_PINNACLE,
        //     name: 'Prophecy',
        //     desc: 'Complete the Prophecy Dungeon',
        //     hasPartial: true,
        //     neverDisappears: true,
        //     dependsOn: []
        // };
        // p.milestoneList.push(ms2);

        const msbg3: MileStoneName = {
            key: Const.PSUEDO_BATTLEGROUND_3,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Powerful Gear (Tier 2)',
            boost: Const.BOOST_DROP_TABLE[Const.BOOST_POWERFUL_2],
            name: 'Battlegrounds Playlist 3',
            desc: 'Complete the Battlegrounds playlist 3 times this week',
            hasPartial: true,
            neverDisappears: true,
            dependsOn: []
        };
        p.milestoneList.push(msbg3);

        const msbg6: MileStoneName = {
            key: Const.PSUEDO_BATTLEGROUND_6,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Powerful Gear (Tier 2)',
            boost: Const.BOOST_DROP_TABLE[Const.BOOST_POWERFUL_2],
            name: 'Battlegrounds Playlist 6',
            desc: 'Complete the Battlegrounds playlist 63 times this week',
            hasPartial: true,
            neverDisappears: true,
            dependsOn: []
        };
        p.milestoneList.push(msbg6);
        const msbg9: MileStoneName = {
            key: Const.PSUEDO_BATTLEGROUND_9,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Powerful Gear (Tier 3)',
            boost: Const.BOOST_DROP_TABLE[Const.BOOST_POWERFUL_3],
            name: 'Battlegrounds Playlist 9',
            desc: 'Complete the Battlegrounds playlist 9 times this week',
            hasPartial: true,
            neverDisappears: true,
            dependsOn: []
        };
        p.milestoneList.push(msbg9);


        const ms3: MileStoneName = {
            key: Const.PSUEDO_MASTER_EMPIRE_HUNT,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Pinnacle Gear',
            boost: Const.BOOST_DROP_TABLE[Const.BOOST_PINNACLE],
            name: 'Master Empire Hunt',
            desc: 'Complete a Master Empire Hunt',
            hasPartial: true,
            neverDisappears: true,
            dependsOn: []
        };
        p.milestoneList.push(ms3);
        p.milestoneList.sort((a, b) => {
            if (a.boost.sortVal < b.boost.sortVal) { return 1; }
            if (a.boost.sortVal > b.boost.sortVal) { return -1; }
            if (a.rewards < b.rewards) { return 1; }
            if (a.rewards > b.rewards) { return -1; }
            if (a.name > b.name) { return 1; }
            if (a.name < b.name) { return -1; }
            return 0;
        });
        const empty1: MilestoneStatus = new MilestoneStatus(Const.PSUEDO_HERESY_KEY, false, 0, null, ['Loading...'], null, false, false);
        // load empty while we wait, so it doesn't show checked
        for (const c of p.characters) {
            c.milestones[Const.PSUEDO_HERESY_KEY] = empty1;
        }
        playerSubject.next(p);
        for (const c of p.characters) {
            this.loadActivityPseudoMilestonesOnChar(playerSubject, c);
        }
        return playerSubject;
    }


    private static setPseudoMilestoneFromActivities(c: Character, msKey: string, activities: Activity[], filterName: string) {
        const filteredActivities = activities.filter(a => a.name?.indexOf(filterName) >= 0);
        let done = false;
        let mightHaveCheckpoint = false;
        // iterate in descending order, if they have an unfinished instance, they might have a checkpoint
        // if they're done, we're done looking
        for (const a of filteredActivities) {
            if (a.success && a.completed) {
                done = true;
                break;
            } else {
                mightHaveCheckpoint = true;
            }
        }
        c.milestones[msKey] = new MilestoneStatus(msKey, done, done ? 1 : mightHaveCheckpoint ? 0.5 : 0, null, mightHaveCheckpoint ? ['May hold checkpoint'] : null, null, false, false);
    }

    private async loadActivityPseudoMilestonesOnChar(p: BehaviorSubject<Player>, c: Character): Promise<void> {
        // let d = new Date();
        // d.setDate(d.getDate() - 40)
        const activities = await this.getActivityHistoryUntilDate(c.membershipType, c.membershipId, c.characterId, 82, c.startWeek);
        // extra filter just in case
        const dungeonActivities = activities.filter(a => a.mode == 'Dungeon');
        // BungieService.setPseudoMilestoneFromActivities(c, Const.PROPHECY_KEY, dungeonActivities, "Prophecy");
        BungieService.setPseudoMilestoneFromActivities(c, Const.PSUEDO_HERESY_KEY, dungeonActivities, "Heresy");
        p.next(p.getValue());
    }

}
