import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, Inject } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { Router } from '@angular/router';
import { ChildComponent } from '@app/shared/child.component';
import { MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { Const, Player } from '@app/service/model';

@Component({
  selector: 'anms-bounties',
  templateUrl: './bounties.component.html',
  styleUrls: ['./bounties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountiesComponent extends ChildComponent implements OnInit {

  @Input() player: Player;

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef,
    public dialog: MatDialog,
    private router: Router) {
    super(storageService, ref);

  }


  ngOnInit() {
  }

  public openQuestDialog(quest: any): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    // dc.width = '500px';
    dc.data = quest;
    const dialogRef = this.dialog.open(QuestDialogComponent, dc);
  }


}

@Component({
  selector: 'anms-quest-dialog',
  templateUrl: './quest-dialog.component.html',
  styleUrls: ['./quest-dialog.component.scss']
})
export class QuestDialogComponent {
  public const: Const = Const;
  constructor(
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

}
