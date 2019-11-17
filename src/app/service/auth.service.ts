import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';


@Injectable()
export class AuthService {
    private authSub = new Subject();
    public authFeed: Observable<AuthInfo>;

    token: Token;

    constructor(private httpClient: HttpClient, private notificationService: NotificationService) {
        this.authFeed = this.authSub.asObservable() as Observable<AuthInfo>;
    }

    emit() {
        if (this.token == null) {
            this.authSub.next(null);
        } else {
            const authInfo: AuthInfo = {
                header: 'Bearer ' + this.token.access_token,
                memberId: this.token.membership_id
            };
            this.authSub.next(authInfo);
        }
    }

    // called by auth token on Sign-in, assuming token wasn't already valid
    public static reroute() {
        console.log('Rerouting to auth page.');
        const nonce: string = AuthService.randomString(10);
        localStorage.setItem('nonce', nonce);
        const url: string = environment.bungie.authUrl + '?client_id=' + environment.bungie.clientId + '&response_type=code&state=' + nonce;
        window.location.href = url;
    }

    // called by auth page sign out
    public signOut() {
        console.log('Signing out, deleting authorization');
        localStorage.removeItem('authorization');
        localStorage.removeItem('D2STATE-preferredPlatform');
        this.token = null;
        this.emit();
    }

    private storeToken(j: any, cook: boolean) {
        if (cook) { AuthService.cookToken(j); }
        localStorage.setItem('authorization', JSON.stringify(j));
        this.token = j;
        this.emit();
    }

    private async getToken(): Promise<Token> {
        try {
            let loadedFromFile = false;
            if (this.token == null) {
                this.token = AuthService.loadTokenFromStorage();
                loadedFromFile = true;
            }
            if (this.token != null) {
                if (AuthService.isValid(this.token)) {
                    if (loadedFromFile) {
                        // update all our in-memory data, things changed
                        this.storeToken(this.token, false);
                    }
                    return this.token;
                } else if (AuthService.isValidRefresh(this.token)) {
                    return await this.refreshToken(this.token.refresh_token);
                } else {
                    throw new Error('No valid refresh token');
                }
            }
            // no tokens found or they were completely invalid
            return Promise.resolve(null);
        } catch (exc) {
            let msg = 'Unknown error';
            if (exc.error && exc.error.error_description) {
                msg = exc.error.error_description;
            } else if (exc.message) {
                msg = exc.message;
            }
            this.notificationService.fail('Error authorizing to Bungie, please sign on again: ' + msg);
            this.signOut();
            return null;
        }
    }

    public async getCurrentMemberId(force: boolean): Promise<string> {
        const x = await this.getToken();
        if (x == null) {
            if (force === true) {
                AuthService.reroute();
            } else {
                // on initial logon confirm that we got no logons
                this.emit();
            }
            return null;
        }
        return x.membership_id;
    }

    // called by lots of things
    public async getKey(): Promise<string> {
        const x = await this.getToken();
        if (x == null) { return null; }
        return x.access_token;
    }

    private async refreshToken(refreshKey: string): Promise<Token> {
        let headers = new HttpHeaders();
        headers = headers
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('X-API-Key', environment.bungie.apiKey);
        const httpOptions = {
            headers: headers
        };

        let params = new HttpParams();
        params = params.set('grant_type', 'refresh_token');
        params = params.set('client_id', environment.bungie.clientId);
        params = params.set('client_secret', environment.bungie.clientSecret);
        params = params.set('refresh_token', refreshKey);
        const j = await this.httpClient.post('https://www.bungie.net/platform/app/oauth/token/',
            params, httpOptions).toPromise();
        this.storeToken(j, true);
        return this.token;
    }

    // called by Auth page on redirect from logon
    // returns a msg, not the key
    public async fetchTokenFromCode(code: string, state: string): Promise<boolean> {
        const nonce: string = localStorage.getItem('nonce');
        if (nonce != null) {
            if (nonce !== state) {
                localStorage.removeItem('nonce');
                throw new Error('State did not match on OAuth call. Security problem?');
            }
        }

        let headers = new HttpHeaders();
        headers = headers
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .set('X-API-Key', environment.bungie.apiKey);
        const httpOptions = {
            headers: headers
        };

        let params = new HttpParams();
        params = params.set('grant_type', 'authorization_code');
        params = params.set('client_id', environment.bungie.clientId);
        params = params.set('client_secret', environment.bungie.clientSecret);
        params = params.set('code', code);

        try {
            const j = await this.httpClient.post('https://www.bungie.net/platform/app/oauth/token/', params, httpOptions).toPromise();
            this.storeToken(j, true);
            return true;
        } catch (err) {
            const errMsg = AuthService.parseError(err);
            this.notificationService.fail(err);
            throw (errMsg);
        }
    }

    private static cookToken(j: Token): Token {
        j.inception = new Date().getTime();
        j.expiration = j.expires_in * 1000 + j.inception;
        j.refresh_expiration = j.refresh_expires_in * 1000 + j.inception;
        return j;
    }

    private static loadTokenFromStorage(): Token {
        try {
            const sToken = localStorage.getItem('authorization');
            if (sToken != null) {
                return JSON.parse(sToken);
            }
        } catch (err) {
            console.log('Error loading token from storage: ' + err);
            localStorage.removeItem('authorization');
            console.dir(err);
        }
        return null;
    }


    private static isValid(j: Token): boolean {
        const now: number = new Date().getTime();
        if (now < j.expiration) { return true; }
        return false;
    }

    private static isValidRefresh(j: Token): boolean {
        const now: number = new Date().getTime();
        if (now < j.refresh_expiration) { return true; }
        return false;
    }

    private static randomString(length: number): string {

        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';
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
        } catch (x) { }

        if (jsonMsg != null) {
            return jsonMsg;
        } else if (err.status === 0) {
            return 'Connection refused, is your internet connection ok?';
        } else if (err.message != null) {
            return err.message;
        } else if (err.status != null) {
            return (err.status + ' ' + err.statusText);
        } else {
            return 'Unexpected problem: ' + err;
        }
    }
}

export interface AuthInfo {
    header: string;
    memberId: string;
}

export interface Token {
    // cooked
    inception: number; // ((new Date()).getTime()
    expiration: number; // ms of actual
    refresh_expiration: number; // ms of actual

    expires_in: number; // seconds til
    refresh_expires_in: number; // seconds til

    access_token: string;
    token_type: string;
    refresh_token: string;
    membership_id: string;
}
