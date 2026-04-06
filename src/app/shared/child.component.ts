import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AppStateService } from '../service/app-state.service';
import { StorageService } from '../service/storage.service';

@Component({
    selector: 'd2c-child',
    template: `<div>Abstract</div>`,
    standalone: true
})
export class ChildComponent {
    storageService = inject(StorageService);
    destroyRef = inject(DestroyRef);
    private appState = inject(AppStateService);

    public favoritesList$ = this.appState.favoritesList$;
    public favoritesMap = this.appState.favoritesMap;
    public disableAds = this.appState.disableAds;
    public debugmode = this.appState.debugmode;
    public hiddenMilestones = this.appState.hiddenMilestones;
    public hiddenClanMilestones = this.appState.hiddenClanMilestones;

    public loading = signal(false);

    public dump(dumpMe: any): void {
        console.log(dumpMe);
    }
}
