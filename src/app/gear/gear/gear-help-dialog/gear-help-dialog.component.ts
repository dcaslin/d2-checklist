import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gear-help-dialog',
  templateUrl: './gear-help-dialog.component.html',
  styleUrls: ['../gear.component.scss']
})
export class GearHelpDialogComponent {

  constructor(

    public iconService: IconService,
    public dialogRef: MatDialogRef<GearHelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

}
