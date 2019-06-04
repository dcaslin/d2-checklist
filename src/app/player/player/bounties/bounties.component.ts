import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { Const, Player } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

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
    private bungieService: BungieService,
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
