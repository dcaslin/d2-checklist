import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom} from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { DestinyCacheService } from './destiny-cache.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ElasticSearchService {
  public searchInput$: BehaviorSubject<string> = new BehaviorSubject('');
  public filteredAutoCompleteOptions$: BehaviorSubject<ElasticSearchResult[]> = new BehaviorSubject<ElasticSearchResult[]>([]);

  constructor(
    private httpClient: HttpClient,
    private destinyCacheService: DestinyCacheService,
    private notificationService: NotificationService
  ) {

    this.searchInput$.pipe(
      debounceTime(20))
      .subscribe((searchText) => {
        this.handleSearch(searchText);
      });
  }

  private async handleSearch(searchText: string) {
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
      const resp = await firstValueFrom(this.httpClient.get<ElasticSearchResult[]>(url));
      return resp;
    } catch (err) {
      console.dir(err);
      this.notificationService.fail('Error searching for player.');
      return [];
    }
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
