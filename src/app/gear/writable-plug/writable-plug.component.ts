import { Component, Input } from '@angular/core';
import { GearService } from '@app/service/gear.service';
import { InventoryItem, InventoryPlug, InventorySocket } from '@app/service/model';

@Component({
  selector: 'd2c-writable-plug',
  templateUrl: './writable-plug.component.html',
  styleUrls: ['./writable-plug.component.scss']
})
export class WritablePlugComponent {

  @Input() item: InventoryItem;

  @Input() plug: InventoryPlug;

  @Input() socket: InventorySocket;

  @Input() debugmode: boolean;

  constructor(private gearService: GearService) { }

  selectWeaponPerkPlug() {
    this.gearService.insertFreeSocketForWeaponPerk(this.item, this.socket, this.plug);
  }
}
