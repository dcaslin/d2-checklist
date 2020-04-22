
import { HttpClient, HttpHeaders } from '@angular/common/http';
/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { environment as env } from '@env/environment';
import { get, set } from 'idb-keyval';
import { BehaviorSubject, Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, first, takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthInfo, AuthService } from './auth.service';
import { Bucket, BucketService } from './bucket.service';
import { Activity, ActivityMode, AggHistoryCache, AggHistoryEntry, BungieGroupMember, BungieMember, BungieMembership, Character, ClanInfo, ClanRow, Const, Currency, InventoryItem, ItemType, MileStoneName, MilestoneStatus, Mission, PGCR, Player, PublicMilestone, PublicMilestonesAndActivities, PvpStreak, SaleItem, SearchResult, SelectedUser, Target, UserInfo, Vault } from './model';
import { NotificationService } from './notification.service';
import { ParseService } from './parse.service';

const API_ROOT = 'https://www.bungie.net/Platform/';
const MAX_PAGE_SIZE = 250;

@Injectable()
export class BungieService implements OnDestroy {
    private selectedUserSub = new ReplaySubject(1);
    public selectedUserFeed: Observable<SelectedUser>;
    private publicMilestonesAndActivities: PublicMilestonesAndActivities = null;
    private unsubscribe$: Subject<void> = new Subject<void>();
    authInfo: AuthInfo;
    selectedUser: SelectedUser;
    apiDown = false;

    private async updateSelectedUser(selectedUser: SelectedUser): Promise<void> {
        if (selectedUser != null) {
            // wait until cache is ready
            this.destinyCacheService.ready.asObservable().pipe(filter(x => x === true), first()).subscribe(() => {
                this.setClans(this.selectedUser.membership);
                this.applyCurrencies(this.selectedUser);
            });
        }
    }

