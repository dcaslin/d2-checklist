import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { IconDefinition } from '@fortawesome/pro-light-svg-icons';
import { faLevelUpAlt as fasLevelUpAlt, faSave as fasSave, faSyringe as fasSyringe, faTrashAlt as fasTrashAlt } from '@fortawesome/pro-solid-svg-icons';
import * as LZString from 'lz-string';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { InventoryItem } from './model';
import { NotificationService } from './notification.service';
import { SignedOnUserService } from './signed-on-user.service';

// const MARK_URL = 'https://www.destinychecklist.net/api/mark/';

// const MARK_URL = 'https://localhost:4200/api/mark';
const MARK_URL = 'https://beta.d2checklist.com/api/mark';

@Injectable()
export class MarkService implements OnDestroy {

    // have an observable for dirty that's debounced to once every second that writes updates to server
    private marksChanged: Subject<boolean> = new Subject<boolean>();
    public dirty: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public markChoices: MarkChoice[];
    public markDict: { [id: string]: MarkChoice };
    private currentMarks: Marks = null;
    private badState = false;
    private failCount = 0;

    private unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private httpClient: HttpClient,
        private notificationService: NotificationService,
        private authService: AuthService,
        private signedOnUserService: SignedOnUserService
        ) {
        // auto save every 5 seconds if dirty
        this.markChoices = MarkService.buildMarkChoices();
        this.markDict = {};
        for (const mc of this.markChoices) {
            this.markDict[mc.value] = mc;
        }
        this.marksChanged.pipe(
            takeUntil(this.unsubscribe$),
            debounceTime(5000))
            .subscribe(() => {
                if (this.dirty.value === true && !this.badState) {
                    this.saveMarks();
                }
            });
    }
    public async loadPlayer(platform: number, memberId: string): Promise<void> {
        // Don't step on D1 Marks
        platform = 20 + platform;
        let marks = await this.load(platform, memberId);
        if (marks.memberId == null) {
            marks = MarkService.buildEmptyMarks(platform, memberId);
        }
        this.currentMarks = marks;
    }

    public async saveMarks(): Promise<void> {
        if (this.badState) {
            this.notificationService.fail('Gear likely missing, saving marks disabled');
            return;
        }
        this.currentMarks.magic = 'this is magic!';
        this.currentMarks.token = await this.authService.getKey();
        this.currentMarks.bungieId = this.signedOnUserService.signedOnUser$.getValue()?.membership.bungieId;        
        this.currentMarks.modified = new Date().toJSON();
        const s = JSON.stringify(this.currentMarks);
        const lzSaveMe: string = LZString.compressToBase64(s);
        const postMe = {
            data: lzSaveMe
        };
        this.httpClient.post<SaveResult>(MARK_URL, postMe)
            .toPromise().then(result => {
                if (result.status && result.status === 'success') {
                    this.dirty.next(false);
                    this.failCount = 0;
                } else {
                    this.failCount++;
                    // if we failed 5 times in a row, stop spamming the server
                    if (this.failCount > 5) {
                        this.notificationService.fail('Mark service is down. Marks will not be saved, please try again later.');
                        this.dirty.next(false);
                    }
                }
            });
    }

    public async restoreMarksFromFile(file: File): Promise<boolean> {
        const sText = await MarkService.readFileAsString(file);
        try {
            const marks: Marks = JSON.parse(sText);
            if (marks.memberId == null) {
                throw new Error('File is invalid, no memberId included');
            }
            if (marks.marked == null || Object.keys(marks.marked).length == 0) {
                throw new Error('File is invalid, no marks included');
            }
            if (marks.memberId != this.currentMarks.memberId) {
                throw new Error('Marks don\'t match. Current member id: ' + this.currentMarks.memberId + ' but file used ' + marks.memberId);
            }
            this.currentMarks = marks;
            this.notificationService.success(`Successfully imported ${Object.keys(this.currentMarks.marked).length} marks from ${file.name}`);
            // also save to server
            await this.saveMarks();
            return true;
        } catch (x) {
            this.notificationService.fail('Failed to parse input file: ' + x);
            return false;
        }
    }

    public downloadMarks() {
        const anch: HTMLAnchorElement = document.createElement('a');
        const sMarks = JSON.stringify(this.currentMarks, null, 2);
        anch.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(sMarks));
        anch.setAttribute('download', 'd2checklist-tags.json');
        anch.setAttribute('visibility', 'hidden');
        document.body.appendChild(anch);
        anch.click();
    }

    private async load(platform: number, memberId: string): Promise<Marks> {
        const requestUrl = `${MARK_URL}/${platform}/${memberId}`;
        return this.httpClient.get<Marks>(requestUrl).toPromise();
    }

    public static buildMarkChoices(): MarkChoice[] {
        const a = [];
        a.push({
            label: 'Upgrade',
            value: 'upgrade',
            icon: fasLevelUpAlt
        });
        a.push({
            label: 'Keep',
            value: 'keep',
            icon: fasSave
        });
        a.push({
            label: 'Infuse',
            value: 'infuse',
            icon: fasSyringe
        });
        a.push({
            label: 'Junk',
            value: 'junk',
            icon: fasTrashAlt
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
        let unusedDelete = false;
        const usedKeys: any = {};
        let totalKeys = 0, missingKeys = 0;
        for (const key of Object.keys(m)) {
            usedKeys[key] = false;
            totalKeys++;
        }
        for (const item of items) {
            const mark: any = m[item.id];
            if (mark != null && mark.trim().length > 0) {
                if (mark == 'upgrade') {
                    item.markLabel = 'Upgrade';
                    item.mark = mark;
                } else if (mark == 'keep') {
                    item.markLabel = 'Keep';
                    item.mark = mark;
                } else if (mark == 'infuse') {
                    item.markLabel = 'Infuse';
                    item.mark = mark;
                } else if (mark == 'junk') {
                    item.markLabel = 'Junk';
                    item.mark = mark;
                } else {
                    console.log('Ignoring mark: ' + mark);
                    return;
                }
                usedKeys[item.id] = true;
            }
        }
        for (const key of Object.keys(usedKeys)) {
            if (usedKeys[key] === false) {
                console.log('Deleting unused key: ' + key);
                delete m[key];
                unusedDelete = true;
                missingKeys++;
            }
        }
        console.log('Marks: ' + missingKeys + ' unused out of total ' + totalKeys);
        return unusedDelete;
    }

    private static processNotes(m: { [key: string]: string }, items: InventoryItem[]): boolean {
        let unusedDelete = false;
        const usedKeys: any = {};
        let totalKeys = 0, missingKeys = 0;
        for (const key of Object.keys(m)) {
            usedKeys[key] = false;
            totalKeys++;
        }
        for (const item of items) {
            const note: string = m[item.id];
            if (note != null && note.trim().length > 0) {
                item.notes = note;
                usedKeys[item.id] = true;
            }
        }
        for (const key of Object.keys(usedKeys)) {
            if (usedKeys[key] === false) {
                console.log('Deleting unused key: ' + key);
                delete m[key];
                unusedDelete = true;
                missingKeys++;
            }
        }
        console.log('Notes: ' + missingKeys + ' unused out of total ' + totalKeys);
        return unusedDelete;
    }

    private hasPrivateItems(items: InventoryItem[]) {
        for (const i of items) {
            if (!i.equipped.getValue()) {
                return true;
            }
        }
        return false;
    }

    public processItems(items: InventoryItem[]): void {
        // if we don't have both, don't do anything
        if (this.currentMarks == null || items.length == 0) { return; }
        // if there are no private items, don't bother processing marks in any way, including saving them
        if (!this.hasPrivateItems(items)) {
            this.notificationService.info('No private items found, disabling marking.');
            this.badState = true;
            return;
        }
        this.badState = false;
        const updatedMarks: boolean = MarkService.processMarks(this.currentMarks.marked, items);
        const updatedNotes: boolean = MarkService.processNotes(this.currentMarks.notes, items);
        this.dirty.next(this.dirty.value || updatedNotes || updatedMarks);
    }

    updateItem(item: InventoryItem): void {
        if (item.id == null) { return; }
        if (item.mark == null) {
            item.markLabel = null;
            delete this.currentMarks.marked[item.id];
        } else {
            const mc: MarkChoice = this.markDict[item.mark];
            if (mc != null) {
                item.markLabel = mc.label;
            } else {
                console.log('Ignoring mark: ' + item.mark);
                item.mark = null;
                return;
            }
            this.currentMarks.marked[item.id] = item.mark;
        }
        if (item.notes == null || item.notes.trim().length == 0) {
            delete this.currentMarks.notes[item.id];
        } else {
            this.currentMarks.notes[item.id] = item.notes;
        }
        this.dirty.next(true);
        this.marksChanged.next(true);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


    private static readFileAsString(file: File): Promise<string | null> {
        return new Promise<string>((resolve, reject) => {
            if (!file) {
                resolve(null);
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = reader.result.toString();
                resolve(text);
            };
            reader.readAsText(file);
        });
    }


}

export interface Marks {
    marked: { [key: string]: string };
    notes: { [key: string]: string };
    favs: { [key: string]: boolean };
    todo: any;
    magic: string;
    platform: number;
    memberId: string;
    modified?: string;
    token?: string;
    bungieId?: string;
}

export interface MarkChoice {
    label: string;
    value: string;
    icon: IconDefinition;
}

interface SaveResult {
    status: string;
}
