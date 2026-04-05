import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { ClanAggHistoryEntry, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ClanLifetimeGraphComponent } from '../clan-lifetime-graph/clan-lifetime-graph.component';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TimingPipe } from '../../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-lifetime-dialog',
    templateUrl: './clan-lifetime-dialog.component.html',
    styleUrls: ['./clan-lifetime-dialog.component.scss'],
    standalone: true,
    imports: [CdkScrollable, MatDialogContent, MatTabGroup, MatTab, MatTabLabel, FaIconComponent, ClanLifetimeGraphComponent, NgIf, NgFor, RouterLink, TimingPipe, DecimalPipe]
})
export class ClanLifetimeDialogComponent extends ChildComponent {
  sort: Sort = {
    name: 'name',
    ascending: true
  };

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortAggHistory(this.entry, this.sort);

  }

  public toInt(s: string): number {
    return +s;
  }

  constructor(
    public iconService: IconService, 
    public dialogRef: MatDialogRef<ClanLifetimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public entry: ClanAggHistoryEntry) {
      super();
      ClanStateService.sortAggHistory(this.entry, this.sort);
    }

}
