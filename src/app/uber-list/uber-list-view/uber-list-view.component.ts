import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { ChildComponent } from '@app/shared/child.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';
import { UberRowDialogComponent } from '../uber-row-dialog/uber-row-dialog.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { SignedOnLoadingIconComponent } from '../../shared/signed-on-loading-icon/signed-on-loading-icon.component';
import { SortIndicatorComponent } from '../../shared/sort-indicator/sort-indicator.component';
import { MatTooltip } from '@angular/material/tooltip';
import { UberPursuitCheckComponent } from '../uber-pursuit-check/uber-pursuit-check.component';
import { MilestoneCheckComponent } from '../../shared/milestone-check/milestone-check.component';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-uber-list-view',
    templateUrl: './uber-list-view.component.html',
    styleUrls: ['./uber-list-view.component.scss'],
    standalone: true,
    imports: [NgIf, MatButtonToggleGroup, NgFor, MatButtonToggle, MatButton, FaIconComponent, MatCheckbox, FormsModule, SignedOnLoadingIconComponent, SortIndicatorComponent, MatTooltip, UberPursuitCheckComponent, MilestoneCheckComponent, AsyncPipe]
})
export class UberListViewComponent extends ChildComponent {

  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    private dialog: MatDialog,
    public iconService: IconService,
    ) {
    super();
  }

  public show(event: Event, row: (MilestoneRow | PursuitRow)): void {
    event.preventDefault();
    const dc = new MatDialogConfig();
    dc.data = row;
    this.dialog.open(UberRowDialogComponent, dc);
  }


}
