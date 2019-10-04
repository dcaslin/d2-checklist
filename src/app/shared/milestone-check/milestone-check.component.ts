

import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Const, Character, MileStoneName } from '@app/service/model';

@Component({
  selector: 'd2c-milestone-check',
  templateUrl: './milestone-check.component.html',
  styleUrls: ['./milestone-check.component.scss']
})
export class MilestoneCheckComponent implements OnInit {
  public Const = Const;

  @Input() char: Character;
  @Input() mileStoneName: MileStoneName;
  @Input() detailed: boolean = false;

  constructor() { }

  ngOnInit() {
  }

}
