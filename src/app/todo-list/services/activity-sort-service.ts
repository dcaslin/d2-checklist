import { GridApi } from '@ag-grid-community/core';
import { Injectable } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { Destroyable } from '@app/util/destroyable';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';


/**
 * Responsible for saving and loading the sort state of the grid
 */
@Injectable()
export class ActivitySortService extends Destroyable {

  public update: Subject<void> = new Subject();
  private api: GridApi;

  constructor(private storage: StorageService) {
    super();

    /**
     * We want to save the sort state to the browser storage, but delayed.
     * It doesn't matter that much if it's instant.
     */
    this.update.pipe(
      debounceTime(5000),
      takeUntil(this.destroy$)
    ).subscribe(() => this.saveSortSettings());
  }

  /**
   * Tells the service that the sort has been changed. External facing method
   */
  public onSortChange() {
    this.update.next();
  }

  public registerGrid(api: GridApi) {
    this.api = api;
  }

  /**
   * Loads sort settings from local storage and applies them to the grid
   * Returns true if there were sort settings found
   */
  public loadSortSettings(): boolean {
    const settings = this.storage.getItem(SORT_KEY);
    if (settings?.length > 0) {
      this.api.setSortModel(settings);
    }
    return settings?.length > 0;
  }

  /**
   * Saves the current sort on the grid
   */
  private saveSortSettings() {
    const settings = this.api.getSortModel();
    if (settings?.length > 0) {
      this.storage.setItem(SORT_KEY, settings); 
    }
  }
}

const SORT_KEY = 'todo-sort';
