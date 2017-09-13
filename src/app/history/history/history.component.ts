import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { Character, Platform, ActivityMode, Const } from "../../service/model";
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { MdPaginator, MdSort } from '@angular/material';
import { DurationPipe } from 'angular2-moment';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  platforms: Platform[];
  activityModes: ActivityMode[];
  maxResults: number[];
  selectedMaxResults: number;
  selectedMode: ActivityMode;

  membershipType: number;
  membershipId: string;
  characterId: string;

  database = new SortFilterDatabase([]);
  dataSource: SortFilterDataSource | null;
  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild(MdSort) sort: MdSort;

  displayedColumns = ['period', 'mode', 'name', 'timePlayedSeconds'];

  constructor(storageService: StorageService, private bungieService: BungieService, private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.activityModes = bungieService.getActivityModes();
    this.selectedMode = this.activityModes[0];
    this.maxResults = [100, 200, 500, 1000, 2000];
    this.selectedMaxResults = this.maxResults[0];
  }

  public history() {
    this.loading = true;
    this.bungieService.getActivityHistory(this.membershipType, this.membershipId, this.characterId, this.selectedMode.type, this.selectedMaxResults).then((rows: any[]) => {

      this.database.setData(rows);
      this.loading = false;
    }).catch((x) => {
      this.loading = false;
    });
  }

  pgcr(instanceId: string) {

    this.router.navigate(['/pgcr', instanceId]);
  }

  private sub: any;
  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);

    this.sub = this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      const platform: string = params['platform'];

      this.database.setData([]);
      if (platform == null) return;

      let selPlatform = Const.PLATFORMS_DICT[platform];
      
      if (selPlatform != null) {
        this.membershipType = selPlatform.type;
        this.membershipId = params['memberId'];
        this.characterId = params['characterId'];
        this.history();
      }

    });
  }

}
