import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { InventoryItem } from '@app/service/model';

@Component({
  selector: 'd2c-god-roll-item',
  templateUrl: './god-roll-item.component.html',
  styleUrls: ['./god-roll-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GodRollItemComponent implements OnInit {

  @Input()
  item: InventoryItem;


  constructor() { }

  ngOnInit() {
  }

}
