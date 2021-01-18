import { Injectable } from '@angular/core';
import { Cache, DestinyCacheService } from '@app/service/destiny-cache.service';
import { first, takeUntil } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
import { ManifestMilestone } from '../interfaces/milestone.interface';
import { ManifestClass } from '../interfaces/player.interface';
import { InventoryItem, Vendor } from '../interfaces/vendor.interface';

/**
 * This module's version of ParseService
 * Used to look up hashes against the destinyCache
 */
@Injectable()
export class DictionaryService extends Destroyable {

  private cache: Cache;

  constructor(private cacheService: DestinyCacheService) {
    super();
    this.getCache();
  }

  /**
   * Item in this context is anything a character can hold
   * Ex: bounties, quests, inventory items, armor, etc
   */
  public findItem(hash: number | string): InventoryItem {
    if (!this.cache) { return null; }
    return this.cache.InventoryItem[hash];
  }

  public findVendor(hash: number | string): Vendor {
    if (!this.cache) { return null; }
    return this.cache.Vendor[hash];
  }

  public findMilestone(hash: number | string): ManifestMilestone {
    if (!this.cache) { return null; }
    return this.cache.Milestone[hash];
  }

  public findClass(hash: number | string): ManifestClass {
    if (!this.cache) { return null; }
    return this.cache.Class[hash];
  }

  /**
   * Waits for the cache to be available then gets it
   */
  private getCache() {
    this.cacheService.ready$.pipe(
      first((x) => !!x), // only trigger when it emits true
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cache = this.cacheService.cache;
      // console.log(this.cache);
    });
  }

}
