import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { ItemType, DamageType, InventoryItem } from '@app/service/model';
import { IconService } from '@app/service/icon.service';
import { NgIf } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-item-energy-indicator',
    templateUrl: './item-energy-indicator.component.html',
    styleUrls: ['./item-energy-indicator.component.scss'],
    standalone: true,
    imports: [NgIf, MatTooltip, FaIconComponent]
})
export class ItemEnergyIndicatorComponent{
  ItemType = ItemType;
  DamageType = DamageType;

  @Input() i!: InventoryItem;

  constructor(public iconService: IconService) { }
}
