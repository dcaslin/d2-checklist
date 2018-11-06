
import { takeUntil, first } from 'rxjs/operators';
/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, ReplaySubject } from 'rxjs';

import { NotificationService } from './notification.service';
import { AuthInfo, AuthService } from './auth.service';
import { ParseService } from './parse.service';
import { Player, Character, UserInfo, SelectedUser, ActivityMode, SearchResult, BungieMembership, BungieMember,
    BungieGroupMember, Activity, MileStoneName, Nightfall, LeaderBoardList, ClanRow, MilestoneStatus,
    PublicMilestone, SaleItem, Currency, ClanInfo, PGCR } from './model';

import { environment } from '../../environments/environment';
import { DestinyCacheService } from '@app/service/destiny-cache.service';

const API_ROOT = 'https://www.bungie.net/Platform/';


@Injectable()
export class BungieService implements OnDestroy {
    private selectedUserSub = new ReplaySubject(1);
    public selectedUserFeed: Observable<SelectedUser>;
    private publicMilestones: PublicMilestone[] = null;
    private unsubscribe$: Subject<void> = new Subject<void>();
    authInfo: AuthInfo;
    selectedUser: SelectedUser;
    apiDown = false;

    constructor(private httpClient: HttpClient,
        private notificationService: NotificationService,
        private destinyCacheService: DestinyCacheService,
        private authService: AuthService,
        private parseService: ParseService) {

        this.selectedUserFeed = this.selectedUserSub.asObservable() as Observable<SelectedUser>;
        this.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
            if (selectedUser != null) {
                // //after the fact search for clan
                this.setClans(this.selectedUser.membership);
                // //after the fact currency set
                this.applyCurrencies(this.selectedUser);
            }

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

    public async getBungieMemberById(id: string): Promise<BungieMember> {
        try {
            const opt = await this.buildReqOptions();
            const resp = await this.makeReq('User/GetBungieNetUserById/' + id + '/');
            return this.parseService.parseBungieMember(resp);
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async searchBungieUsers(name: string): Promise<BungieMember[]> {
        try {
            const opt = await this.buildReqOptions();
            const resp = await this.makeReq('User/SearchUsers/?q=' + encodeURIComponent(name));
            return this.parseService.parseBungieMembers(resp);
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }


    public async searchClans(name: string): Promise<ClanInfo> {
        try {
            const opt = await this.buildReqOptions();
            const resp = await this.makeReq('GroupV2/Name/' + encodeURIComponent(name) + '/1/');
            return this.parseService.parseClanInfo(resp.detail);
        } catch (err) {
            this.handleError(err);
            return null;
        }
    }

    public async getAggHistory(char: Character): Promise<void> {
        try {
            const opt = await this.buildReqOptions();
            const resp = await this.makeReq(
                'Destiny2/' + char.membershipType + '/Account/' +
                char.membershipId + '/Character/' + char.characterId +
                '/Stats/AggregateActivityStats/');
            char.aggHistory = this.parseService.parseAggHistory(resp);
            return;
        } catch (err) {
            console.log('Error getting aggregate history for char');
            return;
        }
    }

    public updateAggHistory(chars: Character[]): Promise<void[]> {
        const promises: Promise<void>[] = [];
        chars.forEach(c => {
            const p = this.getAggHistory(c);
            promises.push(p);
        });
        return Promise.all(promises);
    }

    public async updateRaidHistory(msNames: MileStoneName[], chars: Character[], ignoreErrors?: boolean): Promise<void[]> {
        const self: BungieService = this;
        const promises: Promise<void>[] = [];
        chars.forEach(c => {
            const p = this.getActivityHistory(c.membershipType, c.membershipId, c.characterId,
                4, 600, ignoreErrors).then((hist: Activity[]) => {
                self.parseService.parseRaidHistory(msNames, c, hist);
            });
            promises.push(p);
        });
        return Promise.all(promises);
    }

    public updateNfHistory(msNames: MileStoneName[], chars: Character[]): Promise<void[]> {
        const self: BungieService = this;
        const promises: Promise<void>[] = [];
        chars.forEach(c => {
            const p = this.getActivityHistory(c.membershipType, c.membershipId, c.characterId, 47, 99).then((hist: Activity[]) => {
                self.parseService.parsePrestigeNfHistory(msNames, c, hist);
            });
            promises.push(p);
        });
        return Promise.all(promises);
    }

    public async getClanInfo(clanId: string): Promise<any> {
        try {
            const opt = await this.buildReqOptions();
            const resp = await this.makeReq('GroupV2/' + clanId + '/');
            return this.parseService.parseClanInfo(resp.detail);
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }

    // clans never > 100
    public async getClanMembers(clanId: string): Promise<BungieGroupMember[]> {
        try {
            const opt = await this.buildReqOptions();
            const resp = await this.makeReq('GroupV2/' + clanId + '/Members/?currentPage=1&memberType=0');
            return this.parseService.parseClanMembers(resp.results);
        } catch (err) {
            this.handleError(err);
            return [];
        }
    }

    public async getClans(bungieId: string): Promise<ClanRow[]> {
        try {
            const opt = await this.buildReqOptions();
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
        console.log('Applying currencies');
        const self: BungieService = this;
        const tempPlayer = await this.getChars(s.userInfo.membershipType, s.userInfo.membershipId, ['ProfileCurrencies'], true);
        if (tempPlayer == null) {
            console.log('No player to apply currencies to');
            return;
        }
        s.selectedUserCurrencies = tempPlayer.currencies;
        console.log('Applied currencies');

    }

    private setClans(membership: BungieMembership) {
        const self: BungieService = this;
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
            new ActivityMode(64, 'Gambit', 'Gambit'),
            new ActivityMode(4, 'Raid', 'Raid'),
            new ActivityMode(18, 'All Strikes', 'All Strikes'),

            new ActivityMode(46, 'Scored Nightfall', 'Scored Nightfall'),
            new ActivityMode(47, 'Scored Heroic Nightfall', 'Scored Heroic Nightfall'),

            new ActivityMode(5, 'AllPvP', 'All PvP'),
            new ActivityMode(7, 'AllPvE', 'All PvE'),
            new ActivityMode(64, 'AllPvE Comp', 'All PvE Comp'),

            new ActivityMode(32, 'Private Matches', 'Private Matches'),

            new ActivityMode(19, 'Iron Banner', 'Iron Banner'),
            new ActivityMode(39, 'Trials', 'Trials'),
            new ActivityMode(15, 'Crimson Doubles', 'Crimson Doubles'),

            new ActivityMode(10, 'Control', 'Control'),
            new ActivityMode(43, 'Iron Banner Control', 'Iron Banner Control'),
            new ActivityMode(12, 'Clash', 'Clash'),
            new ActivityMode(44, 'Iron Banner Clash', 'Iron Banner Clash'),
            new ActivityMode(31, 'Supremacy', 'Supremacy'),
            new ActivityMode(45, 'Iron Banner Supremacy', 'Iron Banner Supremacy'),
            new ActivityMode(25, 'All Mayhem', 'All Mayhem'),

            new ActivityMode(6, 'Patrol', 'Patrol'),
            new ActivityMode(2, 'Story', 'Story'),

            new ActivityMode(16, 'Nightfall (old)', 'Nightfall (old)'),
            new ActivityMode(17, 'Heroic Nightfall (old)', 'Heroic Nightfall (old)'),
            new ActivityMode(3, 'Strike', 'Strike'),

            new ActivityMode(37, 'Survival', 'Survival'),
            new ActivityMode(38, 'Countdown', 'Countdown'),
            new ActivityMode(40, 'Social', 'Social'),
            new ActivityMode(48, 'Rumble', 'Rumble'),
            new ActivityMode(49, 'All Doubles', 'All Doubles'),
            new ActivityMode(50, 'Doubles', 'Doubles')
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
        console.dir(err);
        if (err.status === 0) {
            this.notificationService.fail('Connection refused, is your internet connection ok?');
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
            const resp = await this.makeReq('Destiny2/Stats/PostGameCarnageReport/' + instanceId + '/');
            return this.parseService.parsePGCR(resp);
        } catch (err) {
            this.handleError(err);
            return null;
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

    public async getPublicMilestones(): Promise<PublicMilestone[]> {
        if (this.publicMilestones != null) {
            return this.publicMilestones;
        }
        try {
            const resp = await this.makeReq('Destiny2/Milestones/');
            const vendorData = this.parseService.parseVendorData(resp);
            const reply = this.parseService.parsePublicMilestones(resp);
            this.publicMilestones = reply;
            return reply;
        } catch (err) {
            this.handleError(err);
            return [];
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

    public getActivityHistory(membershipType: number, membershipId: string,
        characterId: string, mode: number, max: number, ignoreErrors?: boolean): Promise<Activity[]> {
        const self = this;
        const MAX_PAGE_SIZE = 100;
        let curPage = 0;


        return new Promise(function (resolve, reject) {
            const allMatches: any[] = [];
            function processMatches(results: any[]) {
                if (results == null || results.length === 0 || allMatches.length > max) {
                    resolve(allMatches);
                    return;
                } else {
                    curPage++;
                    results.forEach(function (r) {
                        allMatches.push(r);
                    });
                    if (allMatches.length > max) {
                        resolve(allMatches);
                        return;
                    }
                    return self.getActivityHistoryPage(membershipType, membershipId,
                        characterId, mode, curPage, MAX_PAGE_SIZE, ignoreErrors).then(processMatches);
                }
            }
            self.getActivityHistoryPage(membershipType, membershipId, characterId, mode,
                curPage, MAX_PAGE_SIZE, ignoreErrors).then(processMatches).catch((e) => { reject(e) });
        });
    }

    public async getChars(membershipType: number, membershipId: string, components: string[], ignoreErrors?: boolean): Promise<Player> {
        try {
            const sComp = components.join();

            const resp = await this.makeReq('Destiny2/' + membershipType + '/Profile/' +
                membershipId + '/?components=' + sComp);
            let ms: PublicMilestone[] = null;
            if (components.includes('CharacterProgressions')) {
                ms = await this.getPublicMilestones();
            }
            return this.parseService.parsePlayer(resp, ms);
        } catch (err) {
            if (!ignoreErrors) {
                this.handleError(err);
            }
            else{
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

    public async getBungieMembershipsById(bungieId: string, type: number): Promise<BungieMembership> {
        try {
            const resp = await this.makeReq('User/GetMembershipsById/' + bungieId + '/' + type + '/');
            return this.parseService.parseBungieMembership(resp);
        } catch (err) {
            this.handleError(err);
            return null;
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


}
