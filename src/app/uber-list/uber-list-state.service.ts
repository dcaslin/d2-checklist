import { Injectable, OnDestroy } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import {
  InventoryItem,
  ItemType,
  MileStoneName,
  MilestoneStatus,
  Player,
} from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

interface UberListRow {
  desc: any;
  name: string;
  hash: string;
  item: InventoryItem;
}


const ICON_FIXES = {
  '2594202463': '3603221665', // CRUCIBLE_WEEKLY_BOUNTIES
  '3899487295': '672118013',  // GUNSMITH_WEEKLY_BOUNTIES
  '2709491520': '69482069',   // VANGUARD_WEEKLY_BOUNTIES
  '3802603984': '248695599',  // GAMBIT_WEEKLY_BOUNTIES

}

@Injectable({
  providedIn: 'root',
})
export class UberListStateService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();
  public rows$: BehaviorSubject<UberListRow[]> = new BehaviorSubject([]);

  constructor(
    private signedOnUserService: SignedOnUserService,
    private destinyCacheService: DestinyCacheService
  ) {
    combineLatest([
      this.signedOnUserService.player$,
      this.signedOnUserService.vendors$,
    ])
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(([player, vendors]) => player != null && vendors != null)
      )
      .subscribe(([player, charVendors]) => {
        const rowData: { [key: string]: UberListRow } = {};
        for (const char of player.characters) {
          const vendors = charVendors.find((x) => x.char.id == char.id);
          if (vendors) {
            for (const vi of vendors.data) {
              if (vi.type == ItemType.Bounty) {
                if (!rowData[vi.hash]) {
                  rowData[vi.hash] = this.buildVendorBountyRow(vi);
                }
              }
            }
          }
          const bounties = player.bounties.filter(
            (x) => x.owner.getValue().id == char.id
          );
          for (const b of bounties) {
            if (!rowData[b.hash]) {
              rowData[b.hash] = this.buildCharBountyRow(b);
            }
          }
          for (const pl of player.milestoneList) {
            const c = char.milestones[pl.key];
            if (c) {
              if (!rowData[c.hash]) {
                rowData[c.hash] = this.buildCharMilestoneRow(pl, c);
              }
            }
          }
        }
        const rows: UberListRow[] = [];
        for (const key of Object.keys(rowData)) {
          rows.push(rowData[key]);
        }
        this.rows$.next(rows);

        // TODO convert this into consolidated list of grid items
        // for both bounties and milestones, perhaps even quests?

        // Sale bounties: InventoryItem + VendorItemInfo
        // Held bounties: InventoryItem
        // Char.milestones: { [key: string]: MilestoneStatus };
        // player.milestoneList: MileStoneName[] = [];
        console.log('hi');
      });
  }

  private buildVendorBountyRow(ii: InventoryItem): UberListRow {
    return {
      desc: null,
      hash: ii.hash,
      name: 'Vendor sale: ' + ii.name,
      item: ii,
    };
  }

  private buildCharBountyRow(ii: InventoryItem): UberListRow {
    return {
      desc: null,
      hash: ii.hash,
      name: 'Char bounty: ' + ii.name,
      item: ii,
    };
  }

  private buildCharMilestoneRow(
    msn: MileStoneName,
    mss: MilestoneStatus
  ): UberListRow {
    const desc = this.destinyCacheService.cache.Milestone[mss.hash];
    if (desc?.displayProperties != null && desc?.displayProperties?.icon == null) {
      const vendorHash = ICON_FIXES[mss.hash];
      if (vendorHash) {
        console.dir(this.destinyCacheService.cache.Vendor[vendorHash]);
        desc.displayProperties.icon = this.destinyCacheService.cache.Vendor[vendorHash].displayProperties?.smallTransparentIcon;
      }
    }
    return {
      desc: desc,
      hash: mss.hash,
      name: 'char ms: ' + msn.name,
      item: null,
    };
  }

  

  public init() {
    this.signedOnUserService.loadVendorsIfNotLoaded();
  }

  public refresh() {
    this.signedOnUserService.refreshPlayerAndVendors();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
