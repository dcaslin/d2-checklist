
import { merge, fromEvent as observableFromEvent, Subject, Observable, of as observableOf } from 'rxjs';

import { debounceTime, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
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

  ngOnInit() {
    this.dao = new LastWishDao(this.httpClient);

    const s = this.route.snapshot.paramMap.get('page');
    let p = parseInt(s);
    if (!(p >= 1 && p < 100000)) {
      p = 1;
    }
    const init = new PageEvent();
    init.pageIndex = p-1;


    const manualPage$ = new Subject<PageEvent>();

    merge(this.paginatorBottom.page, this.paginatorTop.page, manualPage$)
      .pipe(
        startWith(init),
        switchMap((pe: PageEvent) => {
          this.isLoadingResults = true;
          this.pageIndex = pe.pageIndex;
          this.paginatorBottom.pageIndex = pe.pageIndex;
          this.paginatorTop.pageIndex = pe.pageIndex;
          this.router.navigate(["leaderboard/last-wish/" + (this.pageIndex + 1)]);
          return this.dao!.get(this.pageIndex, this.pageSize);
        }),
        catchError(() => {
          return observableOf(null);
        })
      ).subscribe(data =>{ 
        this.isLoadingResults = false;
        if (data==null){
          this.total = 0;
          this.data = [];
        }
        //off the end
        else if (this.pageIndex*this.pageSize > data.total){
          const lastPage = Math.floor(data.total/this.pageSize);
          const lastPageEvent = new PageEvent();
          lastPageEvent.pageIndex = lastPage-1;
          manualPage$.next(lastPageEvent);
        }
        else{
          this.data = data.rows;
          this.total = data.total;
        }

      });
  }
}

/** An example database that the data source uses to retrieve data for the table. */
export class LastWishDao {
  constructor(private http: HttpClient) { }

  get(page: number, size: number): Observable<Rows> {
    console.log("Page: " + page + "     size: " + size);
    const href = 'http://api.trialsofthenine.com/lastwish';
    const requestUrl = `${href}?page=${page}&size=${size}`;

    return this.http.get<_LastWishRep>(requestUrl).pipe(map(data => {
      return this.transform(page, size, data);
    }
    ));
  }

  transform(page: number, pageSize: number, resp: _LastWishRep): Rows {
    const rankStart = page * pageSize;
    return {
      rows: this.transformRows(rankStart, resp.matches),
      total: resp.total
    }
  }

  transformRows(rankStart: number, rows: _Row[]): Row[] {
    const returnMe: Row[] = [];
    let rank = rankStart;
    for (const r of rows) {
      rank++;
      returnMe.push(this.transformRow(rank, r));
    }
    return returnMe;
  }

  transformRow(rank: number, row: _Row): Row {
    const fireTeam: Player[] = [];
    for (const p of row.players) {
      fireTeam.push(this.transformPlayer(row.twitch, p));
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