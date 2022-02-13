import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QuestDialogComponent } from '@app/player/pursuits/pursuit-list/quest-dialog/quest-dialog.component';
import { IconService } from '@app/service/icon.service';
import { Questline } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';


@Component({
  selector: 'd2c-uber-row-dialog',
  templateUrl: './uber-row-dialog.component.html',
  styleUrls: ['./uber-row-dialog.component.scss']
})
export class UberRowDialogComponent extends ChildComponent {

  constructor(
    storageService: StorageService,
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<UberRowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: (MilestoneRow | PursuitRow)) {
      super(storageService);
    }

  public openQuestDialog(quest: Questline): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = quest;
    this.dialog.open(QuestDialogComponent, dc);
  }

}
