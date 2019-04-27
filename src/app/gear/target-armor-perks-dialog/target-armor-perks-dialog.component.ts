import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GearComponent } from '../gear/gear.component';

@Component({
  selector: 'anms-target-armor-perks-dialog',
  templateUrl: './target-armor-perks-dialog.component.html',
  styleUrls: ['./target-armor-perks-dialog.component.scss']
})
export class TargetArmorPerksDialogComponent implements OnInit {
  parent: GearComponent;

  constructor(
    public dialogRef: MatDialogRef<TargetArmorPerksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
  }
  ngOnInit() {
  }

}
