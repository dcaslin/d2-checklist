import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { merge, fromEvent as observableFromEvent, Subject, Observable, of as observableOf, forkJoin } from 'rxjs';
import { catchError, map, startWith, switchMap, flatMap, debounceTime, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { LowLinks } from './model';
import { NotificationService } from './notification.service';

@Injectable()
export class MarkService implements OnDestroy {

    // have an observable for dirty that's debounced to once every second that writes updates to server

    private marksChanged: Subject<boolean> = new Subject<boolean>();
    private dirty = false;

    constructor(private httpClient: HttpClient, private notificationService: NotificationService) {
        // auto save every 5 seconds if dirty
        this.marksChanged.pipe(
            takeUntil(this.unsubscribe$),
            debounceTime(5000))
            .subscribe(() => {
                if (this.dirty === true) {
                    console.log("Save stuff!");
                }

            });
    }

    //TODO marks feed, method for marking things dirty, save call
    // integrate this into the app

    public loadPlayer(platform: number, memberId: string): Promise<Marks> {
        return;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    private unsubscribe$: Subject<void> = new Subject<void>();


}

export class Marks {
    marked: { [key: string]: string };
    notes: { [key: string]: string };
    favs: { [key: string]: boolean };
    platform: number;
    memberId: string;

    constructor(platform: number, memberId: string, marked: { [key: string]: string },
        notes: { [key: string]: string }, favs: { [key: string]: boolean }) {
        this.platform = platform;
        this.memberId = memberId;
        if (marked == null) this.marked = {};
        else this.marked = marked;
        if (notes == null) this.notes = {};
        else this.notes = notes;
        if (favs == null) this.favs = {};
        else this.favs = favs;
    }
}

