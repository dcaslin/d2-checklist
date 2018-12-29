
import { merge, Subject, Observable, of as observableOf } from 'rxjs';

import { takeUntil,  catchError, map, switchMap, flatMap } from 'rxjs/operators';
import { Component,  OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { MatPaginator, PageEvent } from '@angular/material';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

export class LastWishDao {
  constructor(private http: HttpClient) { }

  search(filter: string): Observable<Rows> {
    const href = 'https://api.trialsofthenine.com/lastwish';
    const requestUrl = `${href}?filter=${filter}`;

    return this.http.get<PrivLastWishRep>(requestUrl).pipe(map(data => {
      return this.transform(0, 1000, data, null);
    }));
  }

  get(page: number, size: number, filter?: string): Observable<Rows> {
    const href = 'https://api.trialsofthenine.com/lastwish';
    const requestUrl = `${href}?page=${page}&size=${size}`;

    return this.http.get<PrivLastWishRep>(requestUrl).pipe(map(data => {
      return this.transform(page, size, data, filter);
    }
    ));
  }

  transform(page: number, pageSize: number, resp: PrivLastWishRep, filter?: string): Rows {
    const rankStart = page * pageSize;
    return {
      rows: this.transformRows(rankStart, resp.matches, filter),
      total: resp.total
    }
  }

  transformRows(rankStart: number, rows: PrivRow[], filter?: string): Row[] {
    const returnMe: Row[] = [];
    let rank = rankStart;
    for (const r of rows) {
      rank++;
      const row = this.transformRow(rank, r, filter);
      if (row != null) { returnMe.push(row); }
    }
    return returnMe;
  }

  transformRow(rank: number, row: PrivRow, filter?: string): Row {
    const fireTeam: Player[] = [];
    let match = false;
    if (filter == null || filter.length === 0) { match = true; }
    for (const p of row.players) {
      if (!match && p.displayName.toUpperCase().includes(filter)) {
        match = true;
      }
      fireTeam.push(this.transformPlayer(row.twitch, p));
    }
    if (!match) {
      return null;
    }
    let actualRank = rank;
    if (row.rank != null) { actualRank = row.rank; }
    return {
      start: row.period,
      end: row.completedAt,
      pgcr: row.instanceId,
      membershipType: row.membershipType,
      duration: row.duration, // TODO this is broken
      fireTeam: fireTeam,
      rank: actualRank
    }
  }

  transformPlayer(twitchUrls: any, row: PrivPlayer): Player {
    return {
      membershipId: row.membershipId,
      displayName: row.displayName,
      kills: row.kills,
      twitchUrls: twitchUrls[row.membershipId]
    }
  }

}

interface PrivLastWishRep {
  matches: PrivRow[];
  total: number;
}

interface PrivRow {
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
  players: PrivPlayer[];
  rank: number;
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

interface PrivPlayer {
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


@Component({
  selector: 'anms-raid-last-wish',
  templateUrl: './raid-last-wish.component.html',
  styleUrls: ['./raid-last-wish.component.scss']
})
export class RaidLastWishComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  dao: LastWishDao | null;
  dataRows: Row[] = [];
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  isLoadingResults = true;
  tempFilter: string = null;
  filter: string = null;

  readonly manualPage$ = new Subject<PageEvent>();
  readonly navigate$ = new Subject<string[]>();

  @ViewChild('paginatorTop') paginatorTop: MatPaginator;
  @ViewChild('paginatorBottom') paginatorBottom: MatPaginator;

  readonly LAUNCH_DATE = '2018-09-14T21:00:00.000Z';
  filterName: string;

  displayedColumns = ['rank', 'fireteam', 'end', 'duration', ];

  constructor(storageService: StorageService, private httpClient: HttpClient, private router: Router,
    private route: ActivatedRoute) {
    super(storageService);

  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  search() {
    if (this.tempFilter != null && this.tempFilter.trim().length > 3) {
      this.router.navigate(['leaderboard', 'last-wish', 'search', this.tempFilter]);
    }
  }

  clear() {
    this.router.navigate(['leaderboard', 'last-wish', 1]);
  }


  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  ngOnInit() {
      this.dao = new LastWishDao(this.httpClient);

      // this.route.paramMap.pipe(
      //   switchMap((params: ParamMap) => {
      //     const q = this.route.snapshot.paramMap.get('query');
      //     let p = 1;
      //     if (q != null && q.trim().length > 3) {
      //       this.filter = q;
      //       this.tempFilter = q;
      //     } else {
      //       const s = this.route.snapshot.paramMap.get('page');
      //       p = parseInt(s, 10);
      //       if (!(p >= 1 && p < 100000)) {
      //         this.router.navigate(['leaderboard', 'last-wish', 1]);
      //         return observableOf('rerouted');
      //       }
      //       this.filter = null;
      //       this.tempFilter = null;
      //     }

      //     this.isLoadingResults = true;
      //     this.pageIndex = p - 1;
      //     this.paginatorBottom.pageIndex = this.pageIndex;
      //     this.paginatorTop.pageIndex = this.pageIndex;
      //     if (this.filter != null && this.filter.trim().length > 0) {
      //       return this.dao!.search(this.filter.toUpperCase());
      //     } else {
      //       return this.dao!.get(this.pageIndex, this.pageSize, this.filter);
      //     }
      //   }),
      //   catchError(() => {
      //     return observableOf(null);
      //   })).subscribe(data => {
      //     this.isLoadingResults = false;
      //     if ('rerouted' === data) {
      //       return;
      //     }
      //     if (data == null) {
      //       this.total = 0;
      //       this.dataRows = [];
      //     } else if (this.pageIndex * this.pageSize > data.total) {
      //       const lastPage = Math.ceil(data.total / this.pageSize);
      //       this.router.navigate(['leaderboard', 'last-wish', lastPage]);
      //     } else {
      //       this.dataRows = data.rows;
      //       this.total = data.total;
      //     }
      //   });

      merge(this.paginatorBottom.page, this.paginatorTop.page).pipe(
        switchMap((pe: ParamMap) => {
          return observableOf(pe);
        }
        ),
        catchError(() => {
          return observableOf(null);
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(pe => {
        if (pe == null) { return; }
        this.router.navigate(['leaderboard', 'last-wish', pe.pageIndex + 1]);
      });
  }
}

