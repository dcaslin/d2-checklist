/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Headers, Http, RequestMethod, RequestOptions, ResponseContentType } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { NotificationService } from './notification.service';
import { AuthInfo, AuthService } from './auth.service';
import { ParseService } from './parse.service';
import { Player, Character, UserInfo, SelectedUser, ActivityMode, Platform, SearchResult, BungieMembership, BungieMember, BungieGroupMember } from './model';

import { environment } from '../../environments/environment';

const API_ROOT: string = "https://www.bungie.net/Platform/";


@Injectable()
export class BungieService implements OnDestroy {
    private selectedUserSub = new Subject();
    public selectedUserFeed: Observable<SelectedUser>;

    private unsubscribe$: Subject<void> = new Subject<void>();
    authInfo: AuthInfo;

    selectedUser: SelectedUser;

    constructor(private http: Http,
        private notificationService: NotificationService,
        private authService: AuthService,
        private parseService: ParseService) {

        this.selectedUserFeed = this.selectedUserSub.asObservable() as Observable<SelectedUser>;

        this.authService.authFeed.takeUntil(this.unsubscribe$).subscribe((ai: AuthInfo) => {
            this.authInfo = ai;
            if (ai != null) {
                this.getBungieMembershipsById(ai.memberId).then((membership: BungieMembership) => {
                    if (membership == null || membership.destinyMemberships == null || membership.destinyMemberships.length == 0) {
                        this.authService.signOut();
                        return;
                    }
                    let selectedUser: SelectedUser = new SelectedUser();
                    selectedUser.membership = membership;

                    //TODO testing
                    // let fake: UserInfo = JSON.parse(JSON.stringify(memberships[0]));
                    // fake.membershipType = 2;
                    // fake.platformName = "PSN";
                    // memberships.push(fake);

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
                    if (this.selectedUser == null) {
                        selectedUser.selectedUser = membership.destinyMemberships[0];
                    }
                    this.selectedUser = selectedUser;
                    this.emitUsers();

                    //after the fact search for clan
                    this.setClanId(membership);
                    //after the fact currency check
                    if (selectedUser.selectedUser!=null)
                        this.setCurrencies(selectedUser);
                });
            }
            else {
                this.selectedUser = null;
                this.emitUsers();
            }
        });
    }


