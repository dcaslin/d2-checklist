import { Injectable, signal, WritableSignal } from '@angular/core';
import { UserInfo } from '@app/service/model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  public disableAds: WritableSignal<boolean> = signal(false);
  public debugmode: WritableSignal<boolean> = signal(false);
  public favoritesList$: WritableSignal<UserInfo[]> = signal([]);
  public favoritesMap: WritableSignal<{ [id: string]: UserInfo }> = signal({});
  public hiddenMilestones: WritableSignal<string[]> = signal([]);
  public hiddenClanMilestones: WritableSignal<string[]> = signal([]);

  constructor(private storageService: StorageService) {
    this.disableAds.set(this.storageService.getItem('disableads', false));
    this.debugmode.set(this.storageService.getItem('debugmode', false));
    this.storageService.settingFeed.subscribe(x => {
      if (x.disableads != null) {
        this.disableAds.set(x.disableads);
      }
      if (x.debugmode != null) {
        this.debugmode.set(x.debugmode);
      }
      if (x.friends != null) {
        this.favoritesMap.set(x.friends);
        const aFavs: UserInfo[] = [];
        for (const key of Object.keys(x.friends)) {
          aFavs.push(x.friends[key]);
        }
        this.favoritesList$.set(aFavs);
      }
      if (x.hiddenmilestones != null) {
        this.hiddenMilestones.set(x.hiddenmilestones);
      }
      if (x.hiddenClanMilestones != null) {
        this.hiddenClanMilestones.set(x.hiddenClanMilestones);
      }
    });
  }
}
