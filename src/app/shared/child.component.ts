
import { takeUntil } from 'rxjs/operators';
import { Component, OnDestroy } from '@angular/core';
import { StorageService } from '../service/storage.service';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { UserInfo } from '@app/service/model';


@Component({
    selector: 'anms-child',
    template: `<div>Abstract</div>`
})
export class ChildComponent implements OnDestroy {
    unsubscribe$: Subject<void> = new Subject<void>();
    private favoriteSub: BehaviorSubject<UserInfo[]> = new BehaviorSubject([]);
    public favoriteFeed: Observable<UserInfo[]>;

    disableads = false;
    debugmode = false;
    favorites: { [id: string]: UserInfo} = {};
    loading = false;

    ua = '';

    storageService: StorageService;

    constructor(storageService: StorageService) {
        this.favoriteFeed = this.favoriteSub.asObservable() as Observable<UserInfo[]>;
        this.storageService = storageService;
        this.disableads = this.storageService.getItem('disableads', false);
        this.debugmode = this.storageService.getItem('debugmode', false);
        this.storageService.settingFeed.pipe(
            takeUntil(this.unsubscribe$))
            .subscribe(
                x => {
                    if (x.disableads != null) {
                        this.disableads = x.disableads;
                    }
                    if (x.debugmode != null) {
                        this.debugmode = x.debugmode;
                    }
                });

        this.storageService.settingFeed.pipe(
            takeUntil(this.unsubscribe$))
            .subscribe(
                x => {
                    if (x.friends != null) {
                        this.favorites = x.friends;
                        const aFavs: UserInfo[] = [];
                        for (const key of Object.keys(x.friends)) {
                            aFavs.push(x.friends[key]);
                        }
                        this.favoriteSub.next(aFavs);
                    }
                });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}
