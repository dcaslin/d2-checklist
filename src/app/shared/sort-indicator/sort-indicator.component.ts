import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-sort-indicator',
    templateUrl: './sort-indicator.component.html',
    styleUrls: ['./sort-indicator.component.scss'],
    standalone: true,
    imports: [NgIf, FaIconComponent]
})
export class SortIndicatorComponent {

  @Input() field!: string;
  @Input() currVal!: string;
  @Input() descending!: boolean;

  constructor(public iconService: IconService) { }

}
