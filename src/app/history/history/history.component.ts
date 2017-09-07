import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService, Platform, ActivityMode } from "../../service/bungie.service";
import { Character } from "../../service/parse.service";
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { MdPaginator, MdSort } from '@angular/material';

@Component({
  selector: 'anms-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  private unsubscribe$: Subject<void> = new Subject<void>();

  loading: boolean = false;
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


  displayedColumns = ['period', 'desc', 'completed'];

  constructor(private bungieService: BungieService, private route: ActivatedRoute) {
    this.platforms = bungieService.getPlatforms();
    this.activityModes = bungieService.getActivityModes();
    this.selectedMode = this.activityModes[0];
    this.maxResults = [100, 200, 500, 1000, 2000];
    this.selectedMaxResults = this.maxResults[0];
  }

  public history() {
    this.loading = true;
    this.bungieService.getActivityHistory(this.membershipType, this.membershipId, this.characterId, this.selectedMode.type, this.selectedMaxResults).then((rows:any[]) => {

      this.database.setData(rows);
      this.loading = false;
    }).catch((x) => {
      this.loading = false;
    });
  }

  private sub: any;
  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);

    this.sub = this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      const platform: string = params['platform'];
      if (platform == null) return;
      let selPlatform = null;
      this.platforms.forEach((p: Platform) => {
        if ((p.type + "") == platform) {
          selPlatform = p;
        }
        else if (p.desc.toLowerCase() == platform.toLowerCase()) {
          selPlatform = p;
        }
      });

      if (selPlatform != null) {
        this.membershipType = selPlatform.type;
        this.membershipId = params['memberId'];
        this.characterId = params['characterId'];
        this.history();
      }

    });
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
