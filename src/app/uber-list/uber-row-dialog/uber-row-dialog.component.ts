import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';


@Component({
  selector: 'd2c-uber-row-dialog',
  templateUrl: './uber-row-dialog.component.html',
  styleUrls: ['./uber-row-dialog.component.scss']
})
export class UberRowDialogComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<UberRowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: (MilestoneRow | PursuitRow)) {
      super(storageService);
    }

  ngOnInit() {
  }

}
