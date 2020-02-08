import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { first, catchError } from 'rxjs/operators';
import { interval, concat } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PwaService {

    constructor(appRef: ApplicationRef, updates: SwUpdate) {
        console.log('------PwaService-------');
        try {
            // Allow the app to stabilize first, before starting polling for updates with `interval()`.
            const appIsStable$ = appRef.isStable.pipe(first(isStable => {
                console.log('App is stable: ' + isStable);
                return isStable === true;
            }));
            const everySixHours$ = interval(6 * 60 * 60 * 1000);
            const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);
            if (updates.isEnabled) {
                everySixHoursOnceAppIsStable$.subscribe(() => {
                    updates.checkForUpdate();
                });
                updates.available.subscribe(event => {
                    console.log('current version is', event.current);
                    console.log('available version is', event.available);
                });
                updates.activated.subscribe(event => {
                    console.log('old version was', event.previous);
                    console.log('new version is', event.current);
                });
            }
        } catch (e) {
            console.log('PWA Service didn\'t initialize');
            console.dir(e);
        }
    }
}
