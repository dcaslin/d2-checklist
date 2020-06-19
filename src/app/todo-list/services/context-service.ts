import { Injectable } from '@angular/core';
import { AuthService } from '@app/service/auth.service';
import { BungieService } from '@app/service/bungie.service';
import { SelectedUser } from '@app/service/model';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';

import { API_ROOT } from '../constants/constants';
import { Character } from '../interfaces/player.interface';
import { Destroyable } from '../util/destroyable';
import { HttpService } from './http.service';

/**
 * The service that drives the todo-list page.
 * The rows shown in the todo table will ultimately be drawn from this service.
 */
@Injectable()
export class ContextService extends Destroyable {

  public user: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);
  public characters: BehaviorSubject<Character[]> = new BehaviorSubject(null);

  public get currentUser(): SelectedUser { return this.user.getValue(); }
  public get currentCharacters(): Character[] { return this.characters.getValue(); }

  // TODO: define a model for the rows to follow
  constructor(
    private http: HttpService,
    private bungieService: BungieService
  ) {
    super();
    // does a one-time load of the auth key into the service.
    // it's not very resilient to changes in the auth key, but it works
    // for the basic case where it's there and it doesn't change
    // it would be great if the auth service had a behaviorSubject that always stores
    // the up-to-date auth key
    this.loadLoggedInUserAndCharacters();
  }

  /**
   * Loads the logged in user which triggers a fetch for the characters
   */
  private loadLoggedInUserAndCharacters() {
    this.bungieService.selectedUserFeed.pipe(
      filter((x) => !!x), // only trigger when it emits truthy
      tap((user) => {
        this.user.next(user); // lol I know this is basically the same thing as the selected user feed
      }),
      switchMap(() => this.fetchCharacters()),
      takeUntil(this.destroy$)
    ).subscribe(
      (resp) => { this.characters.next(this.parseCharacterResponse(resp)) },
      // failure
      () => { console.error('Unable to load character data!') }
    );
  }

  private fetchCharacters(): Observable<any> {
    const options = { params: { components: 'characters' } };
    const url = `${API_ROOT}/${this.userUrlSegment}/`;
    return this.http.get(url, options);
  }

  private parseCharacterResponse(resp: any): Character[] {
    const charObj = resp.Response.characters.data;
    return Object.values(charObj);
  }

  private get userUrlSegment(): string {
    return `destiny2/${this.currentUser.userInfo.membershipType}/profile/${this.currentUser.userInfo.membershipId}`;
  }
}
