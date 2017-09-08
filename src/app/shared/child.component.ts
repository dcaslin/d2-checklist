import { Component, OnDestroy } from '@angular/core';
import { StorageService } from '../service/storage.service';
import { Subject } from 'rxjs/Subject';


@Component({
    selector: 'amns-child',
    template: `<div>Abstract</div>`
})
export class ChildComponent implements OnDestroy {
    unsubscribe$: Subject<void> = new Subject<void>();
    disableads: boolean = false;
    loading: boolean = false;


    storageService: StorageService;


    constructor(storageService: StorageService) {
        this.storageService = storageService;
        this.disableads = this.storageService.getItem("disableads", false);
        this.storageService.settingFeed
            .takeUntil(this.unsubscribe$)
            .subscribe(
            x => {
                if (x.disableads != null) {
                    this.disableads = x.disableads;
                }
            });
        this.storageService.refresh();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}
