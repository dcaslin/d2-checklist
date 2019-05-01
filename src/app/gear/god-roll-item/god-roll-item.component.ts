import { Component, OnInit, Input } from '@angular/core';
import { InventoryItem } from '@app/service/model';

@Component({
  selector: 'anms-god-roll-item',
  templateUrl: './god-roll-item.component.html',
  styleUrls: ['./god-roll-item.component.scss']
})
export class GodRollItemComponent implements OnInit {

  @Input()
  item: InventoryItem;


  constructor() { }

  ngOnInit() {
  }

}
