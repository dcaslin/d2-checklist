import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Progression } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { ProgressStepDialogComponent } from './progress-step-dialog/progress-step-dialog.component';
import { NgIf, NgFor, AsyncPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-progress',
    templateUrl: './progress.component.html',
    styleUrls: ['./progress.component.scss'],
    standalone: true,
    imports: [NgIf, NgFor, MatTooltip, MatButton, MatProgressBar, MatTabGroup, MatTab, AsyncPipe, DecimalPipe, PercentPipe]
})
export class ProgressComponent extends ChildComponent {
  constructor(
    public state: PlayerStateService,
    public dialog: MatDialog) {
      super();
    }

  

  public openStepDialog(faction: Progression): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = faction;
    dc.maxWidth = '500px';
    this.dialog.open(ProgressStepDialogComponent, dc);
  }


}
