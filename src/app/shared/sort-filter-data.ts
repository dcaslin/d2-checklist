
import { merge as observableMerge, BehaviorSubject, Observable } from 'rxjs';

import { map } from 'rxjs/operators';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator, MatSort } from '@angular/material';

export class SortFilterDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  get data(): any[] {
    return this.dataChange.value;
  }

  constructor(items: any[]) {
    this.dataChange.next(items);
  }

  setData(items: any[]) {
    this.dataChange.next(items);
  }

}

export class SortFilterDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject('');

  constructor(private _exampleDatabase: SortFilterDatabase, private _paginator: MatPaginator, private _sort: MatSort) {
    super();
  }


  get filter(): string {
    return this._filterChange.value;
  }

  set filter(filter: string) {
    this._filterChange.next(filter);
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<any[]> {
    const displayDataChanges = [
      this._exampleDatabase.dataChange,
      this._paginator.page,
      this._filterChange,
      this._sort.sortChange
    ];

    return observableMerge(...displayDataChanges).pipe(map(() => {
      let data = this._exampleDatabase.data.slice();

      // filter if needed
      if (this.filter != null && this.filter.length > 0) {
        data = this._exampleDatabase.data.slice().filter((item: any) => {
          const searchStr = JSON.stringify(item).toLowerCase();
          return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
        });
      }
      // sort if needed
      if (this._sort.active && this._sort.direction !== '') {
        data = data.sort((a, b) => {
          let propertyA: number | string;
          let propertyB: number | string;
          [propertyA, propertyB] = [a[this._sort.active], b[this._sort.active]];
          // const valueA = propertyA==null||isNaN(+propertyA) ? propertyA : +propertyA;
          // const valueB = propertyB!=null&&isNaN(+propertyB) ? propertyB : +propertyB;
          let returnMe = 0;
          if (propertyA == null && propertyB != null) {
            returnMe = -1;
          } else if (propertyA != null && propertyB == null) {
            returnMe = 1;
          } else if (propertyA < propertyB) {
            returnMe = -1;
          } else if (propertyA > propertyB) {
            returnMe = 1;
          }
          if (this._sort.direction === 'asc') { returnMe = -1 * returnMe; }
          // const returnMe =  (valueA < valueB ? -1 : 1) * (this._sort.direction === 'desc' ? 1 : -1);
          return returnMe;
        });
      }

      // Grab the page's slice of data.
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      return data.splice(startIndex, this._paginator.pageSize);
    }));
  }

  disconnect() {
  }
}
