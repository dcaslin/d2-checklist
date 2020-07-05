import { Injectable } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ReplaySubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
import { ActivityRow } from '../interfaces/activity.interface';
import { ActivityFilterService } from './activity-filter.service';

interface GridSettings {
  isCompact: boolean;
  hideComplete: boolean;
}

const DEFAULT_SETTINGS: GridSettings = {
  isCompact: false,
  hideComplete: false
}

/**
 * Handles various other settings for the grid
 */
@Injectable()
export class GridSettingsService extends Destroyable {

  // declared above the specific settings observables to avoid errors
  // about using this before it's initialized
  private gridSettings = new ReplaySubject<GridSettings>(1);
  private _gridSettings: GridSettings = DEFAULT_SETTINGS;

  public compact = this.gridSettings.pipe(
    map(x => x.isCompact),
    distinctUntilChanged()
  );

  public hideComplete = this.gridSettings.pipe(
    map(x => x.hideComplete),
    distinctUntilChanged()
  );

  // TODO store and load settings from previous session
  constructor(
    private storage: StorageService,
    private filterService: ActivityFilterService
  ) {
    super();
    this.filterService.clearFilterFunctions.push(() => this.clearFilterSettings());
    this.filterService.filterFunctions.push((row) => this.doesRowPassFilters(row));

    this.gridSettings.pipe(
      tap(settings => this._gridSettings = settings),
      debounceTime(1000), // not a long debounce time bc not a lot of data will ever be written at once
      takeUntil(this.destroy$)
    ).subscribe(() => this.storeSettings());

    this.loadSettings();
  }

  /**
   * changes the view to match whatever the input boolean is
   * @param isCompact whether to change the view to compact
   */
  changeCompactMode(isCompact: boolean) {
    const curSettings = this._gridSettings;
    this.gridSettings.next({ ...curSettings, isCompact });
  }

  changeCompleteHide(hideComplete: boolean) {
    const curSettings = this._gridSettings;
    this.gridSettings.next({ ...curSettings, hideComplete });
    this.filterService.pushUpdatesToTable();
    this.filterService.updateFilterStatus(hideComplete, 'settings');
  }

  clearFilterSettings() {
    this.changeCompleteHide(false);
  }

  /**
   * If we are hiding complete rows, then if any character does not have
   * the row complete, then we want to show it.
   * Otherwise, we hide it.
   */
  doesRowPassFilters(row: ActivityRow): boolean {
    const hideComplete = this._gridSettings.hideComplete;
    for (let charInfo of Object.values(row.charInfo)) {
      if (!charInfo?.progress?.complete) {
        return true;
      }
    }
    // at this point, if any characters didn't complete the row activity,
    // the activity already returned true for needing to be shown.
    // So if we are hiding complete, return false because the row is all done
    // if we aren't hiding complete, return true because the row should be shown regardless
    return !hideComplete;
  }

  storeSettings() {
    this.storage.setItem(SETTINGS_KEY, this._gridSettings);
  }

  loadSettings() {
    const settings = this.storage.getItem(SETTINGS_KEY, DEFAULT_SETTINGS);
    this.gridSettings.next(settings);
  }
}

const SETTINGS_KEY = 'TODO-settings';
