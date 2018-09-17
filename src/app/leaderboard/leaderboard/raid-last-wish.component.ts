
import { merge, fromEvent as observableFromEvent, Subject, Observable, of as observableOf, forkJoin } from 'rxjs';

import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { catchError, map, startWith, switchMap, flatMap } from 'rxjs/operators';
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { MatPaginator, MatSort, PageEvent } from '@angular/material';
import { DurationPipe } from 'ngx-moment';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-raid-last-wish',
  templateUrl: './raid-last-wish.component.html',
  styleUrls: ['./raid-last-wish.component.scss']
})
export class RaidLastWishComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  dao: LastWishDao | null;
  data: Row[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  isLoadingResults = true;
  tempFilter: string = null;
  filter: string = null;

  readonly manualPage$ = new Subject<PageEvent>();

  @ViewChild('paginatorTop') paginatorTop: MatPaginator;
  @ViewChild('paginatorBottom') paginatorBottom: MatPaginator;

  readonly LAUNCH_DATE = "2018-09-14T21:00:00.000Z";
  filterName: string;

  displayedColumns = ['rank', 'fireteam', 'end', 'duration',];

  constructor(storageService: StorageService, private httpClient: HttpClient, private router: Router, private route: ActivatedRoute) {
    super(storageService);

  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  search() {
    if (this.tempFilter!=null && this.tempFilter.trim().length>2){
      this.filter = this.tempFilter.toUpperCase();
      const pe = new PageEvent();
      pe.pageIndex = 0;
      this.manualPage$.next(pe);
    }
  }

  clear(){
    this.filter = null;
    this.tempFilter = null;
    const pe = new PageEvent();
    pe.pageIndex = 0;
    this.manualPage$.next(pe);  
  }

  ngOnInit() {
    this.dao = new LastWishDao(this.httpClient);

    const s = this.route.snapshot.paramMap.get('page');
    let p = parseInt(s);
    if (!(p >= 1 && p < 100000)) {
      p = 1;
    }
    const init = new PageEvent();
    init.pageIndex = p - 1;



    merge(this.paginatorBottom.page, this.paginatorTop.page, this.manualPage$)
      .pipe(
        startWith(init),
        switchMap((pe: PageEvent) => {
          this.isLoadingResults = true;
          this.pageIndex = pe.pageIndex;
          this.paginatorBottom.pageIndex = pe.pageIndex;
          this.paginatorTop.pageIndex = pe.pageIndex;
          this.router.navigate(["leaderboard/last-wish/" + (this.pageIndex + 1)]);
          if (this.filter!=null && this.filter.trim().length>0){
            return this.dao!.search(this.filter, 100, 2000);
          }
          else{
            return this.dao!.get(this.pageIndex, this.pageSize, this.filter);
          }
        }),
        catchError(() => {
          return observableOf(null);
        })
      ).subscribe(data => {
        this.isLoadingResults = false;
        if (data == null) {
          this.total = 0;
          this.data = [];
        }
        //off the end
        else if (this.pageIndex * this.pageSize > data.total) {
          this.total = data.total;
          const lastPage = Math.ceil(data.total / this.pageSize);
          const lastPageEvent = new PageEvent();
          lastPageEvent.pageIndex = lastPage - 1;
          this.manualPage$.next(lastPageEvent);
        }
        else {
          this.data = data.rows;
          this.total = data.total;
        }

      });
  }
}

/** An example database that the data source uses to retrieve data for the table. */
export class LastWishDao {
  constructor(private http: HttpClient) { }

  search(filter: string, size: number, max: number): Observable<Rows> {
    return this.get(0, size, filter).pipe(
      flatMap((data: Rows) => {
        const realMax = Math.min(data.total, max);
        const obs = [];
        obs.push(observableOf(data));
        let curPage = 1;
        while (true) {
          if (curPage * size > realMax) {
            break;
          }
          obs.push(this.get(curPage, size, filter));
          curPage++;
        }
        return forkJoin(obs);
      }),
      map((d:Rows[])=>{
        if (d.length==0){
          return {
            rows: [],
            total: 0
          };
        }
        else{
          let rows = [];
          for (let r of d){
            rows = rows.concat(r.rows);
          }
          let total = 0;
          return {
            rows: rows,
            total: rows.length
          };
        }
      })
    );
  }

  get(page: number, size: number, filter?: string): Observable<Rows> {
    const href = 'https://api.trialsofthenine.com/lastwish';
    const requestUrl = `${href}?page=${page}&size=${size}`;

    return this.http.get<_LastWishRep>(requestUrl).pipe(map(data => {
      return this.transform(page, size, data, filter);
    }
    ));
  }

  transform(page: number, pageSize: number, resp: _LastWishRep, filter?: string): Rows {
    const rankStart = page * pageSize;
    return {
      rows: this.transformRows(rankStart, resp.matches, filter),
      total: resp.total
    }
  }

  transformRows(rankStart: number, rows: _Row[], filter?: string): Row[] {
    const returnMe: Row[] = [];
    let rank = rankStart;
    for (const r of rows) {
      rank++;
      const row = this.transformRow(rank, r, filter);
      if (row != null) returnMe.push(row);
    }
    return returnMe;
  }

  transformRow(rank: number, row: _Row, filter?: string): Row {
    const fireTeam: Player[] = [];
    let match = false;
    if (filter == null || filter.length == 0) match = true;
    for (const p of row.players) {
      if (!match && p.displayName.toUpperCase().includes(filter)) {
        match = true;
      }
      fireTeam.push(this.transformPlayer(row.twitch, p));
    }
    if (!match){
       return null;
    }
    return {
      start: row.period,
      end: row.completedAt,
      pgcr: row.instanceId,
      membershipType: row.membershipType,
      duration: row.duration, //TODO this is broken
      fireTeam: fireTeam,
      rank: rank
    }
  }

  transformPlayer(twitchUrls: any, row: _Player): Player {
    return {
      membershipId: row.membershipId,
      displayName: row.displayName,
      kills: row.kills,
      twitchUrls: twitchUrls[row.membershipId]
    }
  }

}

interface _LastWishRep {
  matches: _Row[];
  total: number;
}

interface _Row {
  instanceId: string;
  period: string;
  completedAt: string;
  membershipType: number;
  map: string;
  mode: number;
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  players: _Player[];
  twitch: any;
}

interface Rows {
  rows: Row[];
  total: number;
}


interface Row {
  start: string;
  end: string;
  pgcr: string;
  duration: number;
  fireTeam: Player[];
  rank: number;
  membershipType: number;
}

interface _Player {
  displayName: string;
  membershipId: string;
  characterId: string;
  completed: number;
  kills: number;
  deaths: number;
  assists: number;
}


interface Player {
  membershipId: string;
  displayName: string;
  kills: number;
  twitchUrls: string[];
}