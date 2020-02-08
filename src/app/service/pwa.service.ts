import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { first } from 'rxjs/operators';
import { interval, concat } from 'rxjs';

@Injectable()
export class PwaService {

    constructor(appRef: ApplicationRef, updates: SwUpdate) {
        console.log('------PwaService-------');
        // Allow the app to stabilize first, before starting polling for updates with `interval()`.
        const appIsStable$ = appRef.isStable.pipe(first(isStable => isStable === true));
        const everySixHours$ = interval(6 * 60 * 60 * 1000);
        const everySixHoursOnceAppIsStable$ = concat(appIsStable$, everySixHours$);

        everySixHoursOnceAppIsStable$.subscribe(() => updates.checkForUpdate());

        updates.available.subscribe(event => {
            console.log('current version is', event.current);
            console.log('available version is', event.available);
        });
        updates.activated.subscribe(event => {
            console.log('old version was', event.previous);
            console.log('new version is', event.current);
        });
    }
}
