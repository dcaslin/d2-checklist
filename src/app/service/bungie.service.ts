/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable } from '@angular/core';
import { Headers, Http, RequestMethod, RequestOptions, ResponseContentType } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { NotificationService } from '../service/notification.service';

import { environment } from '../../environments/environment';

const API_ROOT: string = "https://www.bungie.net/Platform/";

export class Platform{
    name: string;
    type: number;
    desc: string;

    constructor(type: number, name: string, desc: string){
        this.type = type;
        this.name = name;
        this.desc = desc;
    }
}


@Injectable()
export class BungieService {



    constructor(private http: Http, private notificationService: NotificationService) {
    }

    public getPlatforms(): Platform[]{
        return [
            new Platform(2, "PSN", "Playstation"),
            new Platform(1, "XBL", "Xbox"),
            new Platform(3, "BNET", "Battle.net")
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


    public searchPlayer(platform: number, gt: string): Promise<void> {
        const self: BungieService = this;

        
        // return this.http.get(
        //     "https://www.bungie.net/Platform/Destiny2/2/Profile/4611686018452182455/?components=100"
            //"https://www.bungie.net/Platform/Destiny2/1/Profile/4611686018434964640/?components=100"
            //, BungieService.buildPublicReqOptions())
        //return this.http.get("https://www.bungie.net/Platform/Destiny2/2/Profile/4611686018452182455?components=Profiles,Characters", BungieService.buildPublicReqOptions())
        //return this.http.get("https://www.bungie.net/D1/Platform/Destiny/1/Account/4611686018434964640/", BungieService.buildPublicReqOptions())
        return this.http.get(API_ROOT + 'Destiny2/SearchDestinyPlayer/' + platform + "/" + encodeURIComponent(gt)+"/", BungieService.buildPublicReqOptions())
            .map(
            function (res) {
                const j: any = res.json();
                console.dir(j);
            }).toPromise().catch(
            function (err) {
                console.log('Error Searching for player');
                self.handleError(err);
            });
    }

}