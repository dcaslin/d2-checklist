import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


export interface Action {
  type: string;
  payload: any;
}


const APP_PREFIX = 'D2STATE-';

@Injectable()
export class StorageService {  
  private settingSub = new Subject();
  public settingFeed: Observable<any>;


  constructor() {
    this.settingFeed = this.settingSub.asObservable() as Observable<Notification>;
  }

  setItem(key: string, value: any) {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
    let emitMe = {};
    emitMe[key] = value; 
    this.settingSub.next(emitMe);
  }

  getItem(key: string, defVal?:any) {
    let val = JSON.parse(localStorage.getItem(`${APP_PREFIX}${key}`));
    if (val==null) return defVal;
  }

  refresh(){
    this.settingSub.next(StorageService.load());
  }

  static load() {
    return Object.keys(localStorage)
      .reduce((state: any, storageKey) => {
        if (storageKey.includes(APP_PREFIX)) {
          state = state || {};
          const stateKey = storageKey.replace(APP_PREFIX, '').toLowerCase()
            .split('.');
          let currentStateRef = state;
          stateKey.forEach((key, index) => {
            if (index === stateKey.length - 1) {
              currentStateRef[key] = JSON
                .parse(localStorage.getItem(storageKey));
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
