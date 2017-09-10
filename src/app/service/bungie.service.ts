/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Headers, Http, RequestMethod, RequestOptions, ResponseContentType } from '@angular/http';
import { Observable, Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { NotificationService } from './notification.service';
import { AuthInfo, AuthService } from './auth.service';
import { Player, Character, ParseService, UserInfo } from './parse.service';

import { environment } from '../../environments/environment';

const API_ROOT: string = "https://www.bungie.net/Platform/";

export class Platform {
    name: string;
    type: number;
    desc: string;

    constructor(type: number, name: string, desc: string) {
        this.type = type;
        this.name = name;
        this.desc = desc;
    }
}

export class ActivityMode {
    name: string;
    type: number;
    desc: string;

    constructor(type: number, name: string, desc: string) {
        this.type = type;
        this.name = name;
        this.desc = desc;
    }
}

export interface SearchResult {
    iconPath: string;
    membershipType: number;
    membershipId: string;
    displayName: string;
}

export class SelectedUser {
    selectedUser: UserInfo;
    availUsers: UserInfo[];
}


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
                this.getBungieMembershipsById(ai.memberId).then((memberships: UserInfo[]) => {
                    let selectedUser: SelectedUser = new SelectedUser();
                    selectedUser.availUsers = memberships;

                    if (memberships != null && memberships.length > 0) {
                        //TODO testing
                        let fake: UserInfo = JSON.parse(JSON.stringify(memberships[0]));
                        fake.membershipType = 2;
                        fake.platformName = "PSN";
                        memberships.push(fake);

                        let platform: number = 2;
                        let sPlatform: string = localStorage.getItem("preferredPlatform");
                        if (sPlatform != null) {
                            platform = parseInt(sPlatform);
                        }
                        memberships.forEach(m => {
                            if (m.membershipType == platform) {
                                selectedUser.selectedUser = m;
                            }
                        });
                        if (this.selectedUser == null) {
                            selectedUser.selectedUser = memberships[0];
                        }
                    }
                    this.selectedUser = selectedUser;
                    this.emitUsers();
                });
            }
            else {
                this.selectedUser = null;
                this.emitUsers();
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
            new ActivityMode(5, "AllPvP", "All PvP"),
            new ActivityMode(6, "Patrol", "Patrol"),
            new ActivityMode(7, "AllPvE", "All PvE"),
            new ActivityMode(10, "Control", "Control"),
            new ActivityMode(12, "Team", "Team"),
            new ActivityMode(16, "Nightfall", "Nightfall"),
            new ActivityMode(17, "Heroic", "Heroic"),
            new ActivityMode(18, "Strikes", "All Strikes"),
            new ActivityMode(37, "Survival", "Survival"),
            new ActivityMode(38, "Countdown", "Countdown"),
            new ActivityMode(40, "Social", "Social"),
        ];

    }

    public getPlatforms(): Platform[] {
        return [
            new Platform(2, "PSN", "Playstation"),
            new Platform(1, "XBL", "Xbox"),
            new Platform(4, "BNET", "Battle.net")
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

    public getChars(p: SearchResult): Promise<Player> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'Destiny2/' + p.membershipType + "/Profile/" + p.membershipId + "/?components=Profiles,Characters,CharacterProgressions,CharacterEquipment,CharacterActivities", opt)
                .map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);
                    console.dir(j);

                    return self.parseService.parsePlayer(resp);



                }).toPromise().catch(
                function (err) {
                    console.log('Error Searching for player');
                    self.handleError(err);
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
                    self.notificationService.success("Found " + resp.length + " players");
                    if (resp.length == 0) return null;
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

    private getBungieMembershipsById(bungieId: string): Promise<UserInfo[]> {
        const self: BungieService = this;

        return this.buildReqOptions().then(opt => {
            return this.http.get(API_ROOT + 'User/GetMembershipsById/' + bungieId + "/-1/", opt)
                .map(
                function (res) {
                    const j: any = res.json();
                    const resp = BungieService.parseBungieResponse(j);

                    let aUser: UserInfo[] = [];
                    resp.destinyMemberships.forEach(u => {
                        aUser.push(self.parseService.parseUserInfo(u));
                    });
                    self.notificationService.success("Found " + aUser.length + " players");
                    return aUser;
                }).toPromise().catch(
                function (err) {
                    console.log('Error looking up memberships');
                    self.handleError(err);
                    return [];
                });
        });

    }


    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}