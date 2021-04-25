import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import {
    ItemAnnotation,
    ProfileUpdate,
    TagCleanupUpdate,
    TagValue
} from '@destinyitemmanager/dim-api-types';
import { environment } from '@env/environment';
import { IconDefinition } from '@fortawesome/pro-light-svg-icons';
import { faCabinetFiling } from '@fortawesome/pro-regular-svg-icons';
import {
    faBan,
    faBolt,
    faHeart,
    faSave as fasSave
} from '@fortawesome/pro-solid-svg-icons';
import * as LZString from 'lz-string';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { DimSyncService } from './dim-sync.service';
import { InventoryItem } from './model';
import { NotificationService } from './notification.service';
import { SignedOnUserService } from './signed-on-user.service';
import { format } from 'date-fns';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

const MARK_URL = '/api/mark';

@Injectable()
export class MarkService implements OnDestroy {
    // right now we only use this for DIM-sync
    public loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    public currentMarks$: BehaviorSubject<Marks | null> = new BehaviorSubject(null);
    private cleanMarks$: BehaviorSubject<Marks | null> = new BehaviorSubject(null); // the original marks loaded from the server
    // have an observable for dirty that's debounced to once every second that writes updates to server
    private marksChanged: Subject<boolean> = new Subject<boolean>();
    public dirty: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public markChoices: MarkChoice[];
    public markDict: { [id: string]: MarkChoice };
    private badState = false;
    private failCount = 0;