    constructor(private httpClient: HttpClient,
        private notificationService: NotificationService,
        private destinyCacheService: DestinyCacheService,
        private authService: AuthService,
        private parseService: ParseService) {
        this.selectedUserFeed = this.selectedUserSub.asObservable() as Observable<SelectedUser>;
        this.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
            this.updateSelectedUser(selectedUser);
        });
        this.authService.authFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((ai: AuthInfo) => {
            this.authInfo = ai;
            if (ai != null) {
                this.getBungieMembershipsById(ai.memberId, -1).then((membership: BungieMembership) => {
                    if (membership == null || membership.destinyMemberships == null || membership.destinyMemberships.length === 0) {
                        console.log('No membership found for id, signing out.');
                        this.authService.signOut();
                        return;
                    }
                    const selectedUser: SelectedUser = new SelectedUser();
                    selectedUser.membership = membership;

                    // For testing, add a fake PSN account
                    // let fake: UserInfo = JSON.parse(JSON.stringify(membership.destinyMemberships[0]));
                    // fake.membershipType = 2;
                    // fake.platformName = "PSN";
                    // membership.destinyMemberships.push(fake);

                    // fake = JSON.parse(JSON.stringify(membership.destinyMemberships[0]));
                    // fake.membershipType = 4;
                    // fake.platformName = "BNET";
                    // membership.destinyMemberships.push(fake);


                    let platform = 2;
                    const sPlatform: string = localStorage.getItem('D2STATE-preferredPlatform');
                    if (sPlatform != null) {
                        platform = parseInt(sPlatform, 10);
                    } else {
                        console.log('No preferred platform using: ' + platform);
                        if (membership.destinyMemberships.length > 1) {
                            selectedUser.promptForPlatform = true;
                        }
                    }
                    membership.destinyMemberships.forEach(m => {
                        if (m.membershipType === platform) {
                            selectedUser.userInfo = m;
                        }
                    });
                    if (selectedUser.userInfo == null) {
                        selectedUser.userInfo = membership.destinyMemberships[0];
                    }
                    this.selectedUser = selectedUser;
                    this.emitUsers();
                });
            } else {
                this.selectedUser = null;
                this.emitUsers();
            }
        });
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

    public async getPvpStreakMatches(char: Character): Promise<Activity[]> {
        try {
            return await this.getActivityHistory(char.membershipType, char.membershipId, char.characterId,
                69, 50, true);
        } catch (err) {
            console.log('Error getting PVP streak history for char');
            return [];
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

    private async updatePvpStreak(p: Player): Promise<PvpStreak> {
        const promises: Promise<Activity[]>[] = [];
        p.characters.forEach(c => {
            const prom = this.getPvpStreakMatches(c);
            promises.push(prom);
        });
        const charCompAct = await Promise.all(promises);
        let allAct: Activity[] = [];
        for (const ca of charCompAct) {
            allAct = allAct.concat(ca);
        }
        if (allAct.length == 0) {
            return {
                count: 0,
                win: true
            };
        }
        allAct.sort(function (a, b) {
            if (a.period < b.period) {
                return 1;
            }
            if (a.period > b.period) {
                return -1;
            }
            return 0;
        });
        const win = allAct[0].success;
        let count = 0;
        for (const a of allAct) {
            if (a.success == win) {
                count++;
            } else {
                break;
            }
        }
        return {
            count,
            win
        };
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
        const cache = await get(key) as AggHistoryCache;
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
        return set(key, cacheMe);
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
        const nf = await this.getNightFalls();
        const arr = ParseService.mergeAggHistory2(x, nf);
        player.aggHistory = arr;
        this.setCachedAggHistoryForPlayer(player);
        // this isn't stale b/c we just loaded it
        return false;
    }

    public async getNightFalls(): Promise<Mission[]> {
        const nightfalls: Mission[] = [];
        const publicMilestones = await this.getPublicMilestones();
        if (publicMilestones != null) {
            for (const m of publicMilestones.publicMilestones) {
                if ('2853331463' === m.hash || 'nf' === m.type) {
                    for (const a of m.aggActivities) {
                        let name = a.activity.name;
                        name = name.replace('Nightfall: ', '');
                        nightfalls.push({
                            name: name,
                            icon: a.activity.icon,
                            hash: a.activity.hash
                        });
                    }
                }
            }
        }
        return nightfalls;
    }

    public async observeUpdateAggHistoryAndScores(player: BehaviorSubject<Player>, debug: boolean) {
        await this.observeUpdateAggHistory(player, debug);
        await this.observeUpdateNfScores(player);
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

    public async observeUpdateNfScores(player: BehaviorSubject<Player>) {
        const p = player.getValue();
        await this.updateNfScores(p);
        player.next(p);
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

    public async updateNfScores(player: Player): Promise<boolean> {
        if (BungieService.hasNfHighScores(player)) {
            // console.log(player.profile.userInfo.displayName + ' NF pre-cached');
            return false;
        }

        console.log(player.profile.userInfo.displayName + ' NF loading from API...');
        const promises: Promise<Activity[]>[] = [];
        for (const c of player.characters) {
            const promise = this.getNightfallPGCR(c);
            promises.push(promise);

        }
        const results = await Promise.all(promises);
        let allAct: Activity[] = [];
        for (const nfActivities of results) {
            const filtered = nfActivities.filter(x => {
                return x.success;
            });
            allAct = allAct.concat(filtered);
        }
        for (const agg of player.aggHistory) {
            if (agg.type != 'nf') {
                continue;
            }
            for (const hash of agg.hash) {
                for (const act of allAct) {
                    if (act.referenceId == +hash) {
                        if (agg.highScore == null || agg.highScore < act.teamScore) {
                            agg.highScore = act.teamScore;
                            agg.highScorePGCR = act.instanceId;
                        }
                    }
                }
                if (agg.highScore == null) {
                    agg.highScore = 0;
                }
            }
        }
        this.setCachedAggHistoryForPlayer(player);
        return true;
    }

    public async getNightfallPGCR(char: Character): Promise<Activity[]> {
        try {
            return await this.getActivityHistory(char.membershipType, char.membershipId, char.characterId,
                46, 500);
        } catch (err) {
            console.log('Error getting PVP streak history for char');
            return [];
        }
    }


    public async observeUpdatePvpStreak(player: BehaviorSubject<Player>) {
        const p = player.getValue();
        p.pvpStreak = await this.updatePvpStreak(p);
        player.next(p);
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

    private async applyCurrencies(s: SelectedUser): Promise<Currency[]> {
        // TODO, need detailed?
        const tempPlayer = await this.getChars(s.userInfo.membershipType, s.userInfo.membershipId,
            ['ProfileCurrencies', 'ProfileInventories'], true, true);
        if (tempPlayer == null) {
            console.log('No player to apply currencies to');
            return;
        }
        s.selectedUserCurrencies.next(tempPlayer.currencies);

    }

    private setClans(membership: BungieMembership) {
        this.getClans(membership.bungieId).then(c => {
            if (c != null) {
                membership.clans = c;
            }
        });
    }

    public selectUser(u: UserInfo) {
        this.selectedUser.userInfo = u;
        localStorage.setItem('D2STATE-preferredPlatform', '' + u.membershipType);
        this.emitUsers();
    }

    private emitUsers() {
        this.selectedUserSub.next(this.selectedUser);
    }

    public getActivityModes(): ActivityMode[] {
        return [
            new ActivityMode(0, 'All', 'All'), // None
            new ActivityMode(7, 'All - PvE', 'All PvE'),
            new ActivityMode(5, 'All - PvP', 'All PvP'),
            new ActivityMode(84, 'Trials', 'Trials'),
            new ActivityMode(69, 'Competitive - PvP', 'Competitive PvP'),
            new ActivityMode(66, 'Forge', 'Forge'),
            new ActivityMode(64, 'Gambit', 'All Gambit'),
            new ActivityMode(19, 'Iron Banner', 'Iron Banner'),
            new ActivityMode(77, 'Menagerie', 'Menagerie'),
            new ActivityMode(46, 'Nightfall', 'Scored Nightfall'),
            new ActivityMode(6, 'Patrol', 'Patrol'),
            new ActivityMode(4, 'Raid', 'Raid'),
            new ActivityMode(76, 'Reckoning', 'Reckoning'),
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

    private async buildReqOptions(): Promise<any> {
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

    private handleError(err) {
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

    private parseBungieResponse(j: any): any {
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

    private createVendorMilestone(targetVendorHash: string, key: string, vendorData: SaleItem[], p: Player, c: Character) {
        const powerfulBounties: SaleItem[] = [];
        let vendorFound = false;
        for (const i of vendorData) {
            if (i.vendor.hash == targetVendorHash) {
                vendorFound = true;
                if (i.values != null && i.type == ItemType.Bounty) {
                    if (i.itemTypeDisplayName.indexOf('Weekly Bounty') >= 0  ) {
                        powerfulBounties.push(i);
                    }
                    // for (const v of i.values) {
                    //     // is powerful gear
                    //     if (v.hash == '4039143015') {
                    //         powerfulBounties.push(i);
                    //     } else if (v.hash == '3586070587') {
                    //         powerfulBounties.push(i);
                    //     } // is Firewalll Data Fragment
                    // }
                }
            }
        }
        // no powerful bounties avail
        if (powerfulBounties.length == 0) {
            const psuedoMs = new MilestoneStatus(key, false, 0, null, 'Not available', null, true, false);
            return psuedoMs;
        } else if (powerfulBounties.length == 1) {
            const i = powerfulBounties[0];
            const complete = i.status == 'Already completed';
            const held = i.status == 'Already held';
            let progress = complete ? 1 : 0;
            if (held) {
                const bounties: InventoryItem[] = p.bounties[c.characterId];
                let bounty: InventoryItem = null;
                if (bounties) {
                    for (const b of bounties) {
                        if (b.hash == i.hash) {
                            bounty = b;
                        }
                    }
                }

                if (bounty != null) {
                    progress = bounty.aggProgress / 100;
                }
            }
            const psuedoMs = new MilestoneStatus(key, complete, progress, null,
                complete ? null : held ? 'Held' : 'Not Held', null, false, false);
            return psuedoMs;
        } else {
            if (!vendorFound) {
                // const psuedoMs = new MilestoneStatus(key, false, 0, null,
                //     'Vendor not found', null);
                return null;
            }
            let complete = 0;
            let held = 0;
            for (const b of powerfulBounties) {
                if (b.status == 'Already completed') {
                    complete++;
                }
                if (b.status == 'Already held') {
                    held++;
                }
            }
            let info = complete + '/' + powerfulBounties.length;
            if (held > 0) {
                info += ', ' + held + ' held';
            }
            const allDone = complete === powerfulBounties.length;
            const psuedoMs = new MilestoneStatus(key, allDone,
                complete / powerfulBounties.length, null, allDone ? null : info, null, false, false);
            return psuedoMs;
        }
    }

    private async loadWeeklyPowerfulBountiesOnChar(p: BehaviorSubject<Player>, c: Character): Promise<void> {
        const vendorData = await this.loadVendors(c);
        // 1616085565
        const erisPsuedoMs = this.createVendorMilestone('1616085565', Const.ERIS_KEY, vendorData, p.getValue(), c);
        c.milestones[Const.ERIS_KEY] = erisPsuedoMs;

        const rasputinPsuedoMs = this.createVendorMilestone('73401818', Const.RASPUTIN_KEY, vendorData, p.getValue(), c);
        c.milestones[Const.RASPUTIN_KEY] = rasputinPsuedoMs;
        // const spiderPsuedoMs = this.createVendorMilestone('863940356', Const.SPIDER_KEY, vendorData, p.getValue(), c);
        // c.milestones[Const.SPIDER_KEY] = spiderPsuedoMs;
        // const drifterPsuedoMs = this.createVendorMilestone('248695599', Const.DRIFTER_KEY, vendorData, p.getValue(), c);
        // c.milestones[Const.DRIFTER_KEY] = drifterPsuedoMs;
        // const wernerPsuedoMs = this.createVendorMilestone('880202832', Const.WERNER_KEY, vendorData, p.getValue(), c);
        // c.milestones[Const.WERNER_KEY] = wernerPsuedoMs;
        p.next(p.getValue());
    }


    private async loadActivityPsuedoMilestonesOnChar(p: BehaviorSubject<Player>, c: Character): Promise<void> {
        const activities = await this.getActivityHistoryUntilDate(c.membershipType, c.membershipId, c.characterId, 82, c.startWeek);
        const dungeonActivitiesIncomplete = activities.filter(a => a.mode == 'Dungeon' && (!a.completed || !a.success));
        const dungeonActivities = activities.filter(a => a.mode == 'Dungeon' && a.success && a.completed);
        const done = dungeonActivities.length >= 1;
        const mightHaveCheckpoint = dungeonActivitiesIncomplete.length >= 1;
        const dungeonPsuedoMs: MilestoneStatus = new MilestoneStatus(Const.DUNGEON_KEY,
            done, done ? 1 : mightHaveCheckpoint ? 0.5 : 0, 
            mightHaveCheckpoint ? 'May hold checkpoint' : null, null, null, false, false);
        c.milestones[Const.DUNGEON_KEY] = dungeonPsuedoMs;
        p.next(p.getValue());
    }


    public loadActivityPsuedoMilestones(playerSubject: BehaviorSubject<Player>) {
        const p = playerSubject.getValue();
        if (!p) {
            return;
        }

        // privacy will hide this
        if (!p.characters[0].endWeek) {
            return;
        }

        const ms1: MileStoneName = {
            key: Const.DUNGEON_KEY,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Pinnacle Gear',
            pl: Const.HIGH_BOOST,
            name: 'Pit of Heresy',
            desc: 'Complete the Pit of Heresy Dungeon',
            hasPartial: true,
            dependsOn: [],
            neverDisappears: true
        };
        p.milestoneList.push(ms1);
        p.milestoneList.sort((a, b) => {
            if (a.pl < b.pl) { return 1; }
            if (a.pl > b.pl) { return -1; }
            if (a.rewards < b.rewards) { return 1; }
            if (a.rewards > b.rewards) { return -1; }
            if (a.name > b.name) { return 1; }
            if (a.name < b.name) { return -1; }
            return 0;
          });
        const empty1: MilestoneStatus = new MilestoneStatus(Const.DUNGEON_KEY, false, 0, null, 'Loading...', null, false, false);

        // load empty while we wait, so it doesn't show checked
        for (const c of p.characters) {
            c.milestones[Const.DUNGEON_KEY] = empty1;
        }
        playerSubject.next(p);
        for (const c of p.characters) {
            this.loadActivityPsuedoMilestonesOnChar(playerSubject, c);
        }
        return playerSubject;
    }

    public loadWeeklyPowerfulBounties(playerSubject: BehaviorSubject<Player>) {
        const p = playerSubject.getValue();
        // is this the signed on user?
        if (!this.isSignedOn(p)) {
            return;
        }
        const ms1: MileStoneName = {
            key: Const.ERIS_KEY,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Powerful Gear',
            pl: Const.LOW_BOOST,
            name: 'Eris\'s Weekly Bounties',
            desc: 'Complete Luna\'s Recall and Lunar Spelunker',
            dependsOn: [],
            hasPartial: false,
            neverDisappears: true
        };
        const ms2: MileStoneName = {
            key: Const.RASPUTIN_KEY,
            resets: p.characters[0].endWeek.toISOString(),
            rewards: 'Powerful Gear',
            pl: Const.LOW_BOOST,
            name: 'Rasputin\'s Weekly Bounties',
            desc: 'Complete both of Rasputin\'s weekly bounties',
            dependsOn: [],
            hasPartial: false,
            neverDisappears: true
        };
        p.milestoneList.push(ms1);
        p.milestoneList.push(ms2);
        const empty1: MilestoneStatus = new MilestoneStatus(Const.ERIS_KEY, false, 0, null, 'Loading...', null, false, false);
        const empty2: MilestoneStatus = new MilestoneStatus(Const.RASPUTIN_KEY, false, 0, null, 'Loading...', null, false, false);

        // load empty while we wait, so it doesn't show checked
        for (const c of p.characters) {
            c.milestones[Const.ERIS_KEY] = empty1;
            c.milestones[Const.RASPUTIN_KEY] = empty2;
        }
        playerSubject.next(p);
        for (const c of p.characters) {
            this.loadWeeklyPowerfulBountiesOnChar(playerSubject, c);
        }
        return playerSubject;
    }

    public isSignedOn(p: Player): boolean {
        if (this.selectedUser == null) { return false; }
        return (this.selectedUser.userInfo.membershipId == p.profile.userInfo.membershipId);
    }

    public async groupVendorBounties(c: Character) {
        try {
            const resp = await this.makeReq('Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' +
                c.characterId + '/Vendors/?components=Vendors,VendorSales,ItemSockets');
            const vendorData = this.parseService.groupVendorBounties(resp);
            return vendorData;
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }



    public async loadVendors(c: Character): Promise<SaleItem[]> {
        try {
            const resp = await this.makeReq('Destiny2/' + c.membershipType + '/Profile/' + c.membershipId + '/Character/' +
                c.characterId + '/Vendors/?components=Vendors,VendorSales,ItemSockets');
            const vendorData = this.parseService.parseVendorData(resp);

            return vendorData;
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }

    private async _publicMsHack(): Promise<any> {
        try {
            return await this.makeReq('Destiny2/Milestones/');
        } catch (err) {
            console.log('!!!Returning canned reply ');
            this.notificationService.info('Bungie Public milestone endpoint failed. Using canned response from 2/12');
            console.dir(err);
            return JSON.parse('{"Response":{"463010297":{"milestoneHash":463010297,"availableQuests":[{"questItemHash":538154339}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":500},"3660836525":{"milestoneHash":3660836525,"activities":[{"activityHash":2693136601,"challengeObjectiveHashes":[],"modifierHashes":[3296085675],"phaseHashes":[2188993306,3847906370,1431486395,4231923662],"booleanActivityOptions":{"3796634159":true,"106117858":true}},{"activityHash":3879860661,"challengeObjectiveHashes":[],"modifierHashes":[3296085675],"phaseHashes":[2188993306,3847906370,1431486395,4231923662],"booleanActivityOptions":{"3796634159":true,"106117858":true}},{"activityHash":287649202,"challengeObjectiveHashes":[],"modifierHashes":[3296085675],"booleanActivityOptions":{"3796634159":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9000},"2986584050":{"milestoneHash":2986584050,"activities":[{"activityHash":3089205900,"challengeObjectiveHashes":[],"phaseHashes":[415534662,3813639709,2941618871,877738674],"booleanActivityOptions":{"106117858":true}},{"activityHash":2164432138,"challengeObjectiveHashes":[],"booleanActivityOptions":{"106117858":true}},{"activityHash":809170886,"challengeObjectiveHashes":[],"modifierHashes":[1879148438,3704166961],"phaseHashes":[415534662,3813639709,2941618871,877738674],"booleanActivityOptions":{"3757305506":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9100},"2683538554":{"milestoneHash":2683538554,"activities":[{"activityHash":119944200,"challengeObjectiveHashes":[],"phaseHashes":[3864507933,3025298087,1245655652,1245655655],"booleanActivityOptions":{"106117858":true}},{"activityHash":3213556450,"challengeObjectiveHashes":[],"modifierHashes":[1879148438,3704166961],"phaseHashes":[3864507933,3025298087,1245655652,1245655655],"booleanActivityOptions":{"3757305506":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9200},"3181387331":{"milestoneHash":3181387331,"activities":[{"activityHash":2122313384,"challengeObjectiveHashes":[],"phaseHashes":[1126840038,1040714588,4249034918,436847112,2392610624],"booleanActivityOptions":{"106117858":true}},{"activityHash":1661734046,"challengeObjectiveHashes":[],"booleanActivityOptions":{"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9200},"4253138191":{"milestoneHash":4253138191,"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":3000},"3603098564":{"milestoneHash":3603098564,"availableQuests":[{"questItemHash":1866206611}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":3000},"1342567285":{"milestoneHash":1342567285,"activities":[{"activityHash":548750096,"challengeObjectiveHashes":[],"phaseHashes":[566861111,244769953,1268191778],"booleanActivityOptions":{"4140089399":true,"106117858":true}},{"activityHash":2812525063,"challengeObjectiveHashes":[],"booleanActivityOptions":{"4140089399":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9200},"2590427074":{"milestoneHash":2590427074,"activities":[{"activityHash":3333172150,"challengeObjectiveHashes":[],"phaseHashes":[824306255,9235511,3789028322,3307986266],"booleanActivityOptions":{"1997210043":true,"106117858":true}},{"activityHash":960175301,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1997210043":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9300},"2958665367":{"milestoneHash":2958665367,"availableQuests":[{"questItemHash":4128405278}],"order":300},"3915793660":{"milestoneHash":3915793660,"availableQuests":[{"questItemHash":3491179892}],"order":300},"291994631":{"milestoneHash":291994631,"availableQuests":[{"questItemHash":2245391312}],"order":300},"3802603984":{"milestoneHash":3802603984,"availableQuests":[{"questItemHash":4186783783}],"order":6000},"2709491520":{"milestoneHash":2709491520,"availableQuests":[{"questItemHash":4249625143}],"order":6000},"2594202463":{"milestoneHash":2594202463,"availableQuests":[{"questItemHash":1393241487}],"order":6000},"3899487295":{"milestoneHash":3899487295,"availableQuests":[{"questItemHash":1413813747}],"order":6000},"2712317338":{"milestoneHash":2712317338,"activities":[{"activityHash":2659723068,"challengeObjectiveHashes":[1267016438],"modifierHashes":[2472478405],"phaseHashes":[2158557525,3736477924,1024471091,523815399],"booleanActivityOptions":{"2279894315":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9300},"1942283261":{"milestoneHash":1942283261,"activities":[{"activityHash":3849697856,"challengeObjectiveHashes":[],"modifierHashes":[2229336658]},{"activityHash":3849697859,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,1151235761,2579871094]},{"activityHash":3849697858,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,939324719,3859784314,2301442403,2579871094]},{"activityHash":3849697861,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,98716109,2834348323,939324719,3859784314,2821775453,2579871094],"booleanActivityOptions":{"494695110":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":5000},"2029743966":{"milestoneHash":2029743966,"activities":[{"activityHash":3849697856,"challengeObjectiveHashes":[],"modifierHashes":[2229336658]},{"activityHash":3849697859,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,1151235761,2579871094]},{"activityHash":3849697858,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,939324719,3859784314,2301442403,2579871094]},{"activityHash":3849697861,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,98716109,2834348323,939324719,3859784314,2821775453,2579871094],"booleanActivityOptions":{"494695110":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":5000},"3448738070":{"milestoneHash":3448738070,"activities":[{"activityHash":3577607128,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1719431080":true,"176840106":true}},{"activityHash":1183187383,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1719431080":true,"176840106":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":5000},"4191379729":{"milestoneHash":4191379729,"activities":[{"activityHash":952904835,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":3011324617,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":3633915199,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":2000},"2434762343":{"milestoneHash":2434762343,"activities":[{"activityHash":3176544780,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":2304691867,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":135537449,"challengeObjectiveHashes":[],"booleanActivityOptions":{"871535305":true,"3935220842":true,"176840106":true}},{"activityHash":740891329,"challengeObjectiveHashes":[],"booleanActivityOptions":{"871535305":true,"3935220842":true,"176840106":true}},{"activityHash":1478171612,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":914148167,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":2000}},"ErrorCode":1,"ThrottleSeconds":0,"ErrorStatus":"Success","Message":"Ok","MessageData":{}}').Response;
        }

        // '{"Response":{"463010297":{"milestoneHash":463010297,"availableQuests":[{"questItemHash":538154339}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":500},"3660836525":{"milestoneHash":3660836525,"activities":[{"activityHash":2693136601,"challengeObjectiveHashes":[],"modifierHashes":[3296085675],"phaseHashes":[2188993306,3847906370,1431486395,4231923662],"booleanActivityOptions":{"3796634159":true,"106117858":true}},{"activityHash":3879860661,"challengeObjectiveHashes":[],"modifierHashes":[3296085675],"phaseHashes":[2188993306,3847906370,1431486395,4231923662],"booleanActivityOptions":{"3796634159":true,"106117858":true}},{"activityHash":287649202,"challengeObjectiveHashes":[],"modifierHashes":[3296085675],"booleanActivityOptions":{"3796634159":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9000},"2986584050":{"milestoneHash":2986584050,"activities":[{"activityHash":3089205900,"challengeObjectiveHashes":[],"phaseHashes":[415534662,3813639709,2941618871,877738674],"booleanActivityOptions":{"106117858":true}},{"activityHash":2164432138,"challengeObjectiveHashes":[],"booleanActivityOptions":{"106117858":true}},{"activityHash":809170886,"challengeObjectiveHashes":[],"modifierHashes":[1879148438,3704166961],"phaseHashes":[415534662,3813639709,2941618871,877738674],"booleanActivityOptions":{"3757305506":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9100},"2683538554":{"milestoneHash":2683538554,"activities":[{"activityHash":119944200,"challengeObjectiveHashes":[],"phaseHashes":[3864507933,3025298087,1245655652,1245655655],"booleanActivityOptions":{"106117858":true}},{"activityHash":3213556450,"challengeObjectiveHashes":[],"modifierHashes":[1879148438,3704166961],"phaseHashes":[3864507933,3025298087,1245655652,1245655655],"booleanActivityOptions":{"3757305506":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9200},"3181387331":{"milestoneHash":3181387331,"activities":[{"activityHash":2122313384,"challengeObjectiveHashes":[],"phaseHashes":[1126840038,1040714588,4249034918,436847112,2392610624],"booleanActivityOptions":{"106117858":true}},{"activityHash":1661734046,"challengeObjectiveHashes":[],"booleanActivityOptions":{"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9200},"4253138191":{"milestoneHash":4253138191,"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":3000},"3603098564":{"milestoneHash":3603098564,"availableQuests":[{"questItemHash":1866206611}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":3000},"1342567285":{"milestoneHash":1342567285,"activities":[{"activityHash":548750096,"challengeObjectiveHashes":[],"phaseHashes":[566861111,244769953,1268191778],"booleanActivityOptions":{"4140089399":true,"106117858":true}},{"activityHash":2812525063,"challengeObjectiveHashes":[],"booleanActivityOptions":{"4140089399":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9200},"2590427074":{"milestoneHash":2590427074,"activities":[{"activityHash":3333172150,"challengeObjectiveHashes":[],"phaseHashes":[824306255,9235511,3789028322,3307986266],"booleanActivityOptions":{"1997210043":true,"106117858":true}},{"activityHash":960175301,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1997210043":true,"106117858":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9300},"2958665367":{"milestoneHash":2958665367,"availableQuests":[{"questItemHash":4128405278}],"order":300},"3915793660":{"milestoneHash":3915793660,"availableQuests":[{"questItemHash":3491179892}],"order":300},"291994631":{"milestoneHash":291994631,"availableQuests":[{"questItemHash":2245391312}],"order":300},"3802603984":{"milestoneHash":3802603984,"availableQuests":[{"questItemHash":4186783783}],"order":6000},"2709491520":{"milestoneHash":2709491520,"availableQuests":[{"questItemHash":4249625143}],"order":6000},"2594202463":{"milestoneHash":2594202463,"availableQuests":[{"questItemHash":1393241487}],"order":6000},"3899487295":{"milestoneHash":3899487295,"availableQuests":[{"questItemHash":1413813747}],"order":6000},"2712317338":{"milestoneHash":2712317338,"activities":[{"activityHash":2659723068,"challengeObjectiveHashes":[1267016438],"modifierHashes":[2472478405],"phaseHashes":[2158557525,3736477924,1024471091,523815399],"booleanActivityOptions":{"2279894315":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":9300},"1942283261":{"milestoneHash":1942283261,"activities":[{"activityHash":3849697856,"challengeObjectiveHashes":[],"modifierHashes":[2229336658]},{"activityHash":3849697859,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,1151235761,2579871094]},{"activityHash":3849697858,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,939324719,3859784314,2301442403,2579871094]},{"activityHash":3849697861,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,98716109,2834348323,939324719,3859784314,2821775453,2579871094],"booleanActivityOptions":{"494695110":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":5000},"2029743966":{"milestoneHash":2029743966,"activities":[{"activityHash":3849697856,"challengeObjectiveHashes":[],"modifierHashes":[2229336658]},{"activityHash":3849697859,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,1151235761,2579871094]},{"activityHash":3849697858,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,939324719,3859784314,2301442403,2579871094]},{"activityHash":3849697861,"challengeObjectiveHashes":[],"modifierHashes":[2229336658,3933343183,605585258,3605663348,98716109,2834348323,939324719,3859784314,2821775453,2579871094],"booleanActivityOptions":{"494695110":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":5000},"3448738070":{"milestoneHash":3448738070,"activities":[{"activityHash":3577607128,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1719431080":true,"176840106":true}},{"activityHash":1183187383,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1719431080":true,"176840106":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":5000},"4191379729":{"milestoneHash":4191379729,"activities":[{"activityHash":952904835,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":3011324617,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":3633915199,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":2000},"2434762343":{"milestoneHash":2434762343,"activities":[{"activityHash":3176544780,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":2304691867,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":135537449,"challengeObjectiveHashes":[],"booleanActivityOptions":{"871535305":true,"3935220842":true,"176840106":true}},{"activityHash":740891329,"challengeObjectiveHashes":[],"booleanActivityOptions":{"871535305":true,"3935220842":true,"176840106":true}},{"activityHash":1478171612,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}},{"activityHash":914148167,"challengeObjectiveHashes":[],"booleanActivityOptions":{"1407915498":true,"176840106":true}}],"startDate":"2020-02-11T17:00:00Z","endDate":"2020-02-18T17:00:00Z","order":2000}},"ErrorCode":1,"ThrottleSeconds":0,"ErrorStatus":"Success","Message":"Ok","MessageData":{}}'
    }

    public async getPublicMilestones(): Promise<PublicMilestonesAndActivities> {
        if (this.publicMilestonesAndActivities != null) {
            return this.publicMilestonesAndActivities;
        }
        try {
            const resp = await this._publicMsHack();
            // hack to get menagerie burns and public nightfalls
            const resp2 = await this.makeReq('Destiny2/1/Profile/4611686018434964640/?components=CharacterActivities');
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

    public async getCharsTryAllPlatforms(membershipType: number, membershipId: string, components: string[], detailedInv?: boolean): Promise<Player> {
        // try STEAM, then XBL, then PSN then STADIA
        const alreadyTried = {};
        for (const p of Const.PLATFORMS_ARRAY) {
            alreadyTried[p.type + ''] = false;
        }
        let returnMe: Player = null;
        let platformCntr = -1;
        while (returnMe == null && platformCntr < Const.PLATFORMS_ARRAY.length) {
            if (!alreadyTried[membershipType + '']) {
                returnMe = await this.getChars(membershipType, membershipId, components, true, detailedInv);
                alreadyTried[membershipType + ''] = true;
            }
            platformCntr++;
            membershipType = Const.PLATFORMS_ARRAY[platformCntr].type;
        }
        return returnMe;

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
            return this.parseService.parsePlayer(resp, ms, detailedInv, showZeroPtTriumphs, showInvisTriumphs);
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

    public async transfer(membershipType: number, target: Target, item: InventoryItem, isVault: boolean, vault: Vault, bucketService: BucketService, pullFromPostmaster?: boolean): Promise<void> {
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
        } catch (err) {
            this.handleError(err);
            throw new Error('Failed to transfer ' + item.name);
        }
    }


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
