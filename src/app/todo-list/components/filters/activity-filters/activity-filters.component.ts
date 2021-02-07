import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Presentational component
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-activity-filters',
  templateUrl: './activity-filters.component.html',
  styleUrls: ['./activity-filters.component.scss']
})
export class ActivityFiltersComponent { }
