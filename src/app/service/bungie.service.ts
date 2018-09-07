
import { takeUntil, first } from 'rxjs/operators';
/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

import { NotificationService } from './notification.service';
import { AuthInfo, AuthService } from './auth.service';
import { ParseService } from './parse.service';
import { Player, Character, UserInfo, SelectedUser, ActivityMode, Platform, SearchResult, BungieMembership, BungieMember, BungieGroupMember, Activity, MileStoneName, Nightfall, LeaderBoardList, ClanRow, MilestoneStatus, MotResponse, PublicMilestone, SaleItem } from './model';

import { environment } from '../../environments/environment';
import { DestinyCacheService } from '@app/service/destiny-cache.service';

const API_ROOT: string = "https://www.bungie.net/Platform/";


@Injectable()
export class BungieService implements OnDestroy {
    private selectedUserSub = new BehaviorSubject(null);
    public selectedUserFeed: Observable<SelectedUser>;

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

        this.authService.authFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((ai: AuthInfo) => {
            this.authInfo = ai;
            if (ai != null) {
                this.getBungieMembershipsById(ai.memberId).then((membership: BungieMembership) => {
                    if (membership == null || membership.destinyMemberships == null || membership.destinyMemberships.length == 0) {
                        console.log("No membership found for id, signing out.");
                        this.authService.signOut();
                        return;
                    }
                    let selectedUser: SelectedUser = new SelectedUser();
                    selectedUser.membership = membership;

                    //For testing, add a fake PSN account
                    // let fake: UserInfo = JSON.parse(JSON.stringify(membership.destinyMemberships[0]));
                    // fake.membershipType = 2;
                    // fake.platformName = "PSN";
                    // membership.destinyMemberships.push(fake);

                    let platform: number = 2;
                    let sPlatform: string = localStorage.getItem("preferredPlatform");
                    if (sPlatform != null) {
                        platform = parseInt(sPlatform);
                    }
                    membership.destinyMemberships.forEach(m => {
                        if (m.membershipType == platform) {
                            selectedUser.selectedUser = m;
                        }
                    });
                    if (selectedUser.selectedUser == null) {
                        selectedUser.selectedUser = membership.destinyMemberships[0];
                    }
                    this.selectedUser = selectedUser;
                    this.emitUsers();

                    //after the fact search for clan
                    this.setClans(membership);
                });
            }
            else {
                this.selectedUser = null;
                this.emitUsers();
            }
        });
    }


    public async getMots(platform: number, memberId: string): Promise<MotResponse> {
        try{
            let opt = await this.buildReqOptions();
            let hResp = await this.httpClient.get<any>(API_ROOT + "Destiny2/" + platform + "/Triumphs/" + memberId+"/", opt).toPromise();
            const resp = this.parseBungieResponse(hResp);
            return resp;
        }
        catch (err){
            console.log('Error grabbing Mots for player');
            this.handleError(err);
            return null;
        }
    }



    public refreshCurrency() {
        if (this.selectedUser != null) {
            this.setCurrencies();
        }
        else{ 
            console.log("Selected currency but no user");           
            this.selectedUserFeed.pipe(first()).subscribe((selectedUser: SelectedUser) => {
                if (this.selectedUser != null) {
                    this.setCurrencies();
                }
            });
        }
    }

    public async searchBungieUsers(name: string): Promise<BungieMember[]> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'User/SearchUsers/?q=' + encodeURIComponent(name), opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    return self.parseService.parseBungieMembers(resp);
                }).catch(
                    function (err) {
                        console.log('Error Searching for player');
                        self.handleError(err);
                        return [];
                    });
        });
    }


    public getAggHistory(char: Character): Promise<void> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'Destiny2/' + char.membershipType + "/Account/" + char.membershipId + "/Character/" + char.characterId + "/Stats/AggregateActivityStats/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    char.aggHistory = self.parseService.parseAggHistory(resp);
                    return;
                }).catch(
                    function (err) {
                        console.log('Error getting aggregate history for char');
                        //self.handleError(err);
                        return;
                    });
        });
    }

    public updateAggHistory(chars: Character[]): Promise<void[]> {
        let promises: Promise<void>[] = [];

        chars.forEach(c => {
            let p = this.getAggHistory(c);
            promises.push(p);
        });
        return Promise.all(promises);
    }

    public updateRaidHistory(msNames: MileStoneName[], chars: Character[]): Promise<void[]> {

        const self: BungieService = this;
        let promises: Promise<void>[] = [];

        let raidMilestoneName: MileStoneName = null;
        msNames.forEach(m => {
            if (m.key == "3660836525") {
                raidMilestoneName = m;
            }
        });
        if (raidMilestoneName == null) return Promise.resolve(void []);

        chars.forEach(c => {
            let p = this.getActivityHistory(c.membershipType, c.membershipId, c.characterId, 4, 600).then((hist: Activity[]) => {
                self.parseService.parseRaidHistory(msNames, c, hist);
            });
            promises.push(p);
        });

        return Promise.all(promises);

    }

    public updateNfHistory(msNames: MileStoneName[], chars: Character[]): Promise<void[]> {
        const self: BungieService = this;
        let promises: Promise<void>[] = [];
        chars.forEach(c => {
            let p = this.getActivityHistory(c.membershipType, c.membershipId, c.characterId, 47, 99).then((hist: Activity[]) => {
                self.parseService.parsePrestigeNfHistory(msNames, c, hist);
            });
            promises.push(p);
        });
        return Promise.all(promises);
    }


    // Aggregate clan info: 
    // https://www.bungie.net/Platform//Destiny2/Stats/AggregateClanStats/1985678

    public getClanStats(clanId: string): Promise<void> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + '/Destiny2/Stats/AggregateClanStats/' + clanId + "/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    //array of 
                    // {
                    //     "mode": 7,
                    //     "statId": "lbSingleGameKills",
                    //     "value": {
                    //         "basic": {
                    //             "value": 0,
                    //             "displayValue": "729"
                    //         }
                    //     }
                    // }
                    return resp;
                }).catch(
                    function (err) {
                        console.log("Error finding clan members");
                        self.handleError(err);
                        return null;
                    });
        });
    }


    // Leaderboards
    // https://www.bungie.net/Platform/ Destiny2/Stats/Leaderboards/Clans/1985678

    //https://www.bungie.net/Platform/Destiny2/Stats/Leaderboards/Clans/1985678?maxtop=100&modes=2,4

    public getClanLeaderboards(clanId: string, max: number, mode: number): Promise<LeaderBoardList[]> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'Destiny2/Stats/Leaderboards/Clans/' + clanId + "/?maxtop=" + max + "&modes=" + mode, opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    return self.parseService.parseLeaderBoard(resp);
                }).catch(
                    function (err) {
                        console.log("Error finding clan members");
                        self.handleError(err);
                        return null;
                    });
        });
    }

    //get clan members https://www.bungie.net/Platform/GroupV2/1985678/Members/?currentPage=1&memberType=0
    public getClanInfo(clanId: string): Promise<any> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'GroupV2/' + clanId + "/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    return self.parseService.parseClanInfo(resp.detail);
                }).catch(
                    function (err) {
                        console.log("Error finding clan members");
                        console.dir(err);
                        return [];
                    });
        });
    }

    //clans never > 100
    public getClanMembers(clanId: string): Promise<BungieGroupMember[]> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'GroupV2/' + clanId + "/Members/?currentPage=1&memberType=0", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    return self.parseService.parseClanMembers(resp.results);
                }).catch(
                    function (err) {
                        console.log("Error finding clan members");
                        self.handleError(err);
                        return [];
                    });
        });
    }


    public async getClans(bungieId: string): Promise<ClanRow[]> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'GroupV2/User/254/' + bungieId + "/0/1/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    let returnMe: ClanRow[] = [];
                    resp.results.forEach(r => {
                        if (r.group != null && r.group.groupType == 1) {
                            returnMe.push(new ClanRow(r.group.name, r.group.groupId));
                        }
                    });
                    return returnMe;
                }).catch(
                    function (err) {
                        console.log("Error finding clan id");
                        self.handleError(err);
                        return [];
                    });
        });
    }



    private setCurrencies() {
        const self: BungieService = this;

        this.getChars(this.selectedUser.selectedUser.membershipType, this.selectedUser.selectedUser.membershipId, ["ProfileCurrencies"]).then(x => {
            if (x != null) {
                this.selectedUser.selectedUserCurrencies = x.currencies;

            } else {
                this.selectedUser.selectedUserCurrencies = null;
            }
            // self.emitUsers();
        });
    }

    private setClans(membership: BungieMembership) {
        const self: BungieService = this;
        this.getClans(membership.bungieId).then(c => {
            if (c != null) {
                membership.clans = c;
                // self.emitUsers();
            }

        });
    }

    public selectUser(u: UserInfo) {
        this.selectedUser.selectedUser = u;
        localStorage.setItem("preferredPlatform", "" + u.membershipType);
        this.refreshCurrency();
        this.emitUsers();
    }

    private emitUsers() {
        this.selectedUserSub.next(this.selectedUser);
    }

    public getActivityModes(): ActivityMode[] {
        return [
            new ActivityMode(0, "All", "All"), //None
            new ActivityMode(4, "Raid", "Raid"),
            new ActivityMode(18, "All Strikes", "All Strikes"),

            new ActivityMode(46, "Scored Nightfall", "Scored Nightfall"),
            new ActivityMode(47, "Scored Heroic Nightfall", "Scored Heroic Nightfall"),

            new ActivityMode(5, "AllPvP", "All PvP"),
            new ActivityMode(7, "AllPvE", "All PvE"),

            new ActivityMode(32, "Private Matches", "Private Matches"),


            new ActivityMode(19, "Iron Banner", "Iron Banner"),
            new ActivityMode(39, "Trials", "Trials"),
            new ActivityMode(15, "Crimson Doubles", "Crimson Doubles"),

            new ActivityMode(10, "Control", "Control"),
            new ActivityMode(43, "Iron Banner Control", "Iron Banner Control"),
            new ActivityMode(12, "Clash", "Clash"),
            new ActivityMode(44, "Iron Banner Clash", "Iron Banner Clash"),
            new ActivityMode(31, "Supremacy", "Supremacy"),
            new ActivityMode(45, "Iron Banner Supremacy", "Iron Banner Supremacy"),
            new ActivityMode(25, "All Mayhem", "All Mayhem"),

            new ActivityMode(6, "Patrol", "Patrol"),
            new ActivityMode(2, "Story", "Story"),

            new ActivityMode(16, "Nightfall (old)", "Nightfall (old)"),
            new ActivityMode(17, "Heroic Nightfall (old)", "Heroic Nightfall (old)"),
            new ActivityMode(3, "Strike", "Strike"),

            new ActivityMode(37, "Survival", "Survival"),
            new ActivityMode(38, "Countdown", "Countdown"),
            new ActivityMode(40, "Social", "Social"),
            new ActivityMode(48, "Rumble", "Rumble"),
            new ActivityMode(49, "All Doubles", "All Doubles"),
            new ActivityMode(50, "Doubles", "Doubles")
        ];
    }

    private buildReqOptions(): Promise<any> {


        let headers = new HttpHeaders();
        headers = headers
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('X-API-Key', environment.bungie.apiKey);
        const httpOptions = {
            headers: headers
        };


        return this.authService.getKey().then(x => {
            if (x == null) {
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
                    .set('Authorization', "Bearer " + x);
                return {
                    headers: headers
                };
            }
        }).catch(err => {
            console.dir(err);
            let headers = new HttpHeaders();
            headers = headers
                .set('X-API-Key', environment.bungie.apiKey);
            return {
                headers: headers
            };
        });
    }

    private handleError(err) {
        console.dir(err);
        if (err.status == 0) {
            this.notificationService.fail("Connection refused, is your internet connection ok?");
        }
        else if (err.message != null) {
            this.notificationService.fail(err.message);
        }
        else if (err.status != null) {
            this.notificationService.fail(err.status + " " + err.statusText);
        }
        else {
            this.notificationService.fail("Unexpected problem: " + err);
        }
    }

    private parseBungieResponse(j: any): any {
        if (j.ErrorCode && j.ErrorCode != 1) {
            if (j.ErrorCode === 5) {
                this.apiDown = true;
            }
            throw new Error(j.Message);
        }
        if (!j.ErrorCode) {
            throw new Error("Unexpected response from Bungie");
        }
        this.apiDown = false;
        return j.Response;
    }


    public getPGCR(instanceId: string): Promise<any> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'Destiny2/Stats/PostGameCarnageReport/' + instanceId + "/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    return self.parseService.parsePGCR(resp);
                }).catch(
                    function (err) {
                        console.log('Error Searching for player');
                        self.handleError(err);
                        return null;
                    });
        });
    }

    public async loadVendors(c: Character): Promise<SaleItem[]>{
        let opt = await this.buildReqOptions();
        let hResp = await this.httpClient.get<any>(API_ROOT + 'Destiny2/'+c.membershipType+'/Profile/'+c.membershipId+'/Character/'+c.characterId+'/Vendors/?components=Vendors,VendorSales,ItemInstances,ItemObjectives,ItemStats,ItemSockets,ItemTalentGrids,ItemCommonData,ItemPlugStates', opt).toPromise();
        const resp = this.parseBungieResponse(hResp);
        const vendorData = this.parseService.parseVendorData(resp);
        console.dir(vendorData);
        return vendorData;
    }

    public async getPublicMilestones(): Promise<PublicMilestone[]>{
        try{
            let opt = await this.buildReqOptions();
            let hResp = await this.httpClient.get<any>(API_ROOT + 'Destiny2/Milestones/', opt).toPromise();
            const resp = this.parseBungieResponse(hResp);
            const reply = this.parseService.parsePublicMilestones(resp);
            return reply;
        }
        catch (err){
            console.log('Error getting public milestones');
            console.dir(err);
            return null;
        }
    }

    public getActivityHistoryPage(membershipType: number, membershipId: string, characterId: string, mode: number, page: number, count: number): Promise<Activity[]> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'Destiny2/' + membershipType + "/Account/" + membershipId + "/Character/" + characterId + "/Stats/Activities/?count=" + count + "&mode=" + mode + "&page=" + page, opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    if (resp.activities) {
                        return self.parseService.parseActivities(resp.activities);
                    }

                    return [];
                }).catch(
                    function (err) {
                        console.log('Error Searching for player');
                        self.handleError(err);
                        return [];
                    });
        });
    }

    public getActivityHistory(membershipType: number, membershipId: string, characterId: string, mode: number, max: number): Promise<any[]> {
        let self = this;
        const MAX_PAGE_SIZE: number = 100;
        let curPage: number = 0;

        return new Promise(function (resolve, reject) {
            let allMatches: any[] = [];

            function processMatches(results: any[]) {
                if (results == null || results.length == 0 || allMatches.length > max) {
                    resolve(allMatches);
                    return;
                }
                else {
                    curPage++;
                    results.forEach(function (r) {
                        allMatches.push(r);
                    });

                    if (allMatches.length > max) {
                        resolve(allMatches);
                        return;
                    }

                    return self.getActivityHistoryPage(membershipType, membershipId, characterId, mode, curPage, MAX_PAGE_SIZE).then(processMatches);
                }
            }
            self.getActivityHistoryPage(membershipType, membershipId, characterId, mode, curPage, MAX_PAGE_SIZE).then(processMatches).catch((e) => { reject(e) });
        });

    }

    public async getChars(membershipType: number, membershipId: string, components: string[], ignoreErrors?: boolean): Promise<Player> {
        const self: BungieService = this;
        //CharacterEquipment
        //Profiles,Characters,CharacterProgressions,,CharacterActivities
        let sComp = components.join();
        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'Destiny2/' + membershipType + "/Profile/" + membershipId + "/?components=" + sComp, opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    return self.parseService.parsePlayer(resp);
                }).catch(
                    function (err) {
                        console.log('Error Searching for player');
                        if (!ignoreErrors) {
                            self.handleError(err);
                        }
                        return null;
                    });
        });

    }

    public searchPlayer(platform: number, gt: string): Promise<SearchResult> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'Destiny2/SearchDestinyPlayer/' + platform + "/" + encodeURIComponent(gt) + "/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);
                    //self.notificationService.success("Found " + resp.length + " players");
                    if (resp.length == 0) {
                        //self.notificationService.fail("No player found for " + gt + ". Typo? Try another platform?");
                        return null;
                    }
                    if (resp.length > 1) {
                        for (let item of resp){
                            if (item.displayName == gt){
                                return item;
                            }
                        }
                        return resp[0];
                        // return resp[resp.length - 1];
                        //self.notificationService.info("Found more than one player for gamertag. Please contact /u/dweezil22 on reddit to tell him!");
                    }
                    //hack for 2/informer  broken account
                    if (resp.length == 1 && resp[0].membershipId == '4611686018465893351') {
                        resp[0].membershipId = '4611686018428560404';
                    }



                    return resp[0];

                }).catch(
                    function (err) {
                        console.log('Error Searching for player');
                        self.handleError(err);
                        return null;
                    });
        });

    }

    public getBungieMembershipsById(bungieId: string): Promise<BungieMembership> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.httpClient.get<any>(API_ROOT + 'User/GetMembershipsById/' + bungieId + "/-1/", opt)
                .toPromise().then(j => {
                    const resp = self.parseBungieResponse(j);

                    return self.parseService.parseBungieMembership(resp);
                }).catch(
                    function (err) {
                        console.log('Error looking up memberships');
                        self.handleError(err);
                        return null;
                    });
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}