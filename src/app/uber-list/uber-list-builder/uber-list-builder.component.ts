import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { ChildComponent } from '@app/shared/child.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';
import { UberRowDialogComponent } from '../uber-row-dialog/uber-row-dialog.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { UberListToggleComponent } from '../uber-list-toggle/uber-list-toggle.component';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FaIconComponent, FaStackComponent, FaStackItemSizeDirective } from '@fortawesome/angular-fontawesome';
import { MatCheckbox } from '@angular/material/checkbox';
import { SignedOnLoadingIconComponent } from '../../shared/signed-on-loading-icon/signed-on-loading-icon.component';
import { SortIndicatorComponent } from '../../shared/sort-indicator/sort-indicator.component';
import { MatTooltip } from '@angular/material/tooltip';
import { UberPursuitCheckComponent } from '../uber-pursuit-check/uber-pursuit-check.component';
import { MilestoneCheckComponent } from '../../shared/milestone-check/milestone-check.component';
import { SignInRequiredComponent } from '../../shared/sign-in-required/sign-in-required.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-uber-list-builder',
    templateUrl: './uber-list-builder.component.html',
    styleUrls: ['./uber-list-builder.component.scss'],
    standalone: true,
    imports: [NgIf, UberListToggleComponent, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatIcon, MatButton, FaIconComponent, MatCheckbox, FaStackComponent, FaStackItemSizeDirective, SignedOnLoadingIconComponent, SortIndicatorComponent, NgFor, MatTooltip, UberPursuitCheckComponent, MilestoneCheckComponent, SignInRequiredComponent, MatProgressSpinner, AsyncPipe]
})
export class UberListBuilderComponent extends ChildComponent {

  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    private dialog: MatDialog,
    public iconService: IconService,
    
  ) {
    super();
  }


  refresh(): void {
    this.state.refresh();
  }
  

  public show(event: Event, row: (MilestoneRow | PursuitRow)): void {
    event.preventDefault();
    const dc = new MatDialogConfig();
    dc.data = row;
    this.dialog.open(UberRowDialogComponent, dc);
  }



}
