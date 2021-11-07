import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { MarkService } from '@app/service/mark.service';
import { DamageType, EnergyType, InventoryItem, ItemType, Target } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-item-icon',
  templateUrl: './item-icon.component.html',
  styleUrls: ['./item-icon.component.scss']
})
export class ItemIconComponent  {
  ItemType = ItemType;
  EnergyType = EnergyType;
  DamageType = DamageType;

  @Input() i: InventoryItem;
  @Input() mark: string|null;
  @Input() option: ItemType;
  @Input() hideMenu = false;

  @Output() toggleLock = new EventEmitter<boolean>();
  @Output() pullPostmaster = new EventEmitter<boolean>();
  @Output() equip = new EventEmitter<boolean>();
  @Output() transfer = new EventEmitter<Target>();

  constructor(public iconService: IconService, public markService: MarkService) { }


}
