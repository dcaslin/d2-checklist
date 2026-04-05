import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { NgIf, NgTemplateOutlet, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { PlayerEfficiencyGraphComponent } from './player-efficiency-graph/player-efficiency-graph.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { TimingPipe } from '../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-lifetime',
    templateUrl: './lifetime.component.html',
    styleUrls: ['./lifetime.component.scss'],
    standalone: true,
    imports: [NgIf, MatTabGroup, MatTab, PlayerEfficiencyGraphComponent, NgTemplateOutlet, FaIconComponent, NgFor, MatTooltip, TimingPipe, AsyncPipe, DecimalPipe]
})
export class LifetimeComponent extends ChildComponent {

  constructor(
    public iconService: IconService,
    public state: PlayerStateService,
    public weekService: WeekService,
    public dialog: MatDialog) {
      super();
    }

}
