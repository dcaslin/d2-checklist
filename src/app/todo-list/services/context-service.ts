import { Injectable } from '@angular/core';
import { AuthService } from '@app/service/auth.service';
import { BungieService } from '@app/service/bungie.service';
import { SelectedUser } from '@app/service/model';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';

import { Destroyable } from '../../util/destroyable';
import { API_ROOT } from '../constants/constants';
import { Character, InventoryMap } from '../interfaces/player.interface';
import { DictionaryService } from './dictionary.service';
import { HttpService } from './http.service';

/**
 * The service that drives the todo-list page.
 * The rows shown in the todo table will ultimately be drawn from this service.
 */
@Injectable()
export class ContextService extends Destroyable {

  public user: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);
  public characters: BehaviorSubject<Character[]> = new BehaviorSubject(null);
  /**
   * the keys are character Ids
   */
  public inventoryMaps: { [key: string]: InventoryMap }

  public get currentUser(): SelectedUser { return this.user.getValue(); }
  public get currentCharacters(): Character[] { return this.characters.getValue(); }

  // TODO: define a model for the rows to follow
  constructor(
    private http: HttpService,
    private bungieService: BungieService,
    private auth: AuthService,
    private dictionary: DictionaryService
  ) {
    super();
    // does a one-time load of the auth key into the service.
    // it's not very resilient to changes in the auth key, but it works
    // for the basic case where it's there and it doesn't change
    // it would be great if the auth service had a behaviorSubject that always stores
    // the up-to-date auth key
    this.loadLoggedInUserAndCharacters();
  }

  public userUrlSegment(user): string {
    return `destiny2/${user.userInfo.membershipType}/profile/${user.userInfo.membershipId}`;
  }

  /**
   * Loads the logged in user which triggers a fetch for the characters
   */
  private loadLoggedInUserAndCharacters() {
    combineLatest([this.userFeed(), this.authFeed()]).pipe(
      switchMap(() => this.fetchCharacters()),
      takeUntil(this.destroy$)
    ).subscribe(
      (resp) => { this.characters.next(this.parseCharacterResponse(resp)) },
      // failure
      () => { console.error('Unable to load character data!') }
    );
  }

  private userFeed(): Observable<any> {
    return this.bungieService.selectedUserFeed.pipe(
      filter((x) => !!x), // only trigger when it emits truthy
      tap((user) => {
        this.user.next(user); // lol I know this is basically the same thing as the selected user feed
      }));
  }

  private authFeed(): Observable<any> {
    return this.auth.authFeed.pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    );
  }

  private fetchCharacters(): Observable<any> {
    // characters component to get basic character info (light level, classType, etc)
    // characterInventories gets us bounty progression
    const options = { params: { components: 'characters,characterInventories' } };
    const url = `${API_ROOT}/${this.userUrlSegment(this.currentUser)}/`;
    return this.http.get(url, options);
  }

  private parseCharacterResponse(resp: any): Character[] {
    console.log('resp', resp);
    const charObj = resp.Response.characters.data;
    const inventories = resp.Response.characterInventories.data;
    console.log('inventories:', inventories);
    return Object.values(charObj).map((char: Character) => {
      char.className = this.dictionary.findClass(char.classHash).displayProperties.name;
      char.inventory = inventories[char.characterId].items;
      return char;
    });
  }
}
