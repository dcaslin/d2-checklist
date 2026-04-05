import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { NgIf, NgStyle } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-god-roll-item',
    templateUrl: './god-roll-item.component.html',
    styleUrls: ['./god-roll-item.component.scss'],
    standalone: true,
    imports: [NgIf, NgStyle, FaIconComponent, MatTooltip]
})
export class GodRollItemComponent {

  @Input()
  vertical = false;

  @Input()
  simple = false;


  @Input()
  item!: InventoryItem;


  @Input()
  debugmode!: boolean;

  constructor(public iconService: IconService) { }

  

}
