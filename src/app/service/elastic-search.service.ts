import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DestinyCacheService } from './destiny-cache.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ElasticSearchService implements OnDestroy {
  public searchInput$: BehaviorSubject<string> = new BehaviorSubject('');
  private unsubscribe$: Subject<void> = new Subject<void>();
  public filteredAutoCompleteOptions$: BehaviorSubject<ElasticSearchResult[]> = new BehaviorSubject([]);

  constructor(
    private httpClient: HttpClient,
    private destinyCacheService: DestinyCacheService,
    private notificationService: NotificationService
  ) {

    this.searchInput$.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(20))
      .subscribe((searchText) => {
        this.handleSearch(searchText);
      });
  }

  private async handleSearch(searchText) {
    if (searchText==null || searchText.length==0) {
      this.filteredAutoCompleteOptions$.next([]);
      return;
    }
    const results = await this.searchPlayer(0, searchText);
    const nonOverridden = results.filter((r) => {
      if (!r.crossSaveOverride) {
        return true;
      }
      if (r.crossSaveOverride.membershipType==0) {
        return true;
      }
      if (r.crossSaveOverride.membershipType == r.membershipType && r.crossSaveOverride.membershipId == r.membershipId) {
        return true;
      }
      return false;

    });
    for (const r of nonOverridden) {
      if (r.emblemHash!=null) {
        const desc = await this.destinyCacheService.getInventoryItem(r.emblemHash);
        if (desc) {
          r.iconPath = desc.displayProperties.icon;
        }
      }
    }
    this.filteredAutoCompleteOptions$.next(nonOverridden);
  }

  private async searchPlayer(platform: number, gt: string): Promise<ElasticSearchResult[]> {
    try {
      const url = `https://elastic.destinytrialsreport.com/players/${platform}/${encodeURIComponent(gt)}`;
      const resp = await this.httpClient.get<ElasticSearchResult[]>(url).toPromise();
      return resp;
    } catch (err) {
      console.dir(err);
      this.notificationService.fail('Error searching for player.');
      return [];
    }
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }




}

export interface ElasticSearchResult {
  bnetId: number;
  bungieName: string
  displayName: string;
  membershipId: string;
  membershipType: number;
  crossSaveOverride: ElasticCrossSaveOverride;
  emblemHash: number;
  lastPlayed: Date;
  score: number;
  iconPath?: string;
}

export interface ElasticCrossSaveOverride {
  membershipId: string;
  membershipType: number;
}
