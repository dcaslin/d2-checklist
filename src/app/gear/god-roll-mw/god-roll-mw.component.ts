import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { InventoryItem, ItemType } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-god-roll-mw',
  templateUrl: './god-roll-mw.component.html',
  styleUrls: ['./god-roll-mw.component.scss']
})
export class GodRollMwComponent {
  ItemType = ItemType;

  @Input()
  item: InventoryItem;

  @Input()
  debugmode: boolean;

  constructor(public iconService: IconService) { }

}
