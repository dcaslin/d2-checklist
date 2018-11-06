import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { UserInfo } from './model';


export interface Action {
  type: string;
  payload: any;
}


const APP_PREFIX = 'D2STATE-';

@Injectable()
export class StorageService {
  private settingSub: BehaviorSubject<any>;
  public settingFeed: Observable<any>;


  constructor() {
    this.settingSub =  new BehaviorSubject(StorageService.load());
    this.settingFeed = this.settingSub.asObservable() as Observable<Notification>;
  }

  setItem(key: string, value: any) {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
    const emitMe = {};
    emitMe[key] = value;
    this.settingSub.next(emitMe);
  }

  getFavKey(userInfo: UserInfo) {
    return userInfo.membershipType + '-' + userInfo.membershipId;
  }

  toggleFav(userInfo: UserInfo) {
    const key = this.getFavKey(userInfo);
    const favorites: { [id: string]: UserInfo}  = this.getItem('friends', {});
    if (favorites[key] !== undefined) {
      delete favorites[key];
    } else {
      favorites[key] = userInfo;
    }
    this.setItem('friends', favorites);
  }

  getItem(key: string, defVal?: any) {
    const val = JSON.parse(localStorage.getItem(`${APP_PREFIX}${key}`));
    if (val == null) { return defVal; }
    return val;
  }

  static load() {
    console.log('Loading local storage');
    return Object.keys(localStorage)
      .reduce((state: any, storageKey) => {
        if (storageKey.includes(APP_PREFIX)) {
          state = state || {};
          const stateKey = storageKey.replace(APP_PREFIX, '').toLowerCase()
            .split('.');
          let currentStateRef = state;
          stateKey.forEach((key, index) => {
            if (index === stateKey.length - 1) {
              currentStateRef[key] = JSON.parse(localStorage.getItem(storageKey));
              return;
            }
            currentStateRef[key] = currentStateRef[key] || {};
            currentStateRef = currentStateRef[key];
          });
        }
        return state;
      }, {});
  }

}
