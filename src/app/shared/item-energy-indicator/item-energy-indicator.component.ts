import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ItemType, DamageType, EnergyType, InventoryItem } from '@app/service/model';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-item-energy-indicator',
  templateUrl: './item-energy-indicator.component.html',
  styleUrls: ['./item-energy-indicator.component.scss']

})
export class ItemEnergyIndicatorComponent{
  ItemType = ItemType;
  EnergyType = EnergyType;
  DamageType = DamageType;

  @Input() i: InventoryItem;

  constructor(public iconService: IconService) { }
}
