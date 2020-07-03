import { Injectable } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { BehaviorSubject } from 'rxjs';

import { Destroyable } from '../../util/destroyable';

/**
 * Handles various other settings for the grid
 */
@Injectable()
export class GridSettingsService extends Destroyable {

  public compact: BehaviorSubject<boolean> = new BehaviorSubject(false);

  // TODO store and load settings from previous session
  constructor(private storage: StorageService) {
    super();
  }

  /**
   * changes the view to match whatever the input boolean is
   * @param isCompact whether to change the view to compact
   */
  changeCompactMode(isCompact: boolean) {
    this.compact.next(isCompact);
  }

}
