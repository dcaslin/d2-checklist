import { Injectable } from '@angular/core';
import { UserInfo } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  public disableAds = new BehaviorSubject<boolean>(false);
  public debugmode = new BehaviorSubject<boolean>(false);
  public favoritesList$ = new BehaviorSubject<UserInfo[]>([]);
  public favoritesMap = new BehaviorSubject<{ [id: string]: UserInfo }>({});
  public hiddenMilestones = new BehaviorSubject<string[]>([]);
  public hiddenClanMilestones = new BehaviorSubject<string[]>([]);

  constructor(private storageService: StorageService) {
    this.disableAds.next(this.storageService.getItem('disableads', false));
    this.debugmode.next(this.storageService.getItem('debugmode', false));
    this.storageService.settingFeed.subscribe(x => {
      if (x.disableads != null) {
        this.disableAds.next(x.disableads);
      }
      if (x.debugmode != null) {
        this.debugmode.next(x.debugmode);
      }
      if (x.friends != null) {
        this.favoritesMap.next(x.friends);
        const aFavs: UserInfo[] = [];
        for (const key of Object.keys(x.friends)) {
          aFavs.push(x.friends[key]);
        }
        this.favoritesList$.next(aFavs);
      }
      if (x.hiddenmilestones != null) {
        this.hiddenMilestones.next(x.hiddenmilestones);
      }
      if (x.hiddenClanMilestones != null) {
        this.hiddenClanMilestones.next(x.hiddenClanMilestones);
      }
    });
  }
}
