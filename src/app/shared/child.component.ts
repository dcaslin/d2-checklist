
import { Component, OnDestroy } from '@angular/core';
import { UserInfo } from '@app/service/model';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../service/storage.service';


@Component({
    selector: 'd2c-child',
    template: `<div>Abstract</div>`
})
export class ChildComponent implements OnDestroy {
    unsubscribe$: Subject<void> = new Subject<void>();
    public favoritesList$: BehaviorSubject<UserInfo[]> = new BehaviorSubject([]);
    public favoritesMap: BehaviorSubject<{ [id: string]: UserInfo }> = new BehaviorSubject({});
    public disableAds: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public debugmode: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public hiddenMilestones: BehaviorSubject<string[]> = new BehaviorSubject([]);
    public hiddenClanMilestones: BehaviorSubject<string[]> = new BehaviorSubject([]);
    storageService: StorageService;

    constructor(storageService: StorageService) {
        this.storageService = storageService;
        this.disableAds.next(this.storageService.getItem('disableads', false));
        this.debugmode.next(this.storageService.getItem('debugmode', false));
        this.storageService.settingFeed.pipe(
            takeUntil(this.unsubscribe$))
            .subscribe(
                x => {
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

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.loading.complete();
    }


}
