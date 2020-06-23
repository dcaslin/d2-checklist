import { ColDef, GridApi, GridOptions, GridReadyEvent, ValueGetterParams } from '@ag-grid-community/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivityCharInfo } from '@app/todo-list/interfaces/activity.interface';
import { Character } from '@app/todo-list/interfaces/player.interface';
import { ActivityCatalogService } from '@app/todo-list/services/activity-catalog.service';
import { ContextService } from '@app/todo-list/services/context-service';
import { Destroyable } from '@app/util/destroyable';
import { filter, takeUntil } from 'rxjs/operators';

import { DetailsRenderer } from '../grid-cell-renderers/details-renderer.component';
import { IconRenderer } from '../grid-cell-renderers/icon-renderer.component';
import { ProgressRenderer } from '../grid-cell-renderers/progress-renderer.component';
import { RewardRenderer } from '../grid-cell-renderers/reward-renderer.component';

@Component({
  selector: 'd2c-todo-table',
  templateUrl: './todo-table.component.html',
  styleUrls: ['./todo-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoTableComponent extends Destroyable implements OnInit {

  // ag grid variables
  public gridOptions: GridOptions = {};
  public colDefs: ColDef[];
  private api: GridApi;

  private chars: Character[];

  constructor(
    public activityService: ActivityCatalogService,
    private context: ContextService,
    private cdRef: ChangeDetectorRef
  ) {
    super();
    this.subToChars();
    this.initializeGridOptions();
  }

  ngOnInit(): void {
  }

  public onGridReady(event: GridReadyEvent) {
    this.api = event.api;
    this.applyInitialSort();
  }

  private subToChars() {
    this.context.characters.pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    ).subscribe(chars => {
      this.chars = chars;
      // since the grid columns depend on the characters, we can't initialize
      // the grid before we have the characters
      this.initColumnDefs();
      this.cdRef.markForCheck();
    });
  }

  private applyInitialSort() {
    // TODO
    // const defaultSortModel = [
    //   { colId: 'reward', sort: 'asc' }, // sort by vendor
    //   { colId: 'details', sort: 'asc' }, // subsort by bounty type
    // ];
    // this.api.setSortModel(defaultSortModel);
  }

  private initColumnDefs() {
    this.colDefs = [
      {
        field: 'icon',
        cellRenderer: 'iconRenderer',
        width: 84, // 48 (icon) + 17 * 2 (padding) + 1 * 2 (border)
        filter: false,
        sortable: false,
        resizable: false,
        suppressSizeToFit: true,
      },
      {
        valueGetter: (params: ValueGetterParams) => params.data,
        cellRenderer: 'detailsRenderer',
        headerName: 'Activity Details',
        colId: 'details',
        comparator: (a, b) => a.detailSubText.localeCompare(b.detailSubText) * -1 // want weekly on top
      },
      { // TODO: performance is stutter-y when scrolling, probably due to the large amount of icons
        // add an option to toggle off icon rendering? Would need to replace with something more performance-friendly
        //
        // Another option could be to disable viewport-rendering. Ag-grid by default only renders (and initializes)
        // rows in and immediately around the current visible window. If we force it to render all the rows initially,
        // then the performance hit would be worse up-front, but scrolling would be smoother because it
        // wouldn't be destroying and initializing these expensive-to-initialize components
        valueGetter: (params: ValueGetterParams) => params.data,
        cellRenderer: 'rewardRenderer',
        headerName: 'Reward(s)',
        colId: 'reward',
        width: 124,
        suppressSizeToFit: true,
        resizable: false,
        comparator: (a, b) => a.rewardSort.localeCompare(b.rewardSort)
      }
    ];

    this.addCharacterColumns();
  }

  private initializeGridOptions() {
    this.gridOptions = {
      defaultColDef: {
        sortable: true,
        resizable: true,
      },
      frameworkComponents: {
        iconRenderer: IconRenderer,
        progressRenderer: ProgressRenderer,
        detailsRenderer: DetailsRenderer,
        rewardRenderer: RewardRenderer
      },
      rowHeight: 70, // icons = 48px + 2 cell border + 20 padding (10 on top and bottom)
      onFirstDataRendered: () => {
        this.applyInitialSort();
        this.api.sizeColumnsToFit();
      }
    }
  }

  private addCharacterColumns() {
    this.chars.forEach((char: Character) => {
      const charColumn: ColDef = {
        headerName: `${char.className} - ${char.light}`,
        colId: char.characterId,
        valueGetter: params => params.data.charInfo[char.characterId],
        cellRenderer: 'progressRenderer',
        comparator: (a, b) => this.charColComparator(a, b)
      };
      this.colDefs.push(charColumn);
    });
  }

  /**
   * When sorted, `expirationDate` is top priority, then completion `status`
   */
  private charColComparator(a: ActivityCharInfo, b: ActivityCharInfo): number {
    const aExp = a.expirationDate;
    const bExp = b.expirationDate;
    if (aExp && bExp) {
      return aExp.localeCompare(bExp);
    }
    return a.progress.status - b.progress.status;
  }

}
