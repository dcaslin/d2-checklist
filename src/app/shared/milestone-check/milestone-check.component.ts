import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { Const, MilestoneStatus } from '@app/service/model';
import { NgIf, NgFor } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { MatProgressBar } from '@angular/material/progress-bar';



@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-milestone-check',
    templateUrl: './milestone-check.component.html',
    styleUrls: ['./milestone-check.component.scss'],
    imports: [NgIf, NgFor, FaIconComponent, MatTooltip, MatProgressBar],
    providers: [
        {
            provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
            useValue: {
                disableTooltipInteractivity: true
            },
        }
    ]
})
export class MilestoneCheckComponent {
  public Const = Const;

  @Input() milestone!: MilestoneStatus;
  @Input() detailed = false;

  constructor(public iconService: IconService) { }

  

}
