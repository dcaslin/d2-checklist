/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable } from '@angular/core';
import { Headers, Http, RequestMethod, RequestOptions, ResponseContentType } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { NotificationService } from './notification.service';
import { Player, ParseService } from './parse.service';

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
export interface SearchResult {
    iconPath: string;
    membershipType: number;
    membershipId: string;
    displayName: string;
}


@Injectable()
export class BungieService {

    constructor(private http: Http, private notificationService: NotificationService, private parseService: ParseService) {
    }

    public getPlatforms(): Platform[] {
        return [
            new Platform(2, "PSN", "Playstation"),
            new Platform(1, "XBL", "Xbox"),
            new Platform(4, "BNET", "Battle.net")
        ];

    }

    private static buildPublicReqOptions(): RequestOptions {
        return new RequestOptions(
            {
                method: RequestMethod.Get,
                responseType: ResponseContentType.Json,
                headers: new Headers({
                    'X-API-Key': environment.apiKey
                })
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

    public getChars(p: SearchResult): Promise<Player> {
        const self: BungieService = this;
        return this.http.get(API_ROOT + 'Destiny2/' + p.membershipType + "/Profile/" + p.membershipId + "/?components=Profiles,Characters", BungieService.buildPublicReqOptions())
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
    }

    public searchPlayer(platform: number, gt: string): Promise<SearchResult> {
        const self: BungieService = this;
        return this.http.get(API_ROOT + 'Destiny2/SearchDestinyPlayer/' + platform + "/" + encodeURIComponent(gt) + "/", BungieService.buildPublicReqOptions())
            .map(
            function (res) {
                const j: any = res.json();
                const resp = BungieService.parseBungieResponse(j);
                console.dir(j);
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
    }

}