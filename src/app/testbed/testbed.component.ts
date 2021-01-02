import { Component, OnDestroy, OnInit } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { Character, Player, SelectedUser } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { StorageService } from '@app/service/storage.service';
import { VendorService } from '@app/service/vendor.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, combineLatest, from, Observable, of } from 'rxjs';
import { catchError, combineAll, concatAll, filter, map, startWith, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'd2c-testbed',
  templateUrl: './testbed.component.html',
  styleUrls: ['./testbed.component.scss']
})
export class TestbedComponent extends ChildComponent implements OnInit, OnDestroy {
  public signedOnUser$: BehaviorSubject<SelectedUser> = new BehaviorSubject(null);
  public player$: BehaviorSubject<Player | null> = new BehaviorSubject(null);
  public playerLoading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public vendorsLoading$: BehaviorSubject<number> = new BehaviorSubject(0);
  public vendors$: BehaviorSubject<number[]> = new BehaviorSubject([]);

  constructor(
    storageService: StorageService,
    private bungieService: BungieService,
    private vendorService: VendorService,
    private notificationService: NotificationService) {
    super(storageService);

  }

  refresh() {
    this.signedOnUser$.next(this.signedOnUser$.value);
  }

  ngOnInit(): void {
    this.player$.pipe(
      map((player) => {
        const requests: Observable<number>[] = [];
        const values = [];
        if (player) {
          for (const char of player.characters) {
                const req = this.vendorService.loadVendors(char);
                requests.push(req.pipe(startWith(null)));
                values.push(null);
          }
        }
        this.vendors$.next(values);
        return combineLatest(requests);
      }),
      concatAll(),
      // combineAll(),
      // combineLatest(),
      // takeUntil(this.unsubscribe$)
    ).subscribe(x => {
      this.vendors$.next(x);
    });

    this.signedOnUser$.pipe(
      takeUntil(this.unsubscribe$),
      filter(selectedUser => selectedUser != null),
      tap(x => this.playerLoading$.next(true)),
      map(selectedUser => from(
        this.bungieService.getChars(selectedUser.userInfo.membershipType, selectedUser.userInfo.membershipId, ['Profiles', 'Characters', 'CharacterInventories', 'ItemObjectives', 'PresentationNodes', 'Records', 'Collectibles', 'ItemSockets', 'ItemPlugObjectives']))
      ),
      concatAll(),
      // map((player) =>  {
      //   const returnMe = [];
      //   for (const char of player.characters) {
      //     const req = this.vendorService.loadVendors(char);
      //     returnMe.push(req.pipe(startWith(null)));
      //   }
      //   return combineLatest(returnMe);
      // }),
      // concatAll()
      catchError((err) => {
        this.notificationService.fail(err);
        return null;
      }
      ),
    ).subscribe((player: Player) => {
      this.player$.next(player);
      this.playerLoading$.next(false);
    });
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.signedOnUser$.next(selectedUser);
    });
  }
}