import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BurnDialogComponent } from '@app/home/burn-dialog/burn-dialog.component';
import { IconService } from '@app/service/icon.service';
import { LostSector, MilestoneActivity } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { NgIf, NgFor } from '@angular/common';
import { MatListItem, MatListItemIcon, MatListItemLine } from '@angular/material/list';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-legendary-lost-sector',
    templateUrl: './legendary-lost-sector.component.html',
    styleUrls: ['./legendary-lost-sector.component.scss'],
    imports: [
        NgIf,
        MatListItem,
        MatListItemIcon,
        MatListItemLine,
        FaIconComponent,
        NgFor,
    ]
})
export class LegendaryLostSectorComponent extends ChildComponent {

  @Input()
  ls!: LostSector;

  constructor(
    public dialog: MatDialog,
    public iconService: IconService
  ) {
    super();
  }

  

  showBurns(msa: MilestoneActivity) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = msa;
    this.dialog.open(BurnDialogComponent, dc);
  }

  
}
