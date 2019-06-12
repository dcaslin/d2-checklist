import { Component, OnInit, Input } from '@angular/core';
import { InventoryPlug } from '@app/service/model';

@Component({
  selector: 'd2c-god-roll-plug',
  templateUrl: './god-roll-plug.component.html',
  styleUrls: ['./god-roll-plug.component.scss']
})
export class GodRollPlugComponent implements OnInit {

  @Input()
  highlightAllPerks: boolean;

  @Input()
  plug: InventoryPlug;

  @Input()
  debugmode: boolean;

  constructor() { }

  ngOnInit() {
  }

}
