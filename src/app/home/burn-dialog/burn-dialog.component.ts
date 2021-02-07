import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { MilestoneActivity } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-burn-dialog',
  templateUrl: './burn-dialog.component.html',
  styleUrls: ['./burn-dialog.component.scss']
})
export class BurnDialogComponent implements OnInit {
  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<BurnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MilestoneActivity) {
  }

  ngOnInit() {
  }
}