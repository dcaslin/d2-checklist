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

    ua = '';

    storageService: StorageService;

    private static _getBrowserAndVersion(): string{
        let ua: string = window.navigator.userAgent;
        let M: string[]= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        let tem;
        if(/trident/i.test(M[1])){
            tem =  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome'){
            tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
            if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
        M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
        return M.join(' ');  
    }

    private static getBrowserAndVersion(): any{
        let s: string = ChildComponent._getBrowserAndVersion();
        let as: string[] = s.split(" ");
        return {
            type: as[0].toLocaleLowerCase(),
            version: as[1]
        }
    }

    // public static isOldSafari(): boolean{
    //     try{
    //         let type:any = ChildComponent.getBrowserAndVersion();
    //         if (type.type=="safari"&& type.version<11){
    //             return true;
    //         }
    //     }
    //     catch (err){
    //         console.log("Error checking browser version!");
    //         return false;
    //     }
    //     return false;
    // }



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
