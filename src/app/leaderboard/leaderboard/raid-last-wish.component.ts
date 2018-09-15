
import {fromEvent as observableFromEvent,  Subject ,  Observable } from 'rxjs';

import {debounceTime, takeUntil, distinctUntilChanged} from 'rxjs/operators';
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { MatPaginator, MatSort } from '@angular/material';
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

  database = new SortFilterDatabase([]);
  dataSource: SortFilterDataSource | null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  filterName: string;

  displayedColumns = ['rank', 'fireteam', 'end', 'duration',];

  constructor(storageService: StorageService, private httpClient: HttpClient, private router: Router, private route: ActivatedRoute) {
    super(storageService);

  }
  
  getAssetPath(): string{
    return "https://api.trialsofthenine.com/lastwish/";
    
    //return "/assets/last-wish.json";
  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  getData() {
    return this.httpClient.get<any>(this.getAssetPath())
    .toPromise()
    .then(data => {
      
      this.database.setData(this.transform(data));
    })
    .catch(
      function (err) {
        console.dir(err);
      });;
  }

  transform(rows: _Row[]): Row[]{
    const returnMe: Row[] = [];
    let rank = 0;
    for (const r of rows){
      rank++;
      returnMe.push(this.transformRow(rank, r));
    }
    return returnMe;
  }

  transformRow(rank: number, row: _Row): Row{
    const fireTeam: Player[] = [];
    for (const p of row.players){
      fireTeam.push(this.transformPlayer(p));
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
  
  transformPlayer(row: _Player): Player{
    return {
      membershipId: row.membershipId,
      displayName: row.displayName,
      kills: row.kills,
      twitchUrl: null
    }
  }

  private sub: any;
  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);
    this.database.setData([]);
    this.getData();
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(),)
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    this.sub = this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      let s = params['name'];
      if (s != null) {
        this.filter.nativeElement.value = s;
        this.dataSource.filter = s;
      }
    });
  }

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
  twitchUrl?: string;
}