import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ClipboardService } from 'ngx-clipboard';
import { GearComponent } from '../gear/gear.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { GodRollPlugComponent } from '../god-roll-plug/god-roll-plug.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-possible-rolls-dialog',
    templateUrl: './possible-rolls-dialog.component.html',
    styleUrls: ['../gear/gear.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, NgIf, CdkScrollable, MatDialogContent, NgFor, GodRollPlugComponent, AsyncPipe]
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
