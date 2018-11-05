
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
  selector: 'anms-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  database = new SortFilterDatabase([]);
  dataSource: SortFilterDataSource | null;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;

  filterName: string;

  displayedColumns = ['rank', 'fireteam', 'end', 'durationMs', ];

  constructor(storageService: StorageService, private httpClient: HttpClient, private router: Router, private route: ActivatedRoute) {
    super(storageService);

  }

  getName(): string {
    return '';
  }

  getAssetPath(): string {
    return '';
  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  getData() {

    return this.httpClient.get<any>(this.getAssetPath())
    .toPromise()
    .then((data) => this.database.setData(data))
    .catch(
      function (err) {
        console.dir(err);
      }); ;
  }

  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);
    this.database.setData([]);
    this.getData();
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(), )
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const s = params['name'];
      if (s != null) {
        this.filter.nativeElement.value = s;
        this.dataSource.filter = s;
      }
    });
  }

}
