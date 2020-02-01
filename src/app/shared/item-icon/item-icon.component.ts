import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ItemType, DamageType, EnergyType, InventoryItem } from '@app/service/model';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-item-icon',
  templateUrl: './item-icon.component.html',
  styleUrls: ['./item-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemIconComponent  {
  ItemType = ItemType;
  EnergyType = EnergyType;
  DamageType = DamageType;

  @Input() i: InventoryItem;
  @Input() option: ItemType;

  @Output() toggleLock = new EventEmitter<boolean>();

  constructor(public iconService: IconService) { }
}
