import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { TriumphRecordNode } from '@app/service/model';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-triumph-objectives',
    templateUrl: './triumph-objectives.component.html',
    styleUrls: ['./triumph-objectives.component.scss'],
    imports: [NgIf, NgFor, FaIconComponent, MatProgressBar, DecimalPipe]
})
export class TriumphObjectivesComponent {
  @Input() triumph!: TriumphRecordNode;
  @Input() hideDesc = false;

  constructor(public iconService: IconService) { }

  

}
