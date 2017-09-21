import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import {Http, Response} from '@angular/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { MdPaginator, MdSort } from '@angular/material';
import { DurationPipe } from 'angular2-moment';
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
  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;

  displayedColumns = ['end'];

  constructor(storageService: StorageService, private http:Http, private router: Router) {
    super(storageService);
  
  }
  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  getData() {
    return this.http.get("/assets/leviathan.json").map((res:Response) => {
      this.database.setData(res.json());
    }).toPromise().catch(
      function (err) {
          console.dir(err);
      });
  }

  private sub: any;
  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);
    this.database.setData([]);
    this.getData();
  }

}
