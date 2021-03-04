import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserInfo } from './model';
import { BungieService } from './bungie.service';


export interface Action {
  type: string;
  payload: any;
}


const APP_PREFIX = 'D2STATE-';
const CLAN_MS_KEY = 'hiddenClanMilestones';

@Injectable()
export class StorageService {
  public settingFeed: BehaviorSubject<any> = new BehaviorSubject({});


  constructor(
    private bungieService: BungieService,
  ) {
    const state = StorageService.load();
    if (!state.hiddenClanMilestones) {
      state.hiddenClanMilestones = this.getDefaultHideClanMs();
    }
    this.settingFeed.next(state);
  }

  setItem(key: string, value: any) {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
    const emitMe = this.settingFeed.getValue();
    emitMe[key] = value;
    this.settingFeed.next(emitMe);
  }


  public isDebug(): boolean {
    return this.settingFeed.getValue().debugmode == true;
  }



  public trackHashList(key: string, hash: string) {
    // trackedtriumphs
    const trackedDict: any = this.getItem(key, {});
    trackedDict[hash] = true;
    this.setItem(key, trackedDict);
  }

  public clearHashList(key: string) {
    this.setItem(key, {});
  }

  public untrackHashList(key: string, hash: string) {
    const trackedDict: any = this.getItem(key, {});
    delete trackedDict[hash];
    this.setItem(key, trackedDict);
  }

  public hideMilestone(ms: string): void {
    const clone = this.getItem('hiddenmilestones', []);
    clone.push(ms);
    this.setItem('hiddenmilestones', clone);
  }

  public showAllMilestones(): void {
    this.setItem('hiddenmilestones', []);
  }

  public hideClanMilestone(ms: string): void {
    const clone = this.getItem(CLAN_MS_KEY, []);
    clone.push(ms);
    this.setItem(CLAN_MS_KEY, clone);
  }
  public showDefaultClanMilestones(): void {
    this.setItem(CLAN_MS_KEY, this.getDefaultHideClanMs());
  }

  public getDefaultHideClanMs(): string[] {
    return ['3628293753',
    '2406589846',
    '3628293755',
    '3628293757',
    '1368032265',
    '2540726600',
    '2594202463',
    '1942283261',
    '3802603984',
    '3899487295',
    '2709491520',
    '2712317338',
    '1424672028',
    '291895718',
    '3181387331',
    '3632712541',
    '2953722265',
    '3031052508'
  ];
    // return [
    //   '1342567285',
    //   '3181387331',
    //   '2590427074',
    //   '3312018120',
    // '941217864',
    // '3172444947',
    // '536115997',
    // '1300394968',
    // '3082135827',
    // '2188900244',
    // '2683538554',
    // '2986584050',
    // '3660836525'];
  }

  public showAllClanMilestones(): void {
    this.setItem(CLAN_MS_KEY, []);
  }

  getFavKey(userInfo: UserInfo) {
    return userInfo.membershipType + '-' + userInfo.membershipId;
  }

  async toggleFav(userInfo: UserInfo, bungieMembershipId: string): Promise<void> {
    if (bungieMembershipId == null) {
      const bm = await this.bungieService.getBungieMembershipsById(userInfo.membershipId, userInfo.membershipType);
      if (bm) {
        bungieMembershipId = bm.bungieId;
      }
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

  static load(): any {
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
