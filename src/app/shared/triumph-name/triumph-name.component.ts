import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PlayerStateService } from '@app/player/player-state.service';
import { IconService } from '@app/service/icon.service';
import { TriumphRecordNode } from '@app/service/model';
import { NgIf, NgFor } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-triumph-name',
    templateUrl: './triumph-name.component.html',
    styleUrls: ['./triumph-name.component.scss'],
    standalone: true,
    imports: [NgIf, FaIconComponent, MatTooltip, NgFor]
})
export class TriumphNameComponent {
  @Input() cntr!: number|null;
  @Input() t!: TriumphRecordNode;
  @Input() debugmode!: boolean;
  @Input() hideOption!: boolean;
  @Output() navigate = new EventEmitter<string>();

  constructor(
    public iconService: IconService,
    public state: PlayerStateService) {

  }


  

}