    public searchBungieUsers(name: string): Promise<BungieMember[]> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'User/SearchUsers/?q=' + encodeURIComponent(name), opt)
                .map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    return self.parseService.parseBungieMembers(resp);
                }).toPromise().catch(
                function (err) {
                    console.log('Error Searching for player');
                    self.handleError(err);
                    return [];
                });
        });
    }

    //TODO get clan members https://www.bungie.net/Platform/GroupV2/1985678/Members/?currentPage=1&memberType=0


    public getClanInfo(clanId: string): Promise<any>{
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'GroupV2/' + clanId + "/",
                opt).map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    return self.parseService.parseClanInfo(resp.detail);
                }).toPromise().catch(
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
            return this.http.get(API_ROOT + 'GroupV2/' + clanId + "/Members/?currentPage=1&memberType=0",
                opt).map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    return self.parseService.parseClanMembers(resp.results);
                }).toPromise().catch(
                function (err) {
                    console.log("Error finding clan members");
                    console.dir(err);
                    return [];
                });
        });
    }

    public getClanId(bungieId: string): Promise<string> {
        const self: BungieService = this;
        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'GroupV2/User/254/' + bungieId + "/0/1/",
                opt).map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    let clanId = null;
                    resp.results.forEach(r => {
                        if (r.group != null && r.group.groupType == 1) {
                            clanId = r.group.groupId;
                        }
                    });
                    return clanId;
                }).toPromise().catch(
                function (err) {
                    console.log("Error finding clan id");
                    console.dir(err);
                    return null;
                });
        });
    }

    

    private setCurrencies(selUser: SelectedUser) {
        const self: BungieService = this;
        
        this.getChars(selUser.selectedUser.membershipType, selUser.selectedUser.membershipId, ["ProfileCurrencies"]).then(x=>{
            selUser.selectedUserCurrencies = x.currencies;
            self.emitUsers();
        });
    }

    private setClanId(membership: BungieMembership) {
        const self: BungieService = this;
        this.getClanId(membership.bungieId).then(c => {
            if (c != null) {
                membership.clanId = c;
                self.emitUsers();

            }

        });
    }

    public selectUser(u: UserInfo) {
        this.selectedUser.selectedUser = u;
        this.emitUsers();
    }

    private emitUsers() {
        this.selectedUserSub.next(this.selectedUser);
    }

    public getActivityModes(): ActivityMode[] {
        return [
            new ActivityMode(0, "All", "All"), //None
            new ActivityMode(2, "Story", "Story"),
            new ActivityMode(3, "Strike", "Strike"),
            new ActivityMode(4, "Raid", "Raid"),
            new ActivityMode(5, "AllPvP", "All PvP"),
            new ActivityMode(6, "Patrol", "Patrol"),
            new ActivityMode(7, "AllPvE", "All PvE"),
            new ActivityMode(10, "Control", "Control"),
            new ActivityMode(12, "Clash", "Clash"),
            new ActivityMode(16, "Nightfall", "Nightfall"),
            new ActivityMode(17, "Heroic Heroic", "Heroic Nightfall"),
            new ActivityMode(18, "All Strikes", "All Strikes"),
            new ActivityMode(19, "Iron Banner", "Iron Banner"),
            new ActivityMode(31, "Supremacy", "Supremacy"),
            new ActivityMode(37, "Survival", "Survival"),
            new ActivityMode(38, "Countdown", "Countdown"),
            new ActivityMode(38, "Trials", "Trials"),
            new ActivityMode(40, "Social", "Social"),
        ];
    }

    private buildReqOptions(): Promise<RequestOptions> {
        return this.authService.getKey().then(x => {
            if (x == null) {
                return new RequestOptions(
                    {
                        method: RequestMethod.Get,
                        responseType: ResponseContentType.Json,
                        headers: new Headers({
                            'X-API-Key': environment.bungie.apiKey,
                        })
                    });
            } else {
                return new RequestOptions(
                    {
                        method: RequestMethod.Get,
                        responseType: ResponseContentType.Json,
                        headers: new Headers({
                            'X-API-Key': environment.bungie.apiKey,
                            'Authorization': "Bearer " + x
                        })
                    });
            }
        }).catch(err => {
            console.dir(err);
            return new RequestOptions(
                {
                    method: RequestMethod.Get,
                    responseType: ResponseContentType.Json,
                    headers: new Headers({
                        'X-API-Key': environment.bungie.apiKey,
                    })
                });

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

    private static parseBungieResponse(j: any): any {
        if (j.ErrorCode && j.ErrorCode != 1) {
            throw new Error(j.Message);
        }
        if (!j.ErrorCode) {
            throw new Error("Unexpected response from Bungie");
        }
        return j.Response;
    }

    public getActivityHistoryPage(membershipType: number, membershipId: string, characterId: string, mode: number, page: number, count: number): Promise<any[]> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'Destiny2/' + membershipType + "/Account/" + membershipId + "/Character/" + characterId + "/Stats/Activities/?count=" + count + "&mode=" + mode + "&page=" + page,
                opt).map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    if (resp.activities) {
                        console.log(resp.activities.length);

                        return self.parseService.parseActivities(resp.activities);
                    }

                    return [];
                }).toPromise().catch(
                function (err) {
                    console.log('Error Searching for player');
                    self.handleError(err);
                    return [];
                });
        });
    }

    public getPGCR(instanceId: string): Promise<any> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'Destiny2/Stats/PostGameCarnageReport/' + instanceId + "/", opt).map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    return self.parseService.parsePGCR(resp);
                }).toPromise().catch(
                function (err) {
                    console.log('Error Searching for player');
                    self.handleError(err);
                    return null;
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
                }
                else {
                    curPage++;
                    results.forEach(function (r) {
                        allMatches.push(r);
                    });
                    return self.getActivityHistoryPage(membershipType, membershipId, characterId, mode, curPage, MAX_PAGE_SIZE).then(processMatches);
                }
            }
            self.getActivityHistoryPage(membershipType, membershipId, characterId, mode, curPage, MAX_PAGE_SIZE).then(processMatches).catch((e) => { reject(e) });
        });

    }

    public getChars(membershipType: number, membershipId: string, components: string[], ignoreErrors?:boolean): Promise<Player> {
        const self: BungieService = this;
//CharacterEquipment
//Profiles,Characters,CharacterProgressions,,CharacterActivities
        let sComp = components.join();
        console.log("Components: "+sComp);
        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'Destiny2/' +membershipType + "/Profile/" +
            membershipId +
                
                "/?components="+sComp, opt)
                .map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    return self.parseService.parsePlayer(resp);
                }).toPromise().catch(
                function (err) {
                    console.log('Error Searching for player');
                    if (!ignoreErrors){
                        self.handleError(err);
                    }
                    return null;
                });
        });

    }

    public searchPlayer(platform: number, gt: string): Promise<SearchResult> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'Destiny2/SearchDestinyPlayer/' + platform + "/" + encodeURIComponent(gt) + "/", opt)
                .map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    //self.notificationService.success("Found " + resp.length + " players");
                    if (resp.length == 0) {
                        //self.notificationService.fail("No player found for " + gt + ". Typo? Try another platform?");
                        return null;
                    }
                    if (resp.length > 1) {
                        self.notificationService.info("Found more than one player for gamertag. Please contact /u/dweezil22 on reddit to tell him!");
                    }
                    return resp[0];

                }).toPromise().catch(
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
            return this.http.get(API_ROOT + 'User/GetMembershipsById/' + bungieId + "/-1/", opt)
                .map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);

                    return self.parseService.parseBungieMembership(resp);
                }).toPromise().catch(
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