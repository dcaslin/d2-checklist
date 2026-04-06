import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ClanTriumphGraphComponent } from '../clan-triumph-graph/clan-triumph-graph.component';
import { NgTemplateOutlet, NgIf, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-triumph-item-dialog',
    templateUrl: './clan-triumph-item-dialog.component.html',
    styleUrls: ['./clan-triumph-item-dialog.component.scss'],
    imports: [CdkScrollable, MatDialogContent, MatTabGroup, MatTab, MatTabLabel, FaIconComponent, ClanTriumphGraphComponent, NgTemplateOutlet, NgIf, NgFor, RouterLink, AsyncPipe, DecimalPipe]
})
export class ClanTriumphItemDialogComponent extends ChildComponent {
  sort: Sort = {
    name: 'pct',
    ascending: false
  };


  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<ClanTriumphItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public triumph: ClanSearchableTriumph) {
    super();

  }


  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortTriumphs(this.triumph, this.sort);
  }


  

}
