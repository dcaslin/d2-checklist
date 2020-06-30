import { Injectable } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { Destroyable } from '@app/util/destroyable';
import { ReplaySubject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { ActivityRow } from '../interfaces/activity.interface';
import { TogglableRowItem } from '../interfaces/filter.interface';
import { ActivityCatalogService } from './activity-catalog.service';
import { ActivityFilterService } from './activity-filter.service';


/**
 * Responsible for building the filters and then
 * providing those filters as external filters for ag-grid
 */
@Injectable()
export class ActivityTypeFilterService extends Destroyable {

  /**
   * Represents all the possible reward items that are in the table
   */
  public types: ReplaySubject<TogglableRowItem[]> = new ReplaySubject(1);

  /**
   * the key is the icon URL (lol it works though)
   * TODO this falls apart with Spider, who has different icons for various weekly
   * bounties he has. Find a way to preserve filter status for spider
   */
  private typesMap: { [key: string]: TogglableRowItem } = {};
  private settings: TypeSettings;

  constructor(
    private actvityCatalog: ActivityCatalogService,
    private storage: StorageService,
    private filterService: ActivityFilterService
  ) {
    super();
    this.actvityCatalog.activityRows.pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    ).subscribe((rows: ActivityRow[]) => {
      this.extractTypesFromRowData(rows);
      this.types.next(Object.values(this.typesMap));
      this.pushUpdatesToTable(); // apply filters initially when loaded
    });
    this.loadFilterSettings();

    // register filter method with the main filter service
    this.filterService.filterFunctions.push((row) => this.doesRowPassTypeFilters(row));
    this.filterService.saveSettingsFunctions.push(() => this.saveTypesFilters());
  }

  /**
   * Apply updates to the table.
   * Call this when you want the filters to take effect.
   */
  public pushUpdatesToTable() {
    const filtering = Object.values(this.typesMap)
      .some(item => item.d2cActive === false);
    this.filterService.updateFilterStatus(filtering);
    this.filterService.pushUpdatesToTable();
  }

  /**
   * Does the row pass the active rewards filters?
   */
  private doesRowPassTypeFilters(row: ActivityRow): boolean {
    return this.typesMap[row.icon].d2cActive;
  }

  public loadFilterSettings() {
    let settings = this.storage.getItem(TYPE_KEY);
    if (!!settings && Object.keys(settings).length === 0) {
      // filter object saved, but there were no active filters. Assume it was a bug
      // this is no longer needed with the current strategy of only saving hidden state filters
      // ideally, we would want to ignore the settings if EVERYTHING is set to hidden, which
      // was the original purpose of this logic. TODO
      settings = undefined;
    }
    this.settings = settings;
  }

  /**
   * Populate the list of unique rewards offered by all the activities
   */
  private extractTypesFromRowData(rows: ActivityRow[]) {
    this.typesMap = {};
    let tempArr: TogglableRowItem[] = [];
    rows.forEach((row: ActivityRow) => {
      const activityTypeObj = {
        ...row,
        // do this to prevent setting everything to false by default when no settings were loaded 
        d2cActive: this.settings ? !this.settings[row.icon] : true
      };
      tempArr.push(activityTypeObj);
    });
    tempArr = this.sortActivityTypeFilters(tempArr);
    tempArr.forEach(item => this.typesMap[item.icon] = item);
  }

  private sortActivityTypeFilters(unsorted: TogglableRowItem[]): TogglableRowItem[] {
    // default sort sorts by the icon column (currently vendor grouping), then
    // subsorts by the activity details (daily vs weekly)
    return unsorted.sort((a, b) => a.iconSort.localeCompare(b.iconSort)
      || (a.detailSubText.localeCompare(b.detailSubText) * -1));
  }

  /**
   * Only store active types filters. Saves a little space.
   * We will store filters by { [icon]: true }[]
   * So it would like
   * [
   *  { '[spider daily icon]': true},
   *  { '[shaxx weekly icon]': true}
   *  ...
   * ]
   */
  private saveTypesFilters() {
    const compressedMap = {};
    Object.values(this.typesMap).forEach(item => {
      // save filters that are NOT active. This is a better experience if new rewards/types
      // become available. By default, we want those new things to be shown, not hidden.
      // so by specifying all the things we want hidden, then everything else will be shown
      if (!item.d2cActive) {
        compressedMap[item.icon] = true;
      };
    })
    this.storage.setItem(TYPE_KEY, compressedMap);
  }
}

/**
 * keyed by reward name
 */
interface TypeSettings {
  [key: string]: boolean;
}

const TYPE_KEY = 'FILTERS-types'
