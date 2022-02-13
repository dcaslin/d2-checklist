import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';
import { UberRowDialogComponent } from '../uber-row-dialog/uber-row-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-uber-list-builder',
  templateUrl: './uber-list-builder.component.html',
  styleUrls: ['./uber-list-builder.component.scss']
})
export class UberListBuilderComponent extends ChildComponent {

  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    private dialog: MatDialog,
    public iconService: IconService,
    storageService: StorageService
  ) {
    super(storageService);
  }


  refresh(): void {
    this.state.refresh();
  }
  

  public show(event, row: (MilestoneRow | PursuitRow)): void {
    event.preventDefault();
    const dc = new MatDialogConfig();
    dc.data = row;
    this.dialog.open(UberRowDialogComponent, dc);
  }



}
