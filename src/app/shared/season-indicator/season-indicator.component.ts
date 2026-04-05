import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { NgIf } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-season-indicator',
    templateUrl: './season-indicator.component.html',
    styleUrls: ['./season-indicator.component.scss'],
    standalone: true,
    imports: [NgIf, MatTooltip, FaIconComponent]
})
export class SeasonIndicatorComponent {
  @Input() season!: number|null;

  constructor(public iconService: IconService) { }


}
