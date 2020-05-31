import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { InventoryItem } from '@app/service/model';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-god-roll-item',
  templateUrl: './god-roll-item.component.html',
  styleUrls: ['./god-roll-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GodRollItemComponent implements OnInit {

  @Input()
  vertical = false;

  @Input()
  item: InventoryItem;


  @Input()
  debugmode: boolean;

  constructor(public iconService: IconService) { }

  ngOnInit() {
  }

}
