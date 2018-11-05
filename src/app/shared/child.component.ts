
import { takeUntil } from 'rxjs/operators';
import { Component, OnDestroy } from '@angular/core';
import { StorageService } from '../service/storage.service';
import { Subject } from 'rxjs';


@Component({
    selector: 'anms-child',
    template: `<div>Abstract</div>`
})
export class ChildComponent implements OnDestroy {
    unsubscribe$: Subject<void> = new Subject<void>();
    disableads = false;
    debugmode = false;
    favorites = {};
    loading = false;

    ua = '';

    storageService: StorageService;

    private static _getBrowserAndVersion(): string {
        const ua: string = window.navigator.userAgent;
        let M: string[] = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        let tem;
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE ' + (tem[1] || '');
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) { return tem.slice(1).join(' ').replace('OPR', 'Opera'); }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
        return M.join(' ');
    }

    private static getBrowserAndVersion(): any {
        const s: string = ChildComponent._getBrowserAndVersion();
        const as: string[] = s.split(' ');
        return {
            type: as[0].toLocaleLowerCase(),
            version: as[1]
        }
    }

    constructor(storageService: StorageService) {

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
                    if (x.favorites != null) {
                        this.favorites = x.favorites;
                    }
                });
        this.storageService.refresh();
        this.storageService.refresh();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


}
