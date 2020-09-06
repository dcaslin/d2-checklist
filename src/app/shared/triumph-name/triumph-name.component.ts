import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { ChildComponent } from '../child.component';
import { StorageService } from '@app/service/storage.service';
import { IconService } from '@app/service/icon.service';
import { PlayerStateService } from '@app/player/player-state.service';
import { TriumphRecordNode } from '@app/service/model';

@Component({
  selector: 'd2c-triumph-name',
  templateUrl: './triumph-name.component.html',
  styleUrls: ['./triumph-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphNameComponent implements OnInit {
  @Input() cntr: number|null;
  @Input() t: TriumphRecordNode;
  @Input() debugmode: boolean;
  @Input() hideOption: boolean;
  @Output() navigate = new EventEmitter<string>();

  constructor(
    public iconService: IconService,
    public state: PlayerStateService) {

  }


  ngOnInit(): void {
  }

}
