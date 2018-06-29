/**
 * Created by Dave on 12/21/2016.
 */
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import { NotificationService } from './notification.service';
import { environment } from '../../environments/environment';
const XYZ_ROOT: string = "https://www.destinychecklist.net/api/xyz/";
import { Player, Character, Progression } from './model';

@Injectable()
export class XyzService implements OnDestroy {

    private unsubscribe$: Subject<void> = new Subject<void>();

    constructor(private httpClient: HttpClient,
        private notificationService: NotificationService) {
    }
    //https://api.vendorengrams.xyz/getVendorDrops?key=2a35cd994912b3b167741c621f381234


    private static parseVendor(v: any, drops: { [key: string]: number; }): void {
        //Devrim
        if (v.vendor == 0) drops["4235119312"] = v.type;
        //Sloane
        else if (v.vendor == 2) drops["4196149087"] = v.type;
        //Failsafe
        else if (v.vendor == 3) drops["1660497607"] = v.type;
        //Asher
        else if (v.vendor == 4) drops["828982195"] = v.type;
        //Zavala
        else if (v.vendor == 8) drops["611314723"] = v.type;
        //Shaxx
        else if (v.vendor == 9) drops["697030790"] = v.type;
        //Banshee
        else if (v.vendor == 10) drops["1021210278"] = v.type;
        // Ikora Rey	11
        else if (v.vendor == 11) drops["3231773039"] = v.type;
        // Benedict 99-40	12 //lev
        else if (v.vendor == 12) drops["1482334108"] = v.type;
        // Lakshmi-2	13
        else if (v.vendor == 13) drops["1714509342"] = v.type;
        // Executor Hideo	14
        else if (v.vendor == 14) drops["2105209711"] = v.type;
        // Arach Jalaal	15
        else if (v.vendor == 15) drops["3398051042"] = v.type;
        // Lord Saladin	17
        else if (v.vendor == 17) drops["1761642340"] = v.type;
    }

    public updateDrops(player: Player): Promise<any> {
        const self: XyzService = this;

        return this.httpClient.get<any>(XYZ_ROOT + environment.xyzApiKey)
            .toPromise().then(j => {
                const drops: { [key: string]: number; } = {};
                j.forEach(v => {
                    XyzService.parseVendor(v, drops);
                });

                if (player.rankups != null) {
                    player.rankups.forEach(r => {
                        if (drops[r.hash] != null) {
                            r.xyz300 = drops[r.hash] == 2 || drops[r.hash] == 3;
                        }
                    });
                }

                if (player.characters != null) {
                    player.characters.forEach(char => {
                        if (char.factions == null) return;
                        char.factions.forEach(f => {
                            if (drops[f.hash] != null) {
                                f.xyz300 = drops[f.hash] == 2 || drops[f.hash] == 3;
                            }
                        });
                    });
                }
                return j;
            }).catch(
                function (err) {
                    return null;
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


    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}