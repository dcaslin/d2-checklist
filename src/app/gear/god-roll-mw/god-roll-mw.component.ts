import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { InventoryItem, ItemType } from '@app/service/model';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-god-roll-mw',
  templateUrl: './god-roll-mw.component.html',
  styleUrls: ['./god-roll-mw.component.scss']
})
export class GodRollMwComponent implements OnInit {
  ItemType = ItemType;

  @Input()
  item: InventoryItem;

  @Input()
  debugmode: boolean;

  constructor(public iconService: IconService) { }

  ngOnInit(): void {
  }

}
