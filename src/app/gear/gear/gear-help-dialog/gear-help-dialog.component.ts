import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-gear-help-dialog',
    templateUrl: './gear-help-dialog.component.html',
    styleUrls: ['../gear.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent]
})
export class GearHelpDialogComponent {

  constructor(

    public iconService: IconService,
    public dialogRef: MatDialogRef<GearHelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

}
