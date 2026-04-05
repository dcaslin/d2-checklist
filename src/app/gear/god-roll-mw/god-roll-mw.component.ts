import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { InventoryItem, ItemType } from '@app/service/model';
import { NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-god-roll-mw',
    templateUrl: './god-roll-mw.component.html',
    styleUrls: ['./god-roll-mw.component.scss'],
    standalone: true,
    imports: [NgIf, FaIconComponent, MatTooltip, MatProgressBar]
})
export class GodRollMwComponent {
  ItemType = ItemType;

  @Input()
  item!: InventoryItem;

  @Input()
  debugmode!: boolean;

  constructor(public iconService: IconService) { }

}
