import { Injectable, OnDestroy } from '@angular/core';
import { Subject, } from 'rxjs';
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
    public markChoices: MarkChoice[];
    public markDict: {[id: string] : MarkChoice};
    private currentMarks: Marks = null;

    constructor(private httpClient: HttpClient, private notificationService: NotificationService) {
        // auto save every 5 seconds if dirty
        this.markChoices = MarkService.buildMarkChoices();
        this.markDict = {};
        for (const mc of this.markChoices){
            this.markDict[mc.value] = mc;
        }
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

    private async load(platform: number, memberId: string): Promise<Marks> {
        const requestUrl = 'https://www.destinychecklist.net/api/mark/' + platform + '/' + memberId;
        return this.httpClient.get<Marks>(requestUrl).toPromise();
    }

    public static buildMarkChoices(): MarkChoice[] {
        const a = [];
        a.push({
            label: "Upgrade",
            value: "upgrade",
            iconClass: "fas fa-level-up-alt"
        });
        a.push({
            label: "Keep",
            value: "keep",
            iconClass: "fas fa-save"
        });
        a.push({
            label: "Infuse",
            value: "infuse",
            iconClass: "fas fa-code-merge"
        });
        a.push({
            label: "Junk",
            value: "junk",
            iconClass: "fas fa-trash-alt"
        });
        return a;
    }

    private static buildEmptyMarks(platform: number, memberId: string) {
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
                    item.markLabel = "Upgrade";
                    item.mark = mark;
                }
                else if (mark == "keep") {
                    item.markLabel = "Keep";
                    item.mark = mark;
                }
                else if (mark == "infuse") {
                    item.markLabel = "Infuse";
                    item.mark = mark;
                }
                else if (mark == "junk") {
                    item.markLabel = "Junk";
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
        if (this.currentMarks == null || items.length == 0) return;
        let updatedMarks: boolean = MarkService.processMarks(this.currentMarks.marked, items);
        let updatedNotes: boolean = MarkService.processNotes(this.currentMarks.notes, items);
        this.dirty = this.dirty || updatedNotes || updatedMarks;
    }

    updateItem(item: InventoryItem): void {
        if (item.id == null) return;
        if (item.mark == null) {
            item.markLabel = null;
            delete this.currentMarks.marked[item.id];
        }
        else {
            const mc: MarkChoice = this.markDict[item.mark];
            if (mc!=null){
                item.markLabel = mc.label
            }
            else{
                console.log("Ignoring mark: " + item.mark);
                item.mark == null;
                return;
            }
            this.currentMarks.marked[item.id] = item.mark;
        }
        if (item.notes == null || item.notes.trim().length == 0) {
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
            marks = MarkService.buildEmptyMarks(platform, memberId);
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

export interface MarkChoice {
    label: string;
    value: string;
    iconClass: string;
}

interface SaveResult {
    status: string;
}