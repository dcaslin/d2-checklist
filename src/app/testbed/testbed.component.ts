import { Component, OnDestroy, OnInit } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { Character, CharacterVendorData, InventoryItem, ItemType, Player, SelectedUser } from '@app/service/model';
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
  public vendors$: BehaviorSubject<CharacterVendorData[]|null> = new BehaviorSubject([]);

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
      takeUntil(this.unsubscribe$),
      map((player) => {
        const requests: Observable<CharacterVendorData>[] = [];
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
      concatAll()
    ).subscribe(x => {
      this.vendors$.next(x);
    });

    this.signedOnUser$.pipe(
      takeUntil(this.unsubscribe$),
      filter(selectedUser => selectedUser != null),
      tap(x => this.playerLoading$.next(true)),
      map(selectedUser => from(

        // '', '', 'CharacterProgressions', 'CharacterActivities',
        //   '', '', '', '',
        //   'ProfileProgression', 'ItemObjectives', '', 'Records', '', '', ''
        this.bungieService.getChars(selectedUser.userInfo.membershipType,
          selectedUser.userInfo.membershipId, ['Profiles', 'Characters', 'ProfileCurrencies',
          'CharacterEquipment', 'CharacterInventories', 'ItemObjectives',
          'ItemInstances', 'ItemPerks', 'ItemStats', 'ItemSockets', 'ItemPlugStates',
          'ItemTalentGrids', 'ItemCommonData', 'ProfileInventories', 'ItemReusablePlugs', 'ItemPlugObjectives', 'PresentationNodes','Collectibles'], false, true))
      ),
      concatAll(),
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
    combineLatest([this.player$, this.vendors$]).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(([player, vendors]) => {
      if (!player) {
        return;
      }
      // for testing temp
      for (const v of vendors) {
        if (v == null) {
          return;
        }
      }
      const vendorItems = VendorService.getUniqueVendorItems(vendors);
      const interestingVendorArmor = vendorItems.filter(val => val.type === ItemType.Armor && (val.tier == 'Legendary' || val.tier == 'Exotic') && val.powerCap >= 1310);

      // look just at legendary armor grouped by class and bucket
      const legendaryDeals = this.vendorService.findLegendaryArmorDeals(player, interestingVendorArmor);
      const goodLegendaryDeals = legendaryDeals.filter(i=>i.hasDeal);
      console.log(`Legendary deals: ${goodLegendaryDeals.length}`);

      // if any vendor exotic armor (Xur), look exactly by item type
      const exoticDeals = this.vendorService.findExoticArmorDeals(player, interestingVendorArmor);
      console.log(`Exotic deals: ${exoticDeals.length}`);

      const collectionItems = this.vendorService.checkCollections(player, vendorItems);
      console.log(`Collection items, tess: ${collectionItems.tess.length}  banshee: ${collectionItems.banshee.length}`);


      const exchange = this.vendorService.getExchangeInfo(player, vendorItems);
      console.dir(exchange);

      // DONE compare to collections
      // Eh, kinda: look at gear vs vendors
      // DONE look at spider exchanges vs what guardian has
      // TODO use this for bounty shopping list stuff on home page
      // LATER use this for "resources" page (make entire new page w/ better name?)
    });
  }
}
