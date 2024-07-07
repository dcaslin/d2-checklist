
import { HttpClient, HttpHeaders } from '@angular/common/http';
/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { environment as env } from '@env/environment';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Bucket, BucketService } from './bucket.service';
import { Activity, ActivityMode, AggHistoryCache, AggHistoryEntry, BUCKET_ID_VAULT, BungieGlobalSearchResult, BungieGroupMember, BungieMember, BungieMembership, Character, ClanInfo, ClanRow, Const, InventoryItem, InventorySocket, MilestoneStatus, Player, PublicMilestone, PublicMilestonesAndActivities, SearchResult, Target, UserInfo, Vault } from './model';
import { NotificationService } from './notification.service';
import { ParseService } from './parse.service';
import { SimpleParseService } from './simple-parse.service';

export const API_ROOT = 'https://www.bungie.net/Platform/';
const MAX_PAGE_SIZE = 250;

@Injectable()
export class BungieService implements OnDestroy {
    private publicMilestonesAndActivities: PublicMilestonesAndActivities = null;
    private unsubscribe$: Subject<void> = new Subject<void>();
    apiDown = false;

    constructor(private httpClient: HttpClient,
        private notificationService: NotificationService,
        private authService: AuthService,
        private parseService: ParseService) {
    }

    public async searchBungieUsers2(name: string): Promise<BungieMember[]> {
        try {
            const resp = await this.makeReq('User/SearchUsers/?q=' + encodeURIComponent(name));
            return SimpleParseService.parseBungieMembers(resp);
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }


    public async searchBungieUsers(name: string): Promise<BungieGlobalSearchResult[]> {
        try {
            const resp = await this.postReq(`User/Search/GlobalName/0/`, {
                displayNamePrefix: name
            });
            const returnMe: BungieGlobalSearchResult[] = [];
            if (resp.searchResults) {
                for (const r of resp.searchResults) {
                    for (const m of r.destinyMemberships) {
                        // overridden, skip it
                        if (m.applicableMembershipTypes.length == 0) {
                            continue;
                        }
                        const row: BungieGlobalSearchResult = {
                            searchResult: m,
                            bungieGlobalDisplayName: r.bungieGlobalDisplayName,
                            bungieGlobalDisplayNameCode: r.bungieGlobalDisplayNameCode,
                            bungieNetMembershipId: r.bungieNetMembershipId,
                            clans: null
                        };
                        returnMe.push(row);
                    }
                }
            }
            return returnMe;
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }



    public async searchClans(name: string): Promise<ClanInfo> {
        try {
            const resp = await this.makeReq('GroupV2/Name/' + encodeURIComponent(name) + '/1/');
            return await this.parseService.parseClanInfo(resp.detail);
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
            return await this.parseService.parseAggHistory2(char, resp);
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
        console.log(`applyAggHistoryForPlayer ${type}`);
        if (type !== 'force') {
            const cache = await this.getCachedAggHistoryForPlayer(player);
            if (cache != null) {
                player.aggHistory = cache.data;
                if (type == 'cache') {
                    console.log(player.profile.userInfo.displayName + ' found cached history, fresh = ' + (!cache.stale));
                    return cache.stale;
                } else if (!cache.stale) {
                    console.log(player.profile.userInfo.displayName + ' found cached history, fresh = ' + (!cache.stale));
                    return cache.stale;
                }
            } else if (type == 'cache') {
                console.log(player.profile.userInfo.displayName + ' no cached history');
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
        return await this.parseService.parseClanInfo(resp.detail);
    }

    // clans never > 100
    public async getClanMembers(clanId: string): Promise<BungieGroupMember[]> {
        const resp = await this.makeReq('GroupV2/' + clanId + '/Members/?currentPage=1&memberType=0');
        return SimpleParseService.parseClanMembers(resp.results);
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

    public static getActivityModes(): ActivityMode[] {
        return [
            new ActivityMode(0, 'All', 'All'), // None
            new ActivityMode(91, 'Iron Banner Zone Control', 'Iron Banner Zone Control'),
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
            new ActivityMode(48, 'Rumble', 'Rumble'),
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

    private async fetchFailSafePublicMilestone(): Promise<any> {
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
            const resp = await this.fetchFailSafePublicMilestone();
            // const resp2 = await this.makeReq('Destiny2/1/Profile/4611686018434964640/?components=CharacterActivities,CharacterProgressions');
            const reply = await this.parseService.parsePublicMilestones(resp);
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
                return await this.parseService.parseActivities(resp.activities);
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

        while (page < 11) {
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
        // eslint-disable-next-line no-constant-condition
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
        // try the platforms in order
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


    public async getChars(membershipType: number, membershipId: string, components: string[], ignoreErrors?: boolean, detailedInv?: boolean, showZeroPtTriumphs?: boolean, showInvisTriumphs?: boolean): Promise<Player> {
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
            return await this.parseService.parsePlayer(resp, ms, detailedInv, showZeroPtTriumphs, showInvisTriumphs);
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
            const resp = await this.makeReq(`User/Search/Prefix/${gt}/0/`);
            const results = resp.searchResults;
            for (const r of results) {
                for (const m of r.destinyMemberships) {
                    if (m.applicableMembershipTypes?.indexOf(platform) >= 0) {
                        return m;
                    }
                }
            }
            return null;
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async getBungieMembershipsById(membershipId: string, membershipType: number): Promise<BungieMembership> {
        try {
            const resp = await this.makeReq('Destiny2/' + membershipType + '/Profile/' + membershipId + '/LinkedProfiles/');
            return SimpleParseService.parseLinkedProfiles(resp);
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async insertFreeSocket(player: Player, item: InventoryItem, socket: InventorySocket, plugItemHash: string): Promise<boolean> {
        let owner = item.owner.getValue().id;
        if (owner == BUCKET_ID_VAULT) {
            owner = player.characters[0].id;
        }
        await this.postReq('Destiny2/Actions/Items/InsertSocketPlugFree/', {
            plug: {
                socketIndex: socket.index,
                socketArrayType: 0, // 0 is default, 1 is intrinsic, never need to use intrinsic right now
                plugItemHash: plugItemHash
            },
            characterId: owner,
            itemId: item.id,
            membershipType: player.profile.userInfo.membershipType
        });
        return true;
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
}