    private unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private httpClient: HttpClient,
        private notificationService: NotificationService,
        private dimSyncService: DimSyncService,
        private authService: AuthService,
        private signedOnUserService: SignedOnUserService
    ) {
        // auto save every 5 seconds if dirty
        this.markChoices = MarkService.buildMarkChoices();
        this.markDict = {};
        for (const mc of this.markChoices) {
            this.markDict[mc.value] = mc;
        }
        this.marksChanged
            .pipe(takeUntil(this.unsubscribe$), debounceTime(5000))
            .subscribe(() => {
                if (this.dirty.value === true && !this.badState) {
                    this.saveMarks();
                }
            });
    }

    private async load(platform: number, memberId: string): Promise<Marks> {
        const requestUrl = `${MARK_URL}/${20 + platform}/${memberId}`;
        let marks = await this.httpClient.get<Marks>(requestUrl).toPromise();
        if (marks.memberId == null) {
            marks = MarkService.buildEmptyMarks(platform, memberId);
        }
        return marks;
    }

    // returns true if dimSync decision is needed
    public async loadPlayer(platform: number, memberId: string): Promise<boolean> {
        let bootstrapMarks = this.currentMarks$.getValue();
        let freshLoad = false;
        // if this is our initial load, grab out D2C settings, we need to do so to see if we should be using DIM-sync
        if (!bootstrapMarks) {
            freshLoad = true;
            bootstrapMarks = await this.load(platform, memberId);
        }
        let marks;
        // if we're using DIM Sync
        if (bootstrapMarks?.dimSyncChoice == 'enabled') {
            // grab the DIM data
            const dimAnnotations = await this.dimSyncService.getDimTags();
            // convert it into D2C format
            marks = MarkService.buildMarksFromDIM(dimAnnotations, bootstrapMarks);
        } else {
            if (freshLoad) {
                marks = bootstrapMarks;
            } else {
                marks = await this.load(platform, memberId);
            }
        }
        // push out marks to UI
        this.currentMarks$.next(marks);
        // save a copy of our DIM server state for diffing on save
        this.cleanMarks$.next(cloneMarks(marks));
        // if the user has not mad ea DIM selection, eventually have the UI prompt them
        return (marks.dimSyncChoice == null);
    }


    public async saveMarks(): Promise<void> {
        // if they have no gear we may have "cleaned up" all their marks, don't save that
        // as it could wipe all their marks
        if (this.badState) {
            this.notificationService.fail(
                'Gear likely missing, saving marks disabled'
            );
            return;
        }
        // setup our marks header for saving to D2C
        const marks = this.currentMarks$.getValue();
        marks.magic = 'this is magic!';
        marks.token = await this.authService.getKey();
        marks.apiKey = environment.bungie.apiKey;
        marks.bungieId = this.signedOnUserService.signedOnUser$.getValue()?.membership.bungieId;
        marks.modified = new Date().toJSON();
        const s = JSON.stringify(marks);
        const lzSaveMe: string = LZString.compressToBase64(s);
        const postMe = {
            data: lzSaveMe,
        };
        let success;
        // if we're using DIM sync, write to both but only really worry about DIM
        if (marks.dimSyncChoice == 'enabled') {
            const updates = MarkService.generateDimUpdates(this.cleanMarks$.getValue(), marks);
            success = await this.dimSyncService.setDimTags(updates);
            try {
                await this.httpClient.post<SaveResult>(MARK_URL, postMe).toPromise();
            } catch (x) {
                // just log an error saving to D2C, it's not our golden copy anymore
                console.log('Error saving to D2Checklist, ignoring b/c we\'re using DIM sync');
                console.dir(x);
            }
        } else {
            // if we're using D2C, its success drives us
            const result = await this.httpClient.post<SaveResult>(MARK_URL, postMe).toPromise();
            success = result.status && result.status === 'success';
        }

        if (success) {
            this.dirty.next(false);
            this.failCount = 0;
        } else {
            this.failCount++;
            // if we failed 5 times in a row, stop spamming the server
            if (this.failCount > 5) {
                this.notificationService.fail(
                    'Mark service is down. Marks will not be saved, please try again later.'
                );
                this.dirty.next(false);
            }
        }
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
            if (marks.memberId != this.currentMarks$.getValue().memberId) {
                throw new Error(
                    'Marks don\'t match. Current member id: ' +
                    this.currentMarks$.getValue().memberId +
                    ' but file used ' +
                    marks.memberId
                );
            }
            this.currentMarks$.next(marks);
            this.notificationService.success(
                `Successfully imported ${Object.keys(this.currentMarks$.getValue().marked).length
                } marks from ${file.name}`
            );
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
        const sMarks = JSON.stringify(this.currentMarks$.getValue(), null, 2);
        anch.setAttribute(
            'href',
            'data:text/csv;charset=utf-8,' + encodeURIComponent(sMarks)
        );
        anch.setAttribute('download', `d2checklist-tags_${format(new Date(), 'yyyy-MM-dd')}.json`);
        anch.setAttribute('visibility', 'hidden');
        document.body.appendChild(anch);
        anch.click();
    }


    public static buildMarkChoices(): MarkChoice[] {
        const a = [];
        a.push({
            label: 'Upgrade',
            value: 'upgrade',
            icon: faHeart,
        });
        a.push({
            label: 'Keep',
            value: 'keep',
            icon: fasSave,
        });
        a.push({
            label: 'Infuse',
            value: 'infuse',
            icon: faBolt,
        });
        a.push({
            label: 'Junk',
            value: 'junk',
            icon: faBan,
        });
        a.push({
            label: 'Archive',
            value: 'archive',
            icon: faCabinetFiling,
        });
        return a;
    }

    private static buildEmptyMarks(platform: number, memberId: string): Marks {
        return {
            marked: {},
            notes: {},
            favs: {},
            dimSyncChoice: null,
            todo: {},
            magic: null,
            platform: platform,
            memberId: memberId,
        };
    }

    private static processMarks(
        m: { [key: string]: string },
        items: InventoryItem[]
    ): boolean {
        let unusedDelete = false;
        const usedKeys: any = {};
        let totalKeys = 0,
            missingKeys = 0;
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
                } else if (mark == 'archive') {
                    item.markLabel = 'Archive';
                    item.mark = mark;
                } else {
                    console.log('Ignoring mark: ' + mark);
                    continue;
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

    private static processNotes(
        m: { [key: string]: string },
        items: InventoryItem[]
    ): boolean {
        let unusedDelete = false;
        const usedKeys: any = {};
        let totalKeys = 0,
            missingKeys = 0;
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
        const currentMarks = this.currentMarks$.getValue();
        if (currentMarks == null || items.length == 0) {
            return;
        }
        // if there are no private items, don't bother processing marks in any way, including saving them
        if (!this.hasPrivateItems(items)) {
            this.notificationService.info(
                'No private items found, disabling marking.'
            );
            this.badState = true;
            return;
        }
        this.badState = false;
        const updatedMarks: boolean = MarkService.processMarks(
            currentMarks.marked,
            items
        );
        const updatedNotes: boolean = MarkService.processNotes(
            currentMarks.notes,
            items
        );
        this.dirty.next(this.dirty.value || updatedNotes || updatedMarks);
    }

    updateItem(item: InventoryItem): void {
        if (item.id == null) {
            return;
        }

        const currentMarks = this.currentMarks$.getValue();
        if (item.mark == null) {
            item.markLabel = null;
            delete currentMarks.marked[item.id];
        } else {
            const mc: MarkChoice = this.markDict[item.mark];
            if (mc != null) {
                item.markLabel = mc.label;
            } else {
                console.log('Ignoring mark: ' + item.mark);
                item.mark = null;
                return;
            }
            currentMarks.marked[item.id] = item.mark;
        }
        if (item.notes == null || item.notes.trim().length == 0) {
            delete currentMarks.notes[item.id];
        } else {
            currentMarks.notes[item.id] = item.notes;
        }
        this.dirty.next(true);
        this.marksChanged.next(true);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }


    async disableDimSync(setting: DimSyncChoice): Promise<void> {
        this.currentMarks$.getValue().dimSyncChoice = setting;
        await this.saveMarks();
        this.notificationService.info('DIM sync disabled. D2Checklist will use its own services for syncing now.');
    }

    async doInitialDimSync(): Promise<boolean> {
        this.loading$.next(true);
        try {
            const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
            const d2cMarks = await this.load(selectedUser.userInfo.membershipType, selectedUser.userInfo.membershipId);
            if (d2cMarks == null || this.badState) {
                this.notificationService.info(
                    'Things don\'t look healthy right now, try again later.'
                );
                return false;
            }
            const dimAnnotations = await this.dimSyncService.getDimTags();
            // we need to convert what we got from DIM into psuedo-marks for comparison sake
            const origDimMarks = MarkService.buildMarksFromDIM(dimAnnotations, d2cMarks);
            // now we fold the DIM marks into our D2C marks to see what our final state out to look like
            const newD2CMarks = MarkService.unionD2CAndDim(d2cMarks, dimAnnotations);
            newD2CMarks.dimSyncChoice = 'enabled';
            // push our current state out to D2C
            this.currentMarks$.next(newD2CMarks);
            await this.saveMarks();
            // compare the server DIM state w/ our new state and generate a list of transactions necessary for them to be in-sync
            const updates = MarkService.generateDimUpdates(origDimMarks, newD2CMarks);
            const updateCount = updates.filter((x) => x.action === 'tag').length;
            const cleanupElem: TagCleanupUpdate = updates.find(
                (x) => x.action === 'tag_cleanup'
            ) as TagCleanupUpdate;
            const delCount = cleanupElem ? cleanupElem.payload.length : 0;
            const success = await this.dimSyncService.setDimTags(updates);
            if (success) {
                this.notificationService.success(
                    `Exported ${updateCount} tags to DIM-sync. Removed ${delCount}.`
                );
            }
            return true;

        } finally {
            this.loading$.next(false);
        }
    }

    private static buildMarksFromDIM(dimMarks: ItemAnnotation[], d2cMarks: Marks): Marks {
        const targetMarks = cloneMarks(d2cMarks, true);
        MarkService.mergeDimIntoD2C(targetMarks, dimMarks, false);
        return targetMarks;
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

    private static d2cTagToDimTag(tag: string): TagValue {
        return tag === 'upgrade' ? 'favorite' : (tag as TagValue);
    }

    private static dimTagToD2cTag(tag: TagValue): string {
        return tag === 'favorite' ? 'upgrade' : tag;
    }

    // This updates the D2C marks in place
    private static mergeDimIntoD2C(
        d2cMarks: Marks,
        dimMarks: ItemAnnotation[],
        deleteUnmatched: boolean
    ): ImportResult {
        // we're going to slowly prune items out of our old list if we're deleting
        // the ones left are the items that were, effectively, deleted
        const oldMarks = d2cMarks.marked;
        const oldNotes = d2cMarks.notes;
        if (deleteUnmatched) {
            d2cMarks.marked = {};
            d2cMarks.notes = {};
        }
        for (const d of dimMarks) {
            if (d.tag) {
                d2cMarks.marked[d.id] = MarkService.dimTagToD2cTag(d.tag);
                if (deleteUnmatched) {
                    delete oldMarks[d.id];
                }
            }
            if (d.notes) {
                d2cMarks.notes[d.id] = d.notes;
                if (deleteUnmatched) {
                    delete oldNotes[d.id];
                }
            }
        }
        return {
            imported: dimMarks.length,
            deleted: deleteUnmatched
                ? Object.keys(oldMarks).length + Object.keys(oldNotes).length
                : 0,
        };
    }


    private static generateDimUpdates(oldMarks: Marks, newMarks: Marks): ProfileUpdate[] {
        const keys: Set<string> = new Set();
        for (const k of Object.keys(oldMarks.marked)) {
            keys.add(k);
        }
        for (const k of Object.keys(oldMarks.notes)) {
            keys.add(k);
        }
        for (const k of Object.keys(newMarks.marked)) {
            keys.add(k);
        }
        for (const k of Object.keys(newMarks.notes)) {
            keys.add(k);
        }
        const returnMe: ProfileUpdate[] = [];
        const deleteTags: string[] = [];
        keys.forEach((k) => {
            const oldMark = oldMarks.marked[k];
            const oldNote = oldMarks.notes[k];
            const newMark = newMarks.marked[k];
            const newNote = newMarks.notes[k];
            if (oldMark == newMark && oldNote == newNote) {
                // do nothing, nothing changed
            } else if (newMark == null && newNote == null) {
                // delete me
                deleteTags.push(k);
                return;
            } else {
                // upsert me
                returnMe.push({
                    action: 'tag',
                    payload: {
                        id: k,
                        tag: MarkService.d2cTagToDimTag(newMark),
                        notes: newNote ? newNote : null
                    },
                });
            }
        });
        if (deleteTags.length > 0) {
            returnMe.push({
                action: 'tag_cleanup',
                payload: deleteTags,
            });
        }
        console.dir(returnMe);
        return returnMe;
    }

    private static unionD2CAndDim(
        origD2cMarks: Marks,
        dimMarks: ItemAnnotation[]): Marks {
        // deep clone marks
        const d2cMarks = cloneMarks(origD2cMarks);
        let updateCount = 0;
        // fold in our dim notes and tags where we don't already have data
        for (const dimAnnot of dimMarks) {
            if (dimAnnot.notes) {
                if (!d2cMarks.notes[dimAnnot.id]) {
                    d2cMarks.notes[dimAnnot.id] = dimAnnot.notes;
                    updateCount++;
                }
            }
            if (dimAnnot.tag) {
                if (!d2cMarks.marked[dimAnnot.id]) {
                    d2cMarks.marked[dimAnnot.id] = MarkService.dimTagToD2cTag(dimAnnot.tag);
                    updateCount++;
                }
            }
        }
        console.log(`Folded in ${updateCount} updates from DIM sync`);
        return d2cMarks;
    }

    // async importTagsFromDim(includeDelete: boolean): Promise<boolean> {
    //     this.loading$.next(true);
    //     try {
    //         try {
    //             const dimMarks = await this.dimSyncService.getDimTags();
    //             let marks = this.currentMarks$.getValue();
    //             if (!marks) {
    //                 const selectedUser = this.signedOnUserService.signedOnUser$.getValue();
    //                 marks = MarkService.buildEmptyMarks(
    //                     selectedUser.userInfo.membershipType,
    //                     selectedUser.userInfo.membershipId
    //                 );
    //             }
    //             // update marks in place
    //             const importResult = MarkService.mergeDimIntoD2C(
    //                 marks,
    //                 dimMarks,
    //                 includeDelete
    //             );
    //             this.currentMarks$.next(marks);
    //             console.dir(importResult);
    //             this.notificationService.success(
    //                 `Successfully imported tags and notes from DIM-sync. Imported ${importResult.imported}. Deleted ${importResult.deleted}`
    //             );
    //         } catch (x) {
    //             this.notificationService.fail('Failed to import marks from DIM: ' + x);
    //             return false;
    //         }
    //         // it worked, now save back to the server
    //         await this.saveMarks();
    //         return true;
    //     } finally {
    //         this.loading$.next(false);
    //     }
    // }

    // async exportTagsToDim(includeDelete: boolean): Promise<void> {
    //     this.loading$.next(true);
    //     try {
    //         const marks = this.currentMarks$.getValue();
    //         if (marks == null || this.badState) {
    //             this.notificationService.info(
    //                 'No valid marks to sync to DIM right now.'
    //             );
    //             return;
    //         }
    //         let updates: ProfileUpdate[];
    //         if (!includeDelete) {
    //             updates = MarkService.mergeD2CIntoDim(marks);
    //         } else {
    //             const dimMarks = await this.dimSyncService.getDimTags();
    //             updates = MarkService.mergeD2CIntoDim(marks, true, dimMarks);
    //         }
    //         const updateCount = updates.filter((x) => x.action === 'tag').length;
    //         const cleanupElem: TagCleanupUpdate = updates.find(
    //             (x) => x.action === 'tag_cleanup'
    //         ) as TagCleanupUpdate;
    //         const delCount = cleanupElem ? cleanupElem.payload.length : 0;
    //         if (updateCount > 0) {
    //             const success = await this.dimSyncService.setDimTags(updates);
    //             if (success) {
    //                 this.notificationService.success(
    //                     `Exported ${updateCount} tags to DIM-sync. Removed ${delCount}.`
    //                 );
    //             }
    //         } else {
    //             this.notificationService.info('No changes to send to DIM');
    //         }
    //     } finally {
    //         this.loading$.next(false);
    //     }
    // }


    // private static mergeD2CIntoDim(
    //     d2cMarks: Marks,
    //     deleteUnmatched?: boolean,
    //     dimMarks?: ItemAnnotation[]
    // ): ProfileUpdate[] {
    //     const dAnnots: { [key: string]: ItemAnnotation } = {};
    //     for (const key of Object.keys(d2cMarks.marked)) {
    //         const tag = d2cMarks.marked[key];
    //         dAnnots[key] = {
    //             id: key,
    //             tag: MarkService.d2cTagToDimTag(tag),
    //         };
    //     }
    //     for (const key of Object.keys(d2cMarks.notes)) {
    //         if (!dAnnots[key]) {
    //             dAnnots[key] = {
    //                 id: key,
    //             };
    //         }
    //         dAnnots[key].notes = d2cMarks.notes[key];
    //     }
    //     const returnMe: ProfileUpdate[] = [];
    //     if (deleteUnmatched) {
    //         const deleteTags: string[] = [];
    //         for (const d of dimMarks) {
    //             if (!dAnnots[d.id]) {
    //                 deleteTags.push(d.id);
    //             }
    //         }
    //         returnMe.push({
    //             action: 'tag_cleanup',
    //             payload: deleteTags,
    //         });
    //     }
    //     for (const key of Object.keys(dAnnots)) {
    //         returnMe.push({
    //             action: 'tag',
    //             payload: dAnnots[key],
    //         });
    //     }
    //     return returnMe;
    // }



}

export declare type DimSyncChoice =
    | 'disabled'
    | 'enabled'
    | null;


function cloneMarks(x: Marks, headerOnly?: boolean): Marks {
    return {
        marked: headerOnly ? {} : { ...x.marked },
        notes: headerOnly ? {} : { ...x.notes },
        favs: headerOnly ? {} : { ...x.favs },
        dimSyncChoice: x.dimSyncChoice,
        todo: x.todo,
        magic: x.magic,
        platform: x.platform,
        memberId: x.memberId,
        modified: x.modified,
        token: x.token,
        bungieId: x.bungieId,
        apiKey: x.apiKey
    };
}

export interface Marks {
    marked: { [key: string]: string };
    notes: { [key: string]: string };
    favs: { [key: string]: boolean }; // not used for anything in d2
    dimSyncChoice: DimSyncChoice;
    todo: any; // not used for anything in d2
    magic: string;
    platform: number;
    memberId: string;
    modified?: string;
    token?: string;
    bungieId?: string;
    apiKey?: string;
}

export interface MarkChoice {
    label: string;
    value: string;
    icon: IconDefinition;
}

interface SaveResult {
    status: string;
}

interface ImportResult {
    imported: number;
    deleted: number;
}
