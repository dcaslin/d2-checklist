import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { InventoryItem, InventorySocket } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { SelectModDialogComponent } from '../gear/select-mod-dialog/select-mod-dialog.component';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { WritablePlugComponent } from '../writable-plug/writable-plug.component';

@Component({
    selector: 'd2c-writable-sockets',
    templateUrl: './writable-sockets.component.html',
    styleUrls: ['./writable-sockets.component.scss'],
    standalone: true,
    imports: [NgFor, NgIf, WritablePlugComponent, AsyncPipe]
})
export class WritableSocketsComponent extends ChildComponent {
  @Input() item!: InventoryItem;

  @Output() socketsChanged = new EventEmitter<boolean>();

  constructor(
    public dialog: MatDialog,
    ) {
    super();
  }

  selectMod(socket: InventorySocket): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      item: this.item,
      socket: socket
    };
    const dialogRef = this.dialog.open(SelectModDialogComponent, dc);
    dialogRef.afterClosed().subscribe(async (result) => {
      this.socketsChanged.emit(true);
    });
  }

}
