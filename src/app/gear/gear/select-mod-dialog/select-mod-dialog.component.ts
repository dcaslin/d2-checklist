import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ManifestInventoryItem } from '@app/service/destiny-cache.service';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { EnergyType, InventoryItem, InventorySocket } from '@app/service/model';

@Component({
  selector: 'd2c-select-mod-dialog',
  templateUrl: './select-mod-dialog.component.html',
  styleUrls: ['./select-mod-dialog.component.scss']
})
export class SelectModDialogComponent {
  public item: InventoryItem;
  public socket: InventorySocket;
  public EnergyType = EnergyType;

  constructor(
    public gearService: GearService,
    public iconService: IconService,
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

  canFit(plug: ManifestInventoryItem): boolean {
    const current = this.socket.active.energyCost;
    const newCost = plug.plug?.energyCost?.energyCost || 0;
    const change = newCost - current;
    return (change + this.item.energyUsed) <= this.item.energyCapacity;
  }

  select(plug: ManifestInventoryItem) {
    if (!this.item.canFit(this.socket, plug)) {
      return;
    }
    this.gearService.insertFreeSocketForArmorMod(this.item, this.socket, plug);
  }

}
