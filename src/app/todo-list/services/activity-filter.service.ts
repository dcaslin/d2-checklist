import { GridApi } from '@ag-grid-community/core';
import { Injectable } from '@angular/core';
import { Destroyable } from '@app/util/destroyable';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { ActivityRow } from '../interfaces/activity.interface';


/**
 * Responsible for building the filters and then
 * providing those filters as external filters for ag-grid
 */
@Injectable()
export class ActivityFilterService extends Destroyable {

  /**
   * An array of filter functions that rows need to pass to be shown in the grid
   */
  public filterFunctions: ((row: ActivityRow) => boolean)[] = [];
  public saveSettingsFunctions: (() => void)[] = [];
  public clearFilterFunctions: (() => void)[] = [];
  /**
   * Whether or not there are items that have been ignored/filtered
   */
  public filtersActive: Observable<boolean>;
  private update: Subject<void> = new Subject();
  private api: GridApi;
  private filtersActiveSource = new BehaviorSubject(undefined);
  private filterStates: { [key: string]: boolean } = {};

  constructor() {
    super();
    this.filtersActive = this.filtersActiveSource
      .pipe(distinctUntilChanged((a, b) => a === b));
    /**
     * If we get a bunch of rapid-fire requests to change the filters,
     * this will ease the load and send at MAX 1 request every debounce period
     */
    this.update.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => this.updateTableFilters());

    /**
     * We want to save the filters to the browser storage, but not quite as often
     * as we want to update filters. This is a more expensive operation (maybe), but
     * most importantly, we can delay this a good bit and not impact user experience
     */
    this.update.pipe(
      debounceTime(5000),
      takeUntil(this.destroy$)
    ).subscribe(() => this.saveFilterSettings());
  }

  /**
   * Apply updates to the table.
   * Call this when you want the filters to take effect.
   */
  public pushUpdatesToTable() {
    this.update.next();
  }

  public registerGrid(api: GridApi) {
    this.api = api;
  }

  /**
   * Child services should call this to indicate that they have active filters
   * or do not have active filters.
   */
  public updateFilterStatus(hasFilters: boolean, source: string) {
    this.filterStates[source] = hasFilters;
    // if any of the filter sources are filtering
    const filtering = Object.values(this.filterStates).some(x => !!x)
    this.filtersActiveSource.next(filtering);
  }

  public clearFilters() {
    this.clearFilterFunctions.forEach(clear => clear());
  }

  /**
   * Tell AG-Grid that we have new filters so that it re-checks the grid rows
   */
  private updateTableFilters() {
    if (this.api) { this.api.onFilterChanged(); }
    else { console.error('Filters not applied, is the grid ready??') }
  }

  /**
   * Runs the row through all the filter types we have. The row passes filters
   * only if it passes ALL filters
   */
  public doesRowPassFilters(row: ActivityRow): boolean {
    for (let filterPasses of this.filterFunctions) {
      if (!filterPasses(row)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calls the save function of all registered save functions
   * We could look into only saving the settings for the service that
   * pushed updates. This filters service system could be cleaned up to
   * use base classes, but it works right now
   */
  private saveFilterSettings() {
    this.saveSettingsFunctions.forEach(save => save());
  }
}
