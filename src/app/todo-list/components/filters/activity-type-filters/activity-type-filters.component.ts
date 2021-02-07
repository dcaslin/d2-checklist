import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityType, Timespan } from '@app/todo-list/interfaces/activity.interface';
import { TogglableRowItem } from '@app/todo-list/interfaces/filter.interface';
import { ActivityTypeFilterService } from '@app/todo-list/services/activity-type-filter.service';
import { Destroyable } from '@app/util/destroyable';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-activity-type-filters',
  templateUrl: './activity-type-filters.component.html',
  styleUrls: ['../filters-styles.scss']
})
export class ActivityTypeFiltersComponent extends Destroyable {

  public types: TogglableRowItem[] = [];
  public Timespan = Timespan; // for template
  public ActivityType = ActivityType; // for template

  constructor(
    private activityFilter: ActivityTypeFilterService
  ) {
    super();
    this.activityFilter.types.pipe(
      takeUntil(this.destroy$)
    ).subscribe((types) => {
      this.types = types;
    });
  }

  public toggleActivityType(type: TogglableRowItem) {
    // since this is from a shallow-cloned array, this affects
    // the same objects in the filter service.
    // No need to emit or pash in an array as a param
    type.d2cActive = !type.d2cActive;
    this.activityFilter.pushUpdatesToTable();
  }

  public ignoreAll() {
    this.types.forEach((type) => {
      type.d2cActive = false;
    });
    this.activityFilter.pushUpdatesToTable();
  }

  public enableAll() {
    this.types.forEach((type) => {
      type.d2cActive = true;
    });
    this.activityFilter.pushUpdatesToTable();
  }

  public showTimespan(timespan: Timespan) {
    this.types.forEach((type) => {
      type.d2cActive = type.timespan === timespan;
    });
    this.activityFilter.pushUpdatesToTable();
  }

  public showType(type: ActivityType) {
    this.types.forEach((item) => {
      item.d2cActive = item.type === type;
    });
    this.activityFilter.pushUpdatesToTable();
  }
}
