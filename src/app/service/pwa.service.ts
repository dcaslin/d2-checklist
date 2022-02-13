import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { first, catchError } from 'rxjs/operators';
import { interval, concat } from 'rxjs';
import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root'
})
export class PwaService {

    constructor(appRef: ApplicationRef, updates: SwUpdate, private notificationService: NotificationService) {
        console.log('PWAService loaded');
        try {
            // Allow the app to stabilize first, before starting polling for updates with `interval()`.
            const appIsStable$ = appRef.isStable.pipe(first(isStable => {
                console.log('App is stable: ' + isStable);
                return isStable === true;
            }));
            const every10Mins$ = interval(10 * 60 * 1000);
            const everySixHoursOnceAppIsStable$ = concat(appIsStable$, every10Mins$);
            if (updates.isEnabled) {
                console.log('Service worker is enabled');
                everySixHoursOnceAppIsStable$.subscribe(() => {
                    console.log('Checking for update...');
                    updates.checkForUpdate();
                });
                updates.available.subscribe(event => {
                    console.log('current version is', event.current);
                    console.log('available version is', event.available);
                    this.notificationService.success('A new update is available, refreshing');
                    window.location.reload();

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
