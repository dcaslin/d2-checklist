import { Component, OnInit, ChangeDetectionStrategy, Inject } from '@angular/core';
import { InventoryItem, InventoryPlug } from '@app/service/model';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GearComponent } from '../gear/gear.component';
import { NotificationService } from '@app/service/notification.service';
import { ClipboardService } from 'ngx-clipboard';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-possible-rolls-dialog',
  templateUrl: './possible-rolls-dialog.component.html',
  styleUrls: ['../gear/gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class PossibleRollsDialogComponent implements OnInit {

  item: InventoryItem;
  parent: GearComponent;
  godrolls: string[] = [];
  maxPlugs = 0;
  constructor(
    public iconService: IconService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<PossibleRollsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.item = data.item;
    this.parent = data.parent;
    for (const s of this.item.sockets) {
      if (s.possiblePlugs.length > this.maxPlugs) {
        this.maxPlugs = s.possiblePlugs.length;
      }
    }
  }

  makeArray(n: number): any[] {
    return Array(n);
  }


  ngOnInit() {
  }

}
