import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { share, takeUntil } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';

/**
 * The whole point of this service is to be a single source of truth
 * for the second-hand tick of a clock.
 * This is to synchronize all the countdown timers in the app instead
 * of having them slightly off from one another because they're all backed
 * by different timers
 */
@Injectable()
export class SecondService extends Destroyable {

  public seconds: Observable<any> = timer(0, 1000).pipe(share(), takeUntil(this.destroy$));

  constructor() {
    super();
  }

}
