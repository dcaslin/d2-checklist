import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { NgIf, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AgoHumanizedPipe, MinsHumanizedPipe } from '../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-chars',
    templateUrl: './chars.component.html',
    styleUrls: ['./chars.component.scss'],
    imports: [NgIf, NgFor, MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatTooltip, FaIconComponent, MatCardSubtitle, MatCardContent, AgoHumanizedPipe, MinsHumanizedPipe, AsyncPipe, DecimalPipe]
})
export class CharsComponent extends ChildComponent {

  constructor(
    public iconService: IconService,
    public state: PlayerStateService) {
    super();
  }
}
