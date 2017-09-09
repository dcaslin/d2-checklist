import { Injectable } from '@angular/core';
import { Headers, Http, RequestOptions, ResponseContentType, RequestMethod } from '@angular/http';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class AuthService {
    //TODO subscribe is authed, for main app page

    valid: boolean = false;
    auth: Auth; 


    constructor(private http: Http) {
    }

    public static reroute() {
        // //debugger;
        // console.log("Rerouting to auth page.");
        // window.location.href = environment.allowAuthUrl;
    }
    

    getKey(): Promise<string> {
        if (this.auth == null) {
            //TODO reroute
          AuthService.reroute();
          return Promise.reject("Not authorized with Bungie.net");;
        }
        if (this.auth.accessToken.isValid()) {
          return Promise.resolve(this.auth.accessToken.value);
        }
        // else if (this.auth.refreshToken.isValid()) {
        //   return this.refreshToken();
        // }
        else {
          AuthService.reroute();
          return Promise.reject("Not authorized with Bungie.net");
        }
      }
    

    signOut() {
        localStorage.removeItem("authorization");
        window.location.reload();
    }

    init(): Promise<boolean> {

        //let self: AuthService = this;
        let sAuth: string = localStorage.getItem("authorization");
        //need to auth
        if (sAuth == null || sAuth.length == 0) {
            this.valid = false;
            return Promise.resolve(false);
        }
        let oAuth: Object = JSON.parse(sAuth);
        let auth: Auth = new Auth(oAuth);
        this.auth = auth; 
        console.dir("Refresh token valid: " + auth.refreshToken.isValid());
        console.dir("Access token valid: " + auth.accessToken.isValid());
        return Promise.resolve(true);
        // return this.getKey();
    }
}


export class Auth {
    accessToken: AccessToken;
    refreshToken: AccessToken;
    scope: number;

    constructor(obj: any) {

        this.scope = obj.scope;
        this.accessToken = new AccessToken(obj.accessToken);
        this.refreshToken = new AccessToken(obj.refreshToken);
    }
}


export class AccessToken {
    public expires: number;
    public readyin: number;
    public value: string;
    public inception: Date;

    constructor(obj: any) {
        this.expires = obj.expires;
        if (obj.readyin)
            this.readyin = obj.readyin;
        else
            this.readyin = null;
        this.value = obj.value;
        this.inception = new Date(obj.inception as string);
    }

    public isValid(): boolean {
        let p: Date = new Date(this.inception.valueOf() + this.expires * 1000 - 1800000);
        let practicalExp: number = p.valueOf();
        let now: number = (new Date()).valueOf();
        //if it's expired it's not good
        if (practicalExp <= now) return false;
        if (this.readyin) {
            let ready: number = new Date(this.inception.valueOf() + this.readyin * 1000).valueOf();
            if (ready >= now) return false;
        }
        return true;
    }
}
