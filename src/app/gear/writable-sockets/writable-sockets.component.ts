import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { InventoryItem, InventorySocket } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { SelectModDialogComponent } from '../gear/select-mod-dialog/select-mod-dialog.component';

@Component({
  selector: 'd2c-writable-sockets',
  templateUrl: './writable-sockets.component.html',
  styleUrls: ['./writable-sockets.component.scss']
})
export class WritableSocketsComponent extends ChildComponent implements OnInit {
  @Input() item: InventoryItem;

  constructor(
    public dialog: MatDialog,
    public storageService: StorageService) {
    super(storageService);
  }

  ngOnInit(): void {
  }

  selectMod(socket: InventorySocket): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      item: this.item,
      socket: socket
    };
    this.dialog.open(SelectModDialogComponent, dc);
  }

}
