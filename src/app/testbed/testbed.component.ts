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
        this.bungieService.getChars(selectedUser.userInfo.membershipType,
          selectedUser.userInfo.membershipId, ['Profiles', 'Characters', 'ProfileCurrencies',
          'CharacterEquipment', 'CharacterInventories', 'ItemObjectives',
          'ItemInstances', 'ItemPerks', 'ItemStats', 'ItemSockets', 'ItemPlugStates',
          'ItemTalentGrids', 'ItemCommonData', 'ProfileInventories', 'ItemReusablePlugs', 'ItemPlugObjectives'], false, true))
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

      if (!player || !player.gear) {
        return;
      }
      console.dir(player);
      console.dir(vendors);
      let allItems = player.gear;
      for (const v of vendors) {
        if (!v) {
          continue;
        }
        allItems = allItems.concat(v.data);
      }
      console.dir(allItems);
      const allArmor = allItems.filter(i => i.type === ItemType.Armor);
      const allVendorArmor = allArmor.filter(i => i.vendorItemInfo!=null);
      const map : { [key:string]:InventoryItem; } = {};
      const allUniqueVendorArmor = [];
      for (const g of allVendorArmor) {
        map[g.id] = g;
      }
      for (const key in map) {
        allUniqueVendorArmor.push(map[key]);
      }
      // VendorService.checkDupes(allUniqueVendorArmor);

      for (const g of allUniqueVendorArmor) {
        const group = VendorService.findComparableArmor(g, allUniqueVendorArmor, false, 1260);
        if (!group) {
          continue;
        }
        group.sort((a, b) => {
          let aN = a.preferredStatPoints;
          let bN = b.preferredStatPoints;
          if (aN < bN) {
            return 1;
          } else if (aN > bN) {
            return -1;
          }
          aN = a.totalStatPoints;
          bN = b.totalStatPoints;
          if (aN < bN) {
            return 1;
          } else if (aN > bN) {
            return -1;
          }
          return 0;

        });
        if (group[0].vendorItemInfo!=null) {
          const i = group[0];
          console.log(`Better vendor item: ${i.name} ${i.preferredStatPoints} ${i.inventoryBucket.displayProperties.name}`);
          console.dir(i);
        }
      }

      
      // TODO look at gear vs vendors
      // TODO look at spider exchanges vs what guardian has
      // TODO use this for bounty shopping list stuff on home page
      // TODO use this four "resources" page (make entire new page w/ better name?)
    });
  }
}