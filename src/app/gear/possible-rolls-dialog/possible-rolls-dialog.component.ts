import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { InventoryItem } from '@app/service/model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GearComponent } from '../gear/gear.component';

@Component({
  selector: 'd2c-possible-rolls-dialog',
  templateUrl: './possible-rolls-dialog.component.html',
  styleUrls: ['../gear/gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class PossibleRollsDialogComponent implements OnInit {

  item: InventoryItem;
  parent: GearComponent;
  constructor(
    public dialogRef: MatDialogRef<PossibleRollsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.item = data.item;
    this.parent = data.parent;
  }

  ngOnInit() {
  }

}
