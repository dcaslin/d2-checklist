import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { QuestDialogComponent } from '@app/player/pursuits/pursuit-list/quest-dialog/quest-dialog.component';
import { IconService } from '@app/service/icon.service';
import { Questline } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { ChildComponent } from '@app/shared/child.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';
import { NgIf, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MilestoneCheckComponent } from '../../shared/milestone-check/milestone-check.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatAnchor } from '@angular/material/button';
import { AgoHumanizedPipe } from '../../shared/pipe/timing.pipe';


@Component({
    selector: 'd2c-uber-row-dialog',
    templateUrl: './uber-row-dialog.component.html',
    styleUrls: ['./uber-row-dialog.component.scss'],
    imports: [NgIf, MatDialogTitle, CdkScrollable, MatDialogContent, NgFor, MatTabGroup, MatTab, MilestoneCheckComponent, MatProgressBar, FaIconComponent, MatAnchor, AsyncPipe, DecimalPipe, AgoHumanizedPipe]
})
export class UberRowDialogComponent extends ChildComponent {

  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<UberRowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: (MilestoneRow | PursuitRow)) {
      super();
    }

  public openQuestDialog(quest: Questline): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = quest;
    this.dialog.open(QuestDialogComponent, dc);
  }

}
