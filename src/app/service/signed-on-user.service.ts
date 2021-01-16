import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, first, takeUntil } from 'rxjs/operators';
import { AuthInfo, AuthService } from './auth.service';
import { BungieService } from './bungie.service';
import { DestinyCacheService } from './destiny-cache.service';
import { BungieMembership, Player, SelectedUser, UserInfo } from './model';

@Injectable({
  providedIn: 'root'
})
export class SignedOnUserService implements OnDestroy {
  unsubscribe$: Subject<void> = new Subject<void>();
  public signedOnUser$: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);

  // track info about the signed on user
  // Player
  // Currencies
  // postmaster and vault counts
  // general player info
  // vendors

  constructor(
    private bungieService: BungieService,
    private authService: AuthService,
    private destinyCacheService: DestinyCacheService
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
    this.signedOnUser$.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.updateSelectedUser(selectedUser);
    });

  }

  private async updateSelectedUser(selectedUser: SelectedUser): Promise<void> {
    if (selectedUser != null) {
      // wait until cache is ready
      this.destinyCacheService.ready.asObservable().pipe(filter(x => x === true), first()).subscribe(() => {
        this.applyClans(this.signedOnUser$.getValue());
        this.applyCurrencies(this.signedOnUser$.getValue());
      });
    }
  }


  private async applyCurrencies(s: SelectedUser): Promise<void> {
    const tempPlayer = await this.bungieService.getChars(s.userInfo.membershipType, s.userInfo.membershipId,
      ['Characters', 'ProfileCurrencies', 'ProfileInventories', 'CharacterInventories'], true, true);
    if (tempPlayer == null) {
      console.log('No player to apply currencies to');
      return;
    }
    s.currencies$.next(tempPlayer.currencies);
    s.gearMeta$.next(tempPlayer.gearMeta);
  }


  private async applyClans(s: SelectedUser) {
    const c = await this.bungieService.getClans(s.membership.bungieId);
    s.clans.next(c);
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
