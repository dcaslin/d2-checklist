import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EnergyType, InventoryItem, InventorySocket } from '@app/service/model';

@Component({
  selector: 'd2c-select-mod-dialog',
  templateUrl: './select-mod-dialog.component.html',
  styleUrls: ['./select-mod-dialog.component.scss']
})
export class SelectModDialogComponent implements OnInit {
  public item: InventoryItem;
  public socket: InventorySocket;
  public EnergyType = EnergyType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.item = data.item;
      this.socket = data.socket;
      // sort sourcePlugs by displayProperties.name
      this.socket.sourcePlugs.sort((a, b) => {
        if (a.displayProperties.name < b.displayProperties.name) {
            return -1;
        }
        if (a.displayProperties.name > b.displayProperties.name) {
            return 1;
        }
        return 0;
    });
  }

  ngOnInit(): void {
  }

  select(plug: InventoryItem) {
    console.log("Select");
  }

}
