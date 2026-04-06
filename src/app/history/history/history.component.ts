
import { ChangeDetectionStrategy, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { ActivityMode, Const, Player } from '@app/service/model';
import { ChildComponent } from '../../shared/child.component';
import { SortFilterDatabase, SortFilterDataSource } from '../../shared/sort-filter-data';
import { IconService } from '@app/service/icon.service';
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, AsyncPipe, DecimalPipe, DatePipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatTable, MatHeaderCell, MatCell, MatHeaderRow, MatRow } from '@angular/material/table';
import { CdkColumnDef, CdkHeaderCellDef, CdkCellDef, CdkHeaderRowDef, CdkRowDef } from '@angular/cdk/table';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TimingPipe } from '../../shared/pipe/timing.pipe';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
    standalone: true,
    imports: [NgIf, MatProgressSpinner, RouterLink, NgFor, MatAnchor, MatFormField, MatSelect, FormsModule, MatOption, MatButton, MatIcon, MatTable, MatSort, CdkColumnDef, CdkHeaderCellDef, MatHeaderCell, MatSortHeader, CdkCellDef, MatCell, FaIconComponent, CdkHeaderRowDef, MatHeaderRow, CdkRowDef, MatRow, MatPaginator, TimingPipe, AsyncPipe, DecimalPipe, DatePipe]
})
export class HistoryComponent extends ChildComponent implements OnInit {

  readonly activityModes: ActivityMode[];
  maxResults: number[];
  selectedMaxResults: number;
  selectedMode: ActivityMode;

  membershipType!: number;
  membershipId!: string;
  characterId!: string;

  public _player: BehaviorSubject<Player | null> = new BehaviorSubject<Player | null>(null);

  database = new SortFilterDatabase([]);
  dataSource!: SortFilterDataSource | null;
  @ViewChild('paginator', {static: true}) paginator!: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort!: MatSort;

  displayedColumns = ['period', 'mode', 'name', 'kd', 'timePlayedSeconds'];

  constructor(private bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, private router: Router) {
    super();
    this.activityModes = BungieService.getActivityModes();
    this.selectedMode = this.activityModes[0];
    this.maxResults = [100, 200, 500, 1000, 2000];
    this.selectedMaxResults = this.maxResults[0];
  }

  public async history() {
    this.loading.set(true);
    try {
      const rows = await this.bungieService.getActivityHistory(this.membershipType, this.membershipId, this.characterId,
        this.selectedMode.type, this.selectedMaxResults);
      this.paginator.firstPage();
      this.database.setData(rows);
    }
    finally {
      this.loading.set(false);
    }
  }

  pgcr(instanceId: string) {

    this.router.navigate(['/pgcr', instanceId]);
  }

  ngOnInit() {
    this.dataSource = new SortFilterDataSource(this.database, this.paginator, this.sort);

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const platform: string = params['platform'];

      this.database.setData([]);
      if (platform == null) { return; }

      const selPlatform = (Const.PLATFORMS_DICT as any)[platform];

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
