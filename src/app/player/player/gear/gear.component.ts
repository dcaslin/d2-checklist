import { Component, Input } from '@angular/core';

import { InventoryItem, ItemType} from '../../../service/model';

@Component({
    selector: 'anms-gear',
    templateUrl: './gear.component.html',
    styleUrls: ['./Gear.component.scss']
  })
  export class GearComponent {
    @Input() gear: InventoryItem[];

    ItemType = ItemType;

}
