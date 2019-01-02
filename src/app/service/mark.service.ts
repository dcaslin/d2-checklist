import { Injectable, OnDestroy } from '@angular/core';
import { Subject,  } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as LZString from 'lz-string';
import { InventoryItem } from './model';
import { NotificationService } from './notification.service';

@Injectable()
export class MarkService implements OnDestroy {

    // have an observable for dirty that's debounced to once every second that writes updates to server
    private marksChanged: Subject<boolean> = new Subject<boolean>();
    public dirty = false;
    private currentMarks:Marks = null;

    constructor(private httpClient: HttpClient, private notificationService: NotificationService) {
        // auto save every 5 seconds if dirty
        this.marksChanged.pipe(
            takeUntil(this.unsubscribe$),
            debounceTime(5000))
            .subscribe(() => {
                if (this.dirty === true) {
                    this.saveMarks();
                }
            });
    }

    public async saveMarks(): Promise<void> {
        this.currentMarks.magic = 'this is magic!';
        const s = JSON.stringify(this.currentMarks);
        const lzSaveMe: string = LZString.compressToBase64(s);
        const postMe = {
            data: lzSaveMe
        };
        this.httpClient.post<SaveResult>('https://www.destinychecklist.net/api/mark/', postMe)
            .toPromise().then(result => {
                if (result.status && result.status === "success") {
                    this.dirty = false;
                  }
            });
    }

    //TODO marks feed, method for marking things dirty, save call
    // integrate this into the app

    private async load(platform: number, memberId: string): Promise<Marks> {
        const requestUrl = 'https://www.destinychecklist.net/api/mark/' + platform + '/' + memberId;
        return this.httpClient.get<Marks>(requestUrl).toPromise();
    }

    public buildEmptyMarks(platform: number, memberId: string) {
        return {
            marked: {},
            notes: {},
            favs: {},
            todo: {},
            magic: null,
            platform: platform,
            memberId: memberId
        };
    }

    private static processMarks(m: { [key: string]: string }, items: InventoryItem[]): boolean {
        let unusedDelete: boolean = false;
        let usedKeys: any = {};
        let totalKeys: number = 0, missingKeys: number = 0;
        for (const key of Object.keys(m)) {
            usedKeys[key] = false;
            totalKeys++;
        }
        for (const item of items) {
            let mark: any = m[item.id];
            if (mark != null && mark.trim().length > 0) {
                if (mark == "upgrade") {
                    item.markLabel = "Upgrade Me";
                    item.mark = mark;
                }
                else if (mark == "keep") {
                    item.markLabel = "Keep Me";
                    item.mark = mark;
                }
                else if (mark == "infuse") {
                    item.markLabel = "Infusion Fuel";
                    item.mark = mark;
                }
                else if (mark == "junk") {
                    item.markLabel = "Dismantle Me";
                    item.mark = mark;
                }
                else {
                    console.log("Ignoring mark: " + mark);
                    return;
                }
                usedKeys[item.id] = true;
            }
        }
        for (const key of Object.keys(usedKeys)) {
            if (usedKeys[key] === false) {
                console.log("Deleting unused key: " + key);
                delete m[key];
                unusedDelete = true;
                missingKeys++;
            }
        }
        console.log("Marks: " + missingKeys + " unused out of total " + totalKeys);
        return unusedDelete;
    }

    private static processNotes(m: { [key: string]: string }, items: InventoryItem[]): boolean {
        let unusedDelete: boolean = false;
        let usedKeys: any = {};
        let totalKeys: number = 0, missingKeys: number = 0;
        for (const key of Object.keys(m)) {
            usedKeys[key] = false;
            totalKeys++;
        }
        for (const item of items) {
            let note: string = m[item.id];
            if (note != null && note.trim().length > 0) {
                item.notes = note;
                usedKeys[item.id] = true;
            }
        }
        for (const key of Object.keys(usedKeys)) {
            if (usedKeys[key] === false) {
                console.log("Deleting unused key: " + key);
                delete m[key];
                unusedDelete = true;
                missingKeys++;
            }
        }
        console.log("Notes: " + missingKeys + " unused out of total " + totalKeys);
        return unusedDelete;
    }

    public processItems(items: InventoryItem[]): void {
        //if we don't have both, don't do anything
        if (this.currentMarks==null || items.length==0) return;
        let updatedMarks: boolean = MarkService.processMarks(this.currentMarks.marked, items);
        let updatedNotes: boolean = MarkService.processNotes(this.currentMarks.notes, items);
        this.dirty = this.dirty || updatedNotes || updatedMarks;
    }

    updateItem(item: InventoryItem): void {
        if (item.id==null) return;
        if (item.mark == null) {
            item.markLabel = null;
            delete this.currentMarks.marked[item.id];
        }
        else {

            if (item.mark == "upgrade") {
                item.markLabel = "Upgrade Me";
            }
            else if (item.mark == "keep") {
                item.markLabel = "Keep Me";
            }
            else if (item.mark == "infuse") {
                item.markLabel = "Infusion Fuel";
            }
            else if (item.mark == "junk") {
                item.markLabel = "Dismantle Me";
            }
            else {
                console.log("Ignoring mark: " + item.mark);
                item.mark == null;
                return;
            }
            this.currentMarks.marked[item.id] = item.mark;
        }
        if (item.notes == null || item.notes.trim().length==0) {
            delete this.currentMarks.notes[item.id];
        }
        else {
            this.currentMarks.notes[item.id] = item.notes;
        }
        this.dirty = true;
        this.marksChanged.next(true);
    }


    public async loadPlayer(platform: number, memberId: string): Promise<void> {
        platform = 20 + platform;
        let marks = await this.load(platform, memberId);
        if (marks.memberId == null) {
            marks = this.buildEmptyMarks(platform, memberId);
        }
        this.currentMarks = marks;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    private unsubscribe$: Subject<void> = new Subject<void>();


}

export interface Marks {
    marked: { [key: string]: string };
    notes: { [key: string]: string };
    favs: { [key: string]: boolean };
    todo: any;
    magic: string;
    platform: number;
    memberId: string;
}

interface SaveResult {
    status: string;
  }