import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { ItemType, DamageType, EnergyType, InventoryItem, Player, Target } from '@app/service/model';
import { IconService } from '@app/service/icon.service';
import { GearComponent } from '@app/gear';

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
  @Output() pullPostmaster = new EventEmitter<boolean>();
  @Output() equip = new EventEmitter<boolean>();
  @Output() transfer = new EventEmitter<Target>();

  constructor(public iconService: IconService) { }
}
