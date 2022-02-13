import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-season-indicator',
  templateUrl: './season-indicator.component.html',
  styleUrls: ['./season-indicator.component.scss']
})
export class SeasonIndicatorComponent {
  @Input() season: number|null;

  constructor(public iconService: IconService) { }


}
