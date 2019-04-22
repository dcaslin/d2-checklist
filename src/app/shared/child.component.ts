
import { takeUntil } from 'rxjs/operators';
import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { StorageService } from '../service/storage.service';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { UserInfo } from '@app/service/model';


@Component({
    selector: 'anms-child',
    template: `<div>Abstract</div>`
})
export class ChildComponent implements OnDestroy {
    unsubscribe$: Subject<void> = new Subject<void>();
    public favoritesList: BehaviorSubject<UserInfo[]> = new BehaviorSubject([]);
    public favoritesMap: BehaviorSubject<{ [id: string]: UserInfo }> = new BehaviorSubject({});
    public disableAds: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public debugmode: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public hiddenMilestones: BehaviorSubject<string[]> = new BehaviorSubject([]);
    storageService: StorageService;

    constructor(storageService: StorageService,
        ref: ChangeDetectorRef) {
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
                        this.favoritesList.next(aFavs);
                    }
                    if (x.hiddenmilestones != null) {
                        this.hiddenMilestones.next(x.hiddenmilestones);
                    }
                });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}
