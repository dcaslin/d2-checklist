import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { UserInfo } from './model';
import { BungieService } from './bungie.service';


export interface Action {
  type: string;
  payload: any;
}


const APP_PREFIX = 'D2STATE-';

@Injectable()
export class StorageService {
  private settingSub: BehaviorSubject<any>;
  public settingFeed: Observable<any>;


  constructor(
    private bungieService: BungieService,
  ) {
    this.settingSub = new BehaviorSubject(StorageService.load());
    this.settingFeed = this.settingSub.asObservable() as Observable<Notification>;
  }

  setItem(key: string, value: any) {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
    const emitMe = {};
    emitMe[key] = value;
    this.settingSub.next(emitMe);
  }

  public hideMilestone(ms: string): void {
    const clone = this.getItem('hiddenmilestones', []);
    clone.push(ms);
    this.setItem('hiddenmilestones', clone);
  }

  public showAllMilestones(): void {
    this.setItem('hiddenmilestones', []);
  }

  getFavKey(userInfo: UserInfo) {
    return userInfo.membershipType + '-' + userInfo.membershipId;
  }

  async toggleFav(userInfo: UserInfo, bungieMembershipId: string): Promise<void> {
    if (bungieMembershipId == null) {
      const bm = await this.bungieService.getBungieMembershipsById(userInfo.membershipId, userInfo.membershipType);
      bungieMembershipId = bm.bungieId;
    }
    const key = this.getFavKey(userInfo);
    const favorites: { [id: string]: UserInfo } = this.getItem('friends', {});
    if (favorites[key] !== undefined) {
      delete favorites[key];
    } else {
      favorites[key] = userInfo;
      favorites[key].bungieMembershipId = bungieMembershipId;
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
