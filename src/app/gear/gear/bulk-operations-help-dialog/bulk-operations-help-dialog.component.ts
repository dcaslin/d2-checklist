import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-bulk-operations-help-dialog',
  templateUrl: './bulk-operations-help-dialog.component.html',
  styleUrls: ['./bulk-operations-help-dialog.component.scss']
})
export class BulkOperationsHelpDialogComponent {
  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<BulkOperationsHelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }
}
