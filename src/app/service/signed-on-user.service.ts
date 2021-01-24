import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, from, Observable, Subject } from 'rxjs';
import { catchError, concatAll, filter, first, map, startWith, takeUntil, tap } from 'rxjs/operators';
import { AuthInfo, AuthService } from './auth.service';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { VendorDeals, VendorService } from '@app/service/vendor.service';
import { BungieMembership, CharacterVendorData, ClanRow, Currency, GearMetaData, Player, SelectedUser, UserInfo } from './model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class SignedOnUserService implements OnDestroy {
  unsubscribe$: Subject<void> = new Subject<void>();
  public signedOnUser$: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);

  public refreshPlayer$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public refreshVendors$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public player$: BehaviorSubject<Player | null> = new BehaviorSubject(null);
  public playerLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public vendors$: BehaviorSubject<CharacterVendorData[]> = new BehaviorSubject([]);
  public vendorDeals$: BehaviorSubject<VendorDeals> = new BehaviorSubject(null);

  public currencies$: BehaviorSubject<Currency[]> = new BehaviorSubject([]);
  public clans$: BehaviorSubject<ClanRow[]> = new BehaviorSubject([]);
  public gearMetadata$: BehaviorSubject<GearMetaData> = new BehaviorSubject(null);

  // track info about the signed on user
  // Player
  // Currencies
  // postmaster and vault counts
  // general player info
  // vendors

  constructor(
    private bungieService: BungieService,
    private vendorService: VendorService,
    private authService: AuthService,
    private destinyCacheService: DestinyCacheService,
    private notificationService: NotificationService
  ) {
    this.authService.authFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((ai: AuthInfo) => {
      if (ai != null) {
        this.bungieService.getBungieMembershipsById(ai.memberId, -1).then((membership: BungieMembership) => {
          if (membership == null || membership.destinyMemberships == null || membership.destinyMemberships.length === 0) {
            console.log('No membership found for id, signing out.');
            this.authService.signOut();
            return;
          }
          const selectedUser: SelectedUser = new SelectedUser();
          selectedUser.membership = membership;
          // For testing, add a fake PSN account
          // let fake: UserInfo = JSON.parse(JSON.stringify(membership.destinyMemberships[0]));
          // fake.membershipType = 2;
          // fake.platformName = "PSN";
          // membership.destinyMemberships.push(fake);
          // fake = JSON.parse(JSON.stringify(membership.destinyMemberships[0]));
          // fake.membershipType = 4;
          // fake.platformName = "BNET";
          // membership.destinyMemberships.push(fake);
          let platform = 2;
          const sPlatform: string = localStorage.getItem('D2STATE-preferredPlatform');
          if (sPlatform != null) {
            platform = parseInt(sPlatform, 10);
          } else {
            console.log('No preferred platform using: ' + platform);
            if (membership.destinyMemberships.length > 1) {
              selectedUser.promptForPlatform = true;
            }
          }
          membership.destinyMemberships.forEach(m => {
            if (m.membershipType === platform) {
              selectedUser.userInfo = m;
            }
          });
          if (selectedUser.userInfo == null) {
            selectedUser.userInfo = membership.destinyMemberships[0];
          }
          this.signedOnUser$.next(selectedUser);
        });
      } else {
        this.signedOnUser$.next(null);
      }
    });
    // handle clans
    this.signedOnUser$.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      if (selectedUser != null) {
        this.applyClans(selectedUser);
      }
    });
    // new work to look up inventory, profile, etc
    // TODO also find clans
    // TODO combine w/ refresh signal, some sort of distinct until changed

    combineLatest([this.refreshPlayer$, this.signedOnUser$, this.destinyCacheService.ready$]).pipe(
      takeUntil(this.unsubscribe$),
      filter(([refresh, selectedUser, cacheReady]) => cacheReady && (selectedUser != null)),
      tap(([refresh, selectedUser, cacheReady]) => this.playerLoading$.next(true)),
      map(([refresh, selectedUser, cacheReady]) => from(
        this.bungieService.getChars(selectedUser.userInfo.membershipType,
          selectedUser.userInfo.membershipId, ['Profiles', 'Characters', 'ProfileCurrencies',
          'CharacterEquipment', 'CharacterInventories', 'ItemObjectives',
          'ItemInstances', 'ItemPerks', 'ItemStats', 'ItemSockets', 'ItemPlugStates',
          'ItemTalentGrids', 'ItemCommonData', 'ProfileInventories', 'ItemReusablePlugs', 'ItemPlugObjectives', 'PresentationNodes', 'Collectibles'], false, true))
      ),
      concatAll(),
      catchError((err) => {
        this.notificationService.fail(err);
        return null;
      }
      ),
    ).subscribe((player: Player) => {
      console.dir(player);
      this.player$.next(player);
      if (player != null) {
        this.currencies$.next(player.currencies);
        this.gearMetadata$.next(player.gearMetaData);
      } else {
        this.currencies$.next([]);
        this.gearMetadata$.next(null);
      }
      this.playerLoading$.next(false);
    });


    // use player updates to drive vendor updates
    // TODO only query vendors if interested?
    combineLatest([this.refreshVendors$, this.player$]).pipe(
      takeUntil(this.unsubscribe$),
      map(([refresh, player]) => {
        const requests: Observable<CharacterVendorData>[] = [];
        if (player) {
          for (const char of player.characters) {
                // TODO mark this current request as loading
                const loadMe = this.vendors$.getValue().find(x => x?.char === char);
                if (loadMe) {
                  loadMe.loading = true;
                }
                const req = this.vendorService.loadVendors(char, refresh);
                requests.push(req);
          }
        }
        return combineLatest(requests);
      }),
      concatAll()
    ).subscribe(x => {
      this.vendors$.next(x);
    });

    combineLatest([this.player$, this.vendors$]).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(([player, vendors]) => {
      const state = this.vendorService.getDeals(player, vendors);
      this.vendorDeals$.next(state);
      // console.dir(state);

      // DONE compare to collections
      // Eh, kinda: look at gear vs vendors
      // DONE look at spider exchanges vs what guardian has
      // TODO tess bright dust ornaments
      // TODO use this for bounty shopping list stuff on home page
      // LATER use this for "resources" page (make entire new page w/ better name?)
    });
  }

  private async applyClans(s: SelectedUser) {
    const c = await this.bungieService.getClans(s.membership.bungieId);
    this.clans$.next(c);
  }


  public selectUser(u: UserInfo) {
    localStorage.setItem('D2STATE-preferredPlatform', '' + u.membershipType);
    const curr = this.signedOnUser$.getValue();
    curr.userInfo = u;
    this.signedOnUser$.next(curr);
  }

  public isSignedOn(p: Player): boolean {
    const curr = this.signedOnUser$.getValue();
    if (curr == null) { return false; }
    return (curr.userInfo.membershipId == p.profile.userInfo.membershipId);
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
