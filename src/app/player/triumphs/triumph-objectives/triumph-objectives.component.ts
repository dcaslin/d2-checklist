import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Const, TriumphRecordNode } from '@app/service/model';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumph-objectives',
  templateUrl: './triumph-objectives.component.html',
  styleUrls: ['./triumph-objectives.component.scss']
})
export class TriumphObjectivesComponent implements OnInit {
  @Input() triumph: TriumphRecordNode;

  constructor(public iconService: IconService) { }

  ngOnInit() {
  }

}
