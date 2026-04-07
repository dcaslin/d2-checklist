import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { MilestoneActivity } from '@app/service/model';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgFor, NgIf } from '@angular/common';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-burn-dialog',
    templateUrl: './burn-dialog.component.html',
    styleUrls: ['./burn-dialog.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, NgFor, NgIf]
})
export class BurnDialogComponent {
  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<BurnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MilestoneActivity) {
  }
}