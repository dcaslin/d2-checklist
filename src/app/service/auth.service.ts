import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, ResponseContentType, RequestMethod } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable, Subject } from 'rxjs/Rx';
import { NotificationService } from './notification.service';

import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
    private authSub = new Subject();
    public authFeed: Observable<AuthInfo>;

    token: Token;

    constructor(private http: Http, private notificationService: NotificationService) {
        this.authFeed = this.authSub.asObservable() as Observable<AuthInfo>;
    }

    emit() {
        if (this.token == null) {
            this.authSub.next(null);
        }
        else {
            const authInfo: AuthInfo = {
                header: "Bearer " + this.token.access_token,
                memberId: this.token.membership_id
            }
            this.authSub.next(authInfo);
        }
    }

    //called by auth token on Sign-in, assuming token wasn't already valid
    public static reroute() {
        console.log("Rerouting to auth page.");
        let nonce: string = AuthService.randomString(10);
        localStorage.setItem("nonce", nonce);
        let url: string = environment.bungie.authUrl + "?client_id=" + environment.bungie.clientId + "&response_type=code&state=" + nonce;
        console.log(url);
        window.location.href = url;
    }

    //called by auth page sign out
    public signOut() {
        localStorage.removeItem("authorization");
        this.token = null;
        this.emit();
    }

    private storeToken(j: any, cook: boolean) {
        if (cook) AuthService.cookToken(j);
        localStorage.setItem("authorization", JSON.stringify(j));
        this.token = j;
        this.emit();
    }

    private getToken(): Promise<Token> {
        let loadedFromFile = false;
        if (this.token == null) {
            this.token = AuthService.loadTokenFromStorage();
            loadedFromFile = true;
        }

        if (this.token != null) {
            if (AuthService.isValid(this.token)) {
                if (loadedFromFile) {
                    //update all our in-memory friends, things changed
                    this.storeToken(this.token, false)
                }
                return Promise.resolve(this.token);
            }
            else if (AuthService.isValidRefresh(this.token)) {
                return this.refreshToken(this.token.refresh_token);
            }
        }
        //no tokens found or they were completely invalid
        return Promise.resolve(null);
    }

    public getCurrentMemberId(force: boolean): Promise<string> {
        return this.getToken().then((x: Token) => {
            if (x==null){
                if (force==true){
                    AuthService.reroute();
                }
                else{
                    //on initial logon confirm that we got no logons
                    this.emit();
                }
                return null;
            } 
            return x.membership_id;
        });
    }

    //called by lots of things
    public getKey(): Promise<string> {
        return this.getToken().then((x: Token) => {
            if (x==null) return null;
            return x.access_token;
        });
    }

    private refreshToken(refreshKey: string): Promise<Token> {
        let self = this;
        let options = new RequestOptions(
            {
                method: RequestMethod.Post,
                responseType: ResponseContentType.Json,
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-API-Key': environment.bungie.apiKey
                })
            });

        let params = new URLSearchParams();
        params.append('grant_type', "refresh_token");
        params.append('client_id', environment.bungie.clientId);
        params.append('client_secret', environment.bungie.clientSecret);
        params.append('refresh_token', refreshKey);
        let body: string = params.toString();
        return this.http.post("https://www.bungie.net/platform/app/oauth/token/", body, options).map(function (res) {
            let j: Token = res.json();
            self.storeToken(j, true);
            return self.token;
        }).toPromise().catch(
            function (err) {
                let errMsg = AuthService.parseError(err);
                console.log('Error refreshing Auth token: ' + errMsg);
                return null;
            });
    }

    //called by Auth page on redirect from logon
    //returns a msg, not the key
    public fetchTokenFromCode(code: string, state: string): Promise<boolean> {
        const self: AuthService = this;
        let nonce: string = localStorage.getItem("nonce");
        if (nonce != null) {
            if (nonce != state) {
                localStorage.removeItem("nonce");
                throw new Error("State did not match on OAuth call. Security problem?");
            }
        }
        let options = new RequestOptions(
            {
                method: RequestMethod.Post,
                responseType: ResponseContentType.Json,
                headers: new Headers({
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-API-Key': environment.bungie.apiKey
                })
            });

        let params = new URLSearchParams();
        params.append('grant_type', "authorization_code");
        params.append('client_id', environment.bungie.clientId);
        params.append('client_secret', environment.bungie.clientSecret);
        params.append('code', code);
        let body: string = params.toString();

        return this.http.post("https://www.bungie.net/platform/app/oauth/token/", body, options).map(function (res) {
            let j: Token = res.json();
            self.storeToken(j, true);
            return true;
        }).toPromise().catch(
            function (err) {
                let errMsg = AuthService.parseError(err);
                self.notificationService.fail(err);
                console.log('Error getting Auth token: ' + errMsg);
                console.dir(err);
                return false;
            });
    }

    private static cookToken(j: Token): Token {
        j.inception = new Date().getTime();
        j.expiration = j.expires_in * 1000 + j.inception;
        j.refresh_expiration = j.refresh_expires_in * 1000 + j.inception;
        return j;
    }

    private static loadTokenFromStorage(): Token {
        try {
            let sToken = localStorage.getItem("authorization");
            if (sToken != null) {
                console.log("Loading token from local storage");
                return JSON.parse(sToken);
            }
        }
        catch (x) {
            console.log("Error loading token from storage: " + x);
            localStorage.removeItem("authorization");
            console.dir(x);
        }
        return null;
    }


    private static isValid(j: Token): boolean {
        let now: number = new Date().getTime();
        if (now < j.expiration) return true;
        return false;
    }

    private static isValidRefresh(j: Token): boolean {
        let now: number = new Date().getTime();
        if (now < j.refresh_expiration) return true;
        return false;
    }

    private static randomString(length: number): string {

        const possible: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text: string = "";
        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private static parseError(err): string {
        console.dir(err);
        let jsonMsg = null;
        try {
            jsonMsg = err.json().error_description;
        }
        catch (x) { }

        if (jsonMsg != null) {
            return jsonMsg;
        }
        else if (err.status == 0) {
            return "Connection refused, is your internet connection ok?";
        }
        else if (err.message != null) {
            return err.message;
        }

        else if (err.status != null) {
            return (err.status + " " + err.statusText);
        }
        else {
            return "Unexpected problem: " + err;
        }
    }
}

export interface AuthInfo {
    header: string;
    memberId: string;
}

export interface Token {
    //cooked
    inception: number; //((new Date()).getTime()
    expiration: number; //ms of actual
    refresh_expiration: number; //ms of actual

    expires_in: number; //seconds til
    refresh_expires_in: number; //seconds til

    access_token: string;
    token_type: string;
    refresh_token: string;
    membership_id: string;
}