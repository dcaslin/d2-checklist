import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TogglableItem } from '@app/todo-list/interfaces/filter.interface';
import { ActivityRewardFilterService } from '@app/todo-list/services/activity-reward-filter.service';
import { Destroyable } from '@app/util/destroyable';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-activity-reward-filters',
  templateUrl: './activity-reward-filters.component.html',
  styleUrls: ['../filters-styles.scss']
})
export class ActivityRewardFiltersComponent extends Destroyable {

  public rewards: TogglableItem[] = [];

  constructor(
    private activityFilter: ActivityRewardFilterService
  ) {
    super();
    this.activityFilter.rewards.pipe(
      takeUntil(this.destroy$)
    ).subscribe((rewards) => {
      this.rewards = rewards;
    });
  }

  public toggleReward(reward: TogglableItem) {
    // since this is from a shallow-cloned array, this affects
    // the same objects in the filter service.
    // No need to emit or pash in an array as a param
    reward.d2cActive = !reward.d2cActive;
    this.activityFilter.pushUpdatesToTable();
  }

  public ignoreAll() {
    this.rewards.forEach((reward) => {
      reward.d2cActive = false;
    });
    this.activityFilter.pushUpdatesToTable();
  }

  public enableAll() {
    this.rewards.forEach((reward) => {
      reward.d2cActive = true;
    });
    this.activityFilter.pushUpdatesToTable();
  }

  public showGear() {
    this.rewards.forEach((reward) => {
      reward.d2cActive = reward.displayProperties.name.toLowerCase().includes('gear');
    });
    this.activityFilter.pushUpdatesToTable();
  }
}
