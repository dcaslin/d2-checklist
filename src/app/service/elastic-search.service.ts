import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ElasticSearchService {
  // TODO use this eventually, once vlad refactors

  constructor(
    private httpClient: HttpClient,
    private notificationService: NotificationService
  ) { }

  public async searchPlayer(platform: number, gt: string): Promise<ElasticSearchResult[]> {
    try {
      const url = `https://elastic.destinytrialsreport.com/players/${platform}/${gt}`;
      const resp = await this.httpClient.get<ElasticSearchResult[]>(url).toPromise();
      return resp;
    } catch (err) {
      console.dir(err);
      this.notificationService.fail('Error searching for player.');
      return [];
    }
}


}

export interface ElasticSearchResult {
  bnetId:            number;
  displayName:       string;
  membershipId:      string;
  membershipType:    number;
  crossSaveOverride: ElasticCrossSaveOverride;
  emblemHash:        number;
  lastPlayed:        Date;
  score:             number;
}

export interface ElasticCrossSaveOverride {
  membershipId:   string;
  membershipType: number;
}
