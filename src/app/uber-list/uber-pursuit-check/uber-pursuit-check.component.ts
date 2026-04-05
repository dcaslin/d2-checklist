import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { PursuitTuple } from '@app/service/model';
import { NgIf, DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { AgoHumanizedPipe } from '../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-uber-pursuit-check',
    templateUrl: './uber-pursuit-check.component.html',
    styleUrls: ['./uber-pursuit-check.component.scss'],
    standalone: true,
    imports: [NgIf, MatIcon, MatProgressBar, FaIconComponent, MatTooltip, DecimalPipe, AgoHumanizedPipe]
})
export class UberPursuitCheckComponent {
  @Input() pursuit!: PursuitTuple;

  constructor(public iconService: IconService) { }


}
