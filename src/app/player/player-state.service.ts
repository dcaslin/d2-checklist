import { Injectable } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { Player, SearchResult, SelectedUser, TriumphRecordNode, Platform, Const, InventoryItem, Character } from '@app/service/model';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from '@app/service/storage.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerStateService {

  public filterChar: Character|string = null;

  public get sort() {
    return this._sort;
  }

  public set sort(val: string) {
    this._sort = val;
    this._player.next(this._player.getValue());
  }


  public get showZeroPtTriumphs() {
    return this._showZeroPtTriumphs;
  }

  public set showZeroPtTriumphs(b: boolean) {
    this._showZeroPtTriumphs = b;
    localStorage.setItem('show-zero-pt-triumphs', '' + this._showZeroPtTriumphs);
    this.requestRefresh();
  }

  public set showInvisTriumphs(b: boolean) {
    this._showInvisTriumphs = b;
    localStorage.setItem('show-invis-triumphs', '' + this._showInvisTriumphs);
    this.requestRefresh();
  }

  public get showInvisTriumphs() {
    return this._showInvisTriumphs;
  }

  public get hideCompleteCollectibles() {
    return this._hideCompleteCollectibles;
  }

  public set hideCompleteCollectibles(b: boolean) {
    this._hideCompleteCollectibles = b;
    localStorage.setItem('hide-completed-collectibles', '' + this._hideCompleteCollectibles);
  }

  public get hideCompleteTriumphs() {
    return this._hideCompleteTriumphs;
  }

  public set hideCompleteTriumphs(b: boolean) {
    this._hideCompleteTriumphs = b;
    localStorage.setItem('hide-completed-triumphs', '' + this._hideCompleteTriumphs);
  }


  public get hideCompletePursuits() {
    return this._hideCompletePursuits;
  }

  public set hideCompletePursuits(b: boolean) {
    this._hideCompletePursuits = b;
    localStorage.setItem('hide-completed-pursuits', '' + this._hideCompletePursuits);
  }

  private _sort = 'rewardsDesc';

  public trackedTriumphs: BehaviorSubject<TriumphRecordNode[]> = new BehaviorSubject([]);
  public trackedPursuits: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);

  private _player: BehaviorSubject<Player> = new BehaviorSubject<Player>(null);
  public player: Observable<Player>;

  private _loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public loading: Observable<boolean> = this._loading.asObservable();


  public _signedOnUserIsCurrent: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public signedOnUserIsCurrent: Observable<boolean> = this._signedOnUserIsCurrent.asObservable();

  public _isSignedOn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isSignedOn: Observable<boolean> = this._isSignedOn.asObservable();

  private _showZeroPtTriumphs = false;
  private _showInvisTriumphs = false;
  private _hideCompleteTriumphs = false;
  private _hideCompletePursuits = false;
  private _hideCompleteCollectibles = false;


  public dTrackedTriumphIds = {};
  public dTrackedPursuits = {};

  public currPlayer(): Player {
    return this._player.getValue();
  }

  public requestRefresh() {
    const p = this.currPlayer();
    const platform = Const.PLATFORMS_DICT['' + p.profile.userInfo.membershipType];
    this.loadPlayer(platform, p.profile.userInfo.membershipId, true);

  }

  public getPlayerRoute(params: any[]): string[] {
    const p = this._player.getValue();
    const baseRoute = ['/', '' + p.profile.userInfo.membershipType, p.profile.userInfo.membershipId];
    return baseRoute.concat(params);
  }

  public getPlayerRouteString(params: any[]): string {
    const p = this._player.getValue();
    const baseRoute = ['' + p.profile.userInfo.membershipType, p.profile.userInfo.membershipId];
    const entries = baseRoute.concat(params);
    let s = entries[0];
    for (let i = 1; i < entries.length; i++) {
      s += '/' + entries[i];
    }
    return s;
  }

  constructor(
    private storageService: StorageService,
    private bungieService: BungieService) {
    this.player = this._player.pipe(map(val => {
      PlayerStateService.sortMileStones(val, this.sort);
      return val;
    }));
    this.bungieService.selectedUserFeed.pipe().subscribe((selectedUser: SelectedUser) => {
      this._isSignedOn.next(selectedUser != null);
      this.checkSignedOnCurrent(this.currPlayer());
    });
    this._showZeroPtTriumphs = localStorage.getItem('show-zero-pt-triumphs') === 'true';
    this._showInvisTriumphs = localStorage.getItem('show-invis-triumphs') === 'true';
    this._hideCompleteTriumphs = localStorage.getItem('hide-completed-triumphs') === 'true';
    this._hideCompletePursuits = localStorage.getItem('hide-completed-pursuits') === 'true';
    this._hideCompleteCollectibles = localStorage.getItem('hide-completed-collectibles') === 'true';
    this.storageService.settingFeed.pipe().subscribe(
      x => {
        if (x.trackedtriumphs != null) {
          this.dTrackedTriumphIds = x.trackedtriumphs;
        } else {
          this.dTrackedTriumphIds = {};
        }
        this.applyTrackedTriumphs(this._player.getValue());
        if (x.trackedpursuits != null) {
          this.dTrackedPursuits = x.trackedpursuits;
        } else {
          this.dTrackedPursuits = {};
        }
        this.applyTrackedPursuits(this._player.getValue());

      });
  }

  private checkSignedOnCurrent(currentPlayer: Player) {
    const a = this.bungieService.selectedUser;
    let isCurrent = false;
    if (a != null && currentPlayer != null) {
      if (currentPlayer.profile.userInfo.membershipId == a.userInfo.membershipId) {
        isCurrent = true;
      }
    }
    this._signedOnUserIsCurrent.next(isCurrent);
  }

  public async loadPlayer(platform: Platform, memberId: string, refresh: boolean): Promise<void> {

    this._loading.next(true);
    if (!refresh) {
      this.filterChar = null;
      this._player.next(null);
    }
    try {
      const x = await this.bungieService.getChars(platform.type, memberId,
        ['Profiles', 'Characters', 'CharacterProgressions', 'CharacterActivities',
          'CharacterEquipment', 'CharacterInventories',
          'ProfileProgression', 'ItemObjectives', 'PresentationNodes', 'Records', 'Collectibles', 'ItemSockets', 'ItemPlugObjectives'
          //, '1000'
          // 'ItemSockets', 'ItemPlugStates','ItemInstances','ItemPerks','ItemStats'
          // 'ItemTalentGrids','ItemCommonData','ProfileInventories'
        ], false, false, this.showZeroPtTriumphs, this.showInvisTriumphs);
      if (x == null || x.characters == null) {
        throw new Error('No valid destiny player found for ' + memberId + ' on ' + platform.name);
      }
      this.checkSignedOnCurrent(x);
      this.applyTrackedTriumphs(x);
      this.applyTrackedPursuits(x);
      x.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return 1; }
        if (a.pl > b.pl) { return -1; }
        if (a.rewards < b.rewards) { return 1; }
        if (a.rewards > b.rewards) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
      if (x.characters && x.characters.length>0) {
        this.filterChar = x.characters[0];
      } else {
        this.filterChar = null;
      }
      this._player.next(x);
      this.bungieService.loadWeeklyPowerfulBounties(this._player);
      this.bungieService.loadActivityPsuedoMilestones(this._player);
      this.bungieService.loadClans(this._player);
      this.bungieService.observeUpdatePvpStreak(this._player);
      this.bungieService.observeUpdateAggHistoryAndScores(this._player, this.storageService.isDebug());
    }
    finally {
      this._loading.next(false);
    }
  }

  public static sortMileStones(player: Player, sort: string): Player {
    if (player == null || player.milestoneList == null) { return; }
    if (sort === 'rewardsDesc') {
      player.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return 1; }
        if (a.pl > b.pl) { return -1; }
        if (a.rewards < b.rewards) { return 1; }
        if (a.rewards > b.rewards) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'rewardsAsc') {
      player.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return -1; }
        if (a.pl > b.pl) { return 1; }
        if (a.rewards < b.rewards) { return -1; }
        if (a.rewards > b.rewards) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'resetDesc') {
      player.milestoneList.sort((a, b) => {
        if (a.resets == null && b.resets != null) { return 1; }
        if (a.resets != null && b.resets == null) { return -1; }
        if (a.resets == null && b.resets == null) { return 0; }
        if (a.resets < b.resets) { return 1; }
        if (a.resets > b.resets) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'resetAsc') {
      player.milestoneList.sort((a, b) => {

        if (a.resets == null && b.resets != null) { return -1; }
        if (a.resets != null && b.resets == null) { return 1; }
        if (a.resets == null && b.resets == null) { return 0; }
        if (a.resets < b.resets) { return -1; }
        if (a.resets > b.resets) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'nameAsc') {
      player.milestoneList.sort((a, b) => {
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (sort === 'nameDesc') {
      player.milestoneList.sort((a, b) => {
        if (a.name > b.name) { return -1; }
        if (a.name < b.name) { return 1; }
        return 0;
      });
    }
    return player;
  }

  public trackTriumph(n: TriumphRecordNode) {
    this.storageService.trackHashList('trackedtriumphs', n.hash);
  }

  public untrackTriumph(n: TriumphRecordNode) {
    this.storageService.untrackHashList('trackedtriumphs', n.hash);
  }

  public trackPursuit(n: InventoryItem) {
    this.storageService.trackHashList('trackedpursuits', n.hash);
  }

  public untrackPursuit(n: InventoryItem) {
    this.storageService.untrackHashList('trackedpursuits', n.hash);
  }

  private applyTrackedPursuits(player: Player) {
    if (player == null) {
      return;
    }
    const tempPursuits = [];
    if (Object.keys(this.dTrackedPursuits).length > 0) {
      for (const t of player.bounties) {
        if (this.dTrackedPursuits[t.hash] == true) {
          tempPursuits.push(t);
        }
      }
      for (const t of player.quests) {
        if (this.dTrackedPursuits[t.hash] == true) {
          tempPursuits.push(t);
        }
      }
    }
    this.trackedPursuits.next(tempPursuits);
  }

  private applyTrackedTriumphs(player: Player) {
    if (player == null) {
      return;
    }
    const tempTriumphs = [];
    if (Object.keys(this.dTrackedTriumphIds).length > 0) {
      for (const t of player.searchableTriumphs) {
        if (this.dTrackedTriumphIds[t.hash] == true) {
          tempTriumphs.push(t);
        }
      }
    }
    this.trackedTriumphs.next(tempTriumphs);
  }

  public restoreHiddenClosestTriumphs() {
    localStorage.removeItem('hidden-closest-triumphs');
    this.requestRefresh();
  }

  public hideClosestTriumph(n: TriumphRecordNode) {
    const sHideMe = localStorage.getItem('hidden-closest-triumphs');
    let hidden = [];
    if (sHideMe != null) {
      try {
        hidden = JSON.parse(sHideMe);
      } catch (exc) {
        console.dir(exc);
      }
    }
    hidden.push(n.hash);
    localStorage.setItem('hidden-closest-triumphs', JSON.stringify(hidden));
    this.requestRefresh();
  }


}
