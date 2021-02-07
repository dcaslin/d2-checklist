
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { ActivityMode, Const, Player } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent extends ChildComponent implements OnInit, OnDestroy {

  readonly activityModes: ActivityMode[];
  maxResults: number[];
  selectedMaxResults: number;
  selectedMode: ActivityMode;

  membershipType: number;
  membershipId: string;
  characterId: string;

  public _player: BehaviorSubject<Player> = new BehaviorSubject(null);

  database = new SortFilterDatabase([]);
  dataSource: SortFilterDataSource | null;
  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  displayedColumns = ['period', 'mode', 'name', 'kd', 'timePlayedSeconds'];

  constructor(storageService: StorageService, private bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.activityModes = bungieService.getActivityModes();
    this.selectedMode = this.activityModes[0];
    this.maxResults = [100, 200, 500, 1000, 2000];
    this.selectedMaxResults = this.maxResults[0];
  }

  public async history() {
    this.loading.next(true);
    try {
      const rows = await this.bungieService.getActivityHistory(this.membershipType, this.membershipId, this.characterId,
        this.selectedMode.type, this.selectedMaxResults);
      this.paginator.firstPage();
      this.database.setData(rows);
    }
    finally {
      this.loading.next(false);
    }
  }

  pgcr(instanceId: string) {

    this.router.navigate(['/pgcr', instanceId]);
  }

  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);

    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const platform: string = params['platform'];

      this.database.setData([]);
      if (platform == null) { return; }

      const selPlatform = Const.PLATFORMS_DICT[platform];

      if (selPlatform != null) {
        this.membershipType = selPlatform.type;
        this.membershipId = params['memberId'];
        this.bungieService.getChars(this.membershipType, this.membershipId, ['Profiles', 'Characters'], false).then(p => {
          this._player.next(p);

        });
        this.characterId = params['characterId'];
        this.history();
      }

    });
  }

}
