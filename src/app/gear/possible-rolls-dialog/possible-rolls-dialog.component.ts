import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ClipboardService } from 'ngx-clipboard';
import { GearComponent } from '../gear/gear.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-possible-rolls-dialog',
  templateUrl: './possible-rolls-dialog.component.html',
  styleUrls: ['../gear/gear.component.scss']

})
export class PossibleRollsDialogComponent {

  item: InventoryItem;
  parent: GearComponent;
  godrolls: string[] = [];
  maxPlugs = 0;
  constructor(
    public iconService: IconService,
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


  

}
