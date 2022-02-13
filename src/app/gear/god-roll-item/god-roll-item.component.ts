import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-god-roll-item',
  templateUrl: './god-roll-item.component.html',
  styleUrls: ['./god-roll-item.component.scss']
})
export class GodRollItemComponent {

  @Input()
  vertical = false;

  @Input()
  simple = false;


  @Input()
  item: InventoryItem;


  @Input()
  debugmode: boolean;

  constructor(public iconService: IconService) { }

  

}
