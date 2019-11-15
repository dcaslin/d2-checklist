import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IconService } from '@app/service/icon.service';
import { MilestoneActivity } from '@app/service/model';

@Component({
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