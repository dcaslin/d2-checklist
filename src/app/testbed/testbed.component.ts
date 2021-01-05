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
      const deals = this.vendorService.findLegendaryArmorDeals(player, interestingVendorArmor);
      // console.dir(deals.filter(d => d.hasDeal));

      const exoticDeals = this.vendorService.findExoticArmorDeals(player, interestingVendorArmor);
      // console.dir(exoticDeals);


      this.vendorService.getExchangeInfo(player, vendorItems);
      // type == 99 and seller is banshee (for gun mods), compare to collections? "Rampage Spec Banshee-44 672118013" 1990124610
      // type == 100 and seller is tess, compare to collections "Resilient Laurel Tess Everis 3361454721"
      // type == 101 is all spider currency exchange "Purchase Enhancement Prisms Spider 863940356"
      // type == 10 and seller is banshee ("Upgrade Module Banshee-44 672118013") is upgrade modules, prisms, and shards
      // seller is banshee or s


      // TODO look just at legendary armor grouped by class and bucket
      // TODO if any vendor exotic armor (Xur), look exactly by item type

      // TODO compare to collections
      // TODO look at gear vs vendors
      // TODO look at spider exchanges vs what guardian has
      // TODO use this for bounty shopping list stuff on home page
      // TODO use this four "resources" page (make entire new page w/ better name?)
    });
  }
}
