import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Http, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { MatPaginator, MatSort } from '@angular/material';
import { DurationPipe } from 'angular2-moment';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Observable } from 'rxjs/Observable';

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

  displayedColumns = ['rank', 'fireteam', 'end', 'durationMs',];

  constructor(storageService: StorageService, private http: Http, private router: Router, private route: ActivatedRoute) {
    super(storageService);

  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }


  private loadPlayer(platform, gt) {
    this.router.navigate([platform, gt]);
  }

  getData() {
    return this.http.get("/assets/leviathan.json").map((res: Response) => {
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
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });

    this.sub = this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      let s = params['name'];
      if (s != null) {
        this.filter.nativeElement.value = s;
        this.dataSource.filter = s;
      }
    });
  }

}
