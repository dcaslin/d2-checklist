import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InventoryItem, InventorySocket } from '@app/service/model';

@Component({
  selector: 'd2c-select-mod-dialog',
  templateUrl: './select-mod-dialog.component.html',
  styleUrls: ['./select-mod-dialog.component.scss']
})
export class SelectModDialogComponent implements OnInit {
  public item: InventoryItem;
  public socket: InventorySocket;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.item = data.item;
      this.socket = data.socket;
  }

  ngOnInit(): void {
  }

}
