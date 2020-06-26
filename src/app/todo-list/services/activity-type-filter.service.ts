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
      this.filterService.pushUpdatesToTable(); // apply filters initially when loaded
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
    this.filterService.pushUpdatesToTable();
  }

  /**
   * Does the row pass the active rewards filters?
   */
  private doesRowPassTypeFilters(row: ActivityRow): boolean {
    return this.typesMap[row.icon].d2cActive;
  }

  public loadFilterSettings() {
    this.settings = this.storage.getItem(TYPE_KEY);
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
        d2cActive: this.settings ? !!this.settings[row.icon] : true
      };
      tempArr.push(activityTypeObj);
    });
    tempArr = this.sortActivityTypeFilters(tempArr);
    tempArr.forEach(item => this.typesMap[item.icon] = item)
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
      if (item.d2cActive) {
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
