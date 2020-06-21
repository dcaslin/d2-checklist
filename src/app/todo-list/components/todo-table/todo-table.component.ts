import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridOptions, ColDef, ValueGetterParams, GridReadyEvent, GridApi } from '@ag-grid-community/core';
import { BountyCatalogService } from '@app/todo-list/services/bounty-catalog.service';
import { Destroyable } from '@app/util/destroyable';
import { takeUntil, filter } from 'rxjs/operators';
import { Bounty, BountyCharInfo, SaleStatus } from '@app/todo-list/interfaces/vendor.interface';
import { IconRenderer } from '../grid-cell-renderers/icon-renderer.component';
import { Character } from '@app/todo-list/interfaces/player.interface';
import { ContextService } from '@app/todo-list/services/context-service';
import { ProgressRenderer } from '../grid-cell-renderers/progress-renderer.component';
import { DetailsRenderer } from '../grid-cell-renderers/details-renderer.component';
import { VendorRenderer } from '../grid-cell-renderers/vendor-renderer.component';

@Component({
  selector: 'd2c-todo-table',
  templateUrl: './todo-table.component.html',
  styleUrls: ['./todo-table.component.scss']
})
export class TodoTableComponent extends Destroyable implements OnInit {

  // ag grid shittttt
  public gridOptions: GridOptions = {};
  public colDefs: ColDef[];
  // public rowData: Bounty[];

  private api: GridApi;

  private chars: Character[];

  constructor(
    public bountyService: BountyCatalogService,
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
      ).subscribe( chars => {
        this.chars = chars;
        // since the grid columns depend on the characters, we can't initialize
        // the grid before we have the characters
        this.initColumnDefs();
        this.cdRef.markForCheck();
      });
  }

  private applyInitialSort() {
    const defaultSortModel = [
      { colId: 'vendor', sort: 'asc' }, // sort by vendor
      { colId: 'details', sort: 'asc' }, // subsort by bounty type
    ];
    this.api.setSortModel(defaultSortModel);
  }

  private initColumnDefs() {
    this.colDefs = [
      {
        valueGetter: (params: ValueGetterParams) => params.data.displayProperties.icon,
        cellRenderer: 'iconRenderer',
        colId: 'icon',
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
        comparator: (a, b) => a.itemTypeDisplayName.localeCompare(b.itemTypeDisplayName)
      },
      {
        valueGetter: (params: ValueGetterParams) => params.data,
        cellRenderer: 'vendorRenderer',
        headerName: 'Vendor',
        colId: 'vendor',
        width: 156,
        suppressSizeToFit: true,
        comparator: (a, b) => a.vendorName.localeCompare(b.vendorName)
      }
    ];

    this.addCharacterColumns();
  }

  private initializeGridOptions() {
    this.gridOptions = {
      defaultColDef: {
        filter: true, // set filtering on for all columns
        sortable: true,
        resizable: true,
      },
      frameworkComponents: {
        iconRenderer: IconRenderer,
        progressRenderer: ProgressRenderer,
        detailsRenderer: DetailsRenderer,
        vendorRenderer: VendorRenderer
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
      console.log('character:', char);
      const charColumn: ColDef = {
        headerName: `${char.className} - ${char.light}`,
        colId: char.characterId,
        valueGetter: params => {
          const charData = params.data.chars[char.characterId];
          return charData;
        },
        cellRenderer: 'progressRenderer',
        // Sort by expiration time
        // I could also see wanting to sort by progress (complete/incomplete/in_progress)
        comparator: (a: BountyCharInfo, b: BountyCharInfo) => this.charColComparator(a, b)
      };
      this.colDefs.push(charColumn);
    });
  }

  /**
   * Sort by expiration date, subsort by sale status
   */
  private charColComparator(a: BountyCharInfo, b: BountyCharInfo): number {
    a = a || {} as BountyCharInfo;
    b = b || {} as BountyCharInfo;
    const aExp = a.expirationDate;
    const bExp = b.expirationDate;
    if (!aExp && !!bExp) { return 1 } // if a has no expiration and b has an expiration
    if (!!aExp && !bExp) { return -1 } // if b has no expiration and a has an expiration
    if (!aExp && !bExp) { // neither one has an expiration date, sub-sort by saleStatus
      const aSale = a.saleStatus;
      const bSale = b.saleStatus;
      if (aSale === SaleStatus.NOT_AVAILABLE && b.saleStatus === SaleStatus.NOT_AVAILABLE) { return 0 }
      if (aSale === SaleStatus.NOT_AVAILABLE) { return 1 }
      if (bSale === SaleStatus.NOT_AVAILABLE) { return -1 }
      if (aSale === undefined && bSale !== undefined) { return 1 }
      if (bSale === undefined && aSale !== undefined) { return -1 }
      return aSale - bSale;
    }
    return aExp.localeCompare(bExp);
  }

}
