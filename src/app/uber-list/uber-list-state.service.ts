import { Injectable, OnDestroy } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import {
  InventoryItem,
  ItemType,
  MileStoneName,
  MilestoneStatus,
  NameQuantity
} from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';


interface PrivRewardDesc {
  itemHash: number;
  quantity: number;
}

interface MilestoneRow {
  type: string;
  title: MileStoneName;
  desc: any;
  rewards: NameQuantity[];
  characterEntries: { [key: string]: MilestoneStatus };
}

interface PursuitRow {
  type: string;
  title: InventoryItem;
  characterEntries: { [key: string]: PursuitTuple };
}

interface PursuitTuple {
  vendorItem: InventoryItem;
  characterItem: InventoryItem;
}


const ICON_FIXES = {
  '2594202463': '3603221665', // CRUCIBLE_WEEKLY_BOUNTIES
  '3899487295': '672118013',  // GUNSMITH_WEEKLY_BOUNTIES
  '2709491520': '69482069',   // VANGUARD_WEEKLY_BOUNTIES
  '3802603984': '248695599',  // GAMBIT_WEEKLY_BOUNTIES
};

@Injectable({
  providedIn: 'root',
})
export class UberListStateService implements OnDestroy {
  private unsubscribe$: Subject<void> = new Subject<void>();
  public rows$: BehaviorSubject<(MilestoneRow | PursuitRow)[]> = new BehaviorSubject([]);

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
        const rowData: { [key: string]: MilestoneRow | PursuitRow } = {};
        for (const char of player.characters) {
          const vendors = charVendors.find((x) => x.char.id == char.id);
          if (vendors) {
            for (const vi of vendors.data) {
              if (vi.type == ItemType.Bounty) {
                // create empty pursuit row
                if (!rowData[vi.hash]) {
                  rowData[vi.hash] = this.buildInitialPursuitRow(vi);
                }
              }
            }
          }
          const bounties = player.bounties.filter(
            (x) => x.owner.getValue().id == char.id
          );
          for (const b of bounties) {
            if (!rowData[b.hash]) {
              rowData[b.hash] = this.buildInitialPursuitRow(b);
            }
          }
          for (const msn of player.milestoneList) {
            const c = char.milestones[msn.key];
            if (c) {
              if (!rowData[c.hash]) {
                rowData[c.hash] = this.buildInitialMilesoneRow(msn);
              }
            }
          }
        }
        const rows: (MilestoneRow | PursuitRow)[] = [];
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
      });
  }

  private buildInitialPursuitRow(i: InventoryItem): PursuitRow {
    return {
      type: 'pursuit',
      title: i,
      characterEntries: {}
    };
  }

  private handleRewardItem(val: PrivRewardDesc, rewards: NameQuantity[]) {
    if (val.itemHash === 0) { return; }
    const valDesc: any = this.destinyCacheService.cache.InventoryItem[val.itemHash];
    if (valDesc != null) {
      rewards.push({
        hash: val.itemHash + '',
        icon: valDesc.displayProperties.icon,
        name: valDesc.displayProperties.name,
        quantity: val.quantity
      });
    }
  }

  private buildInitialMilesoneRow(msn: MileStoneName): MilestoneRow {
    const desc = this.destinyCacheService.cache.Milestone[msn.key];
    if (desc?.displayProperties != null && desc?.displayProperties?.icon == null) {
      const vendorHash = ICON_FIXES[msn.key];
      if (vendorHash) {
        desc.displayProperties.icon = this.destinyCacheService.cache.Vendor[vendorHash].displayProperties?.smallTransparentIcon;
      }
    }
    const rewards: NameQuantity[] = [];
    // try quest rewards approach, this works for things like Shady Schemes 3802603984
    if (desc?.quests) {
      for (const key of Object.keys(desc.quests)) {
        const q = desc.quests[key];
        if (q.questItemHash) {
          const qDesc = this.destinyCacheService.cache.InventoryItem[q.questItemHash];
          if (qDesc.value != null && qDesc.value.itemValue != null) {
            for (const val of qDesc.value.itemValue) {
              this.handleRewardItem(val, rewards);
            }
          }
        }
      }
    }
    if (desc?.rewards) {
      for (const key of Object.keys(desc.rewards)) {
        const reward = desc.rewards[key];
        if (reward.rewardEntries) {
          for (const key2 of Object.keys(reward.rewardEntries)) {
            const rewardEntry = reward.rewardEntries[key2];
            if (rewardEntry.items) {
              for (const val of rewardEntry.items) {
                this.handleRewardItem(val, rewards);
              }
            }
          }
        }
      }
    }
    // Raids tend to be missing rewards, luckily we already did the work in ParseService to get the string reward value, so we'll just parse out an icon on it
    if (rewards.length == 0 && msn.rewards != null) {
      console.log(`---- ${msn.rewards}`);
      if ('Pinnacle Gear' == msn.rewards) {
        this.handleRewardItem({ itemHash: 73143230, quantity: 0 }, rewards);
      }
      if ('Legendary Gear' == msn.rewards) {
        this.handleRewardItem({ itemHash: 2127149322, quantity: 0 }, rewards);
      }
    }

    return {
      type: 'milestone',
      title: msn,
      rewards,
      desc: desc,
      characterEntries: {}
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
