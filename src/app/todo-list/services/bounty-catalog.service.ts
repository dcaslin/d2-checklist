import { Injectable } from '@angular/core';
import { PlayerStateService } from '../../player/player-state.service';
import { Character } from '../../service/model';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ===== WIP =====

// This is the same as in the bungie service.
// Didn't want to refactor a lot
const API_ROOT = 'https://www.bungie.net/platform/';

/**
 * Provides a catalog of bounties
 */
@Injectable()
export class BountyCatalogService {

  // TODO: give this a meaningful type
  public bountyCatalog: BehaviorSubject<any[]> = new BehaviorSubject([]);

  constructor(
    public state: PlayerStateService, // not working RIP TODO: figure out best way to get the current player
    private http: HttpClient
  ) { }

  public loadBountyCatalog(): Observable<any[]> {
    // TODO: Need to pull vendor list and parse for bounties
    return null;
  }

  /**
   * constructs the piece of the request URL that relates to the character
   * @param char the character in question
   */
  private charUrlPiece(char: Character) {
    // TODO: define a different character object? We're going to be adding more fields to it at least, and there's a lot of other fields we don't care about in this context
    return `destiny2/${char.membershipType}/profile/${char.membershipId}/character/${char.characterId}`
  }
}
