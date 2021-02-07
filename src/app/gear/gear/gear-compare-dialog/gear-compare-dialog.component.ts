import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { DamageType, EnergyType, InventoryItem, InventoryStat, ItemType } from '@app/service/model';
import { GearComponent } from '../gear.component';
import { GearService } from '@app/service/gear.service';
import { SortEvent } from './horizontal-sort/horizontal-sort.component';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gear-compare-dialog',
  templateUrl: './gear-compare-dialog.component.html',
  styleUrls: ['../gear.component.scss']
})
export class GearCompareDialogComponent extends ChildComponent {
  sortBy = 'power';
  sortDesc = true;

  ItemType = ItemType;
  EnergyType = EnergyType;
  DamageType = DamageType;
  hideJunk = false;
  source: InventoryItem;
  items: InventoryItem[];
  sortedItems: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  parent: GearComponent;
  showAllNames: boolean;
  maxPlugs: number[] = [];

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public gearService: GearService,
    private cacheService: DestinyCacheService,
    public dialogRef: MatDialogRef<GearCompareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    super(storageService);
    this.source = data.source;
    this.items = data.items;
    let maxSockets = 0;
    for (const i of this.items) {
      if (i.sockets && i.sockets.length > maxSockets) {
        maxSockets = i.sockets.length;
      }
    }

    this.maxPlugs = new Array(maxSockets).fill(0);
    for (const i of this.items) {
      for (const index in i.sockets) {
        if (this.maxPlugs[index] < i.sockets[index].plugs.length) {
          this.maxPlugs[index] = i.sockets[index].plugs.length;
        }
      }
    }
    this.parent = data.parent;
    this.showAllNames = this.items.length > 1;
    // if this is armor, sort by preferred stat points rather than power
    if (this.items.length>0 && this.items[0].type==ItemType.Armor) {
      this.sortBy = 'preferredStatPoints';
    }
    this._sort();
  }

  sort(event: SortEvent) {
    console.log(event.field);
    this.sortBy = event.field;
    this.sortDesc = event.descending;
    this._sort();
  }

  private _sort() {
    const items = this.items.slice(0);
    GearService.sortGear(this.sortBy, this.sortDesc, items);
    this.sortedItems.next(items);
  }

  getAllStats(): InventoryStat[] {
    const names = {};
    const stats = this.items[0].stats.slice(0);
    for (const s of stats) {
      names[s.name] = true;
    }
    if (this.items.length > 1) {
      for (const i of this.items.slice(1)) {
        for (const s of i.stats) {
          if (!names[s.name]) {
            names[s.name] = true;
            stats.push(s);
          }
        }
      }
    }
    // resort just in case
    stats.sort((a, b) => {
      return a.index > b.index ? 1 : a.index < b.index ? -1 : 0;
    });
    return stats;
  }

  getColor(targetStat: InventoryStat): string {
    const percentile = this.getPercentile(targetStat);
    if (percentile <= 20) {
      return 'junk-color';
    } else if (percentile <= 40) {
      return 'infuse-color';
    } else if (percentile <= 60) {
      return '';
    } else if (percentile <= 80) {
      return 'keep-color';
    } else {
      return 'upgrade-color';
    }

  }

  getPercentile(i: InventoryStat): number {
    const population = this.getComparableStats(i);
    const target = i.getValue();
    let x = 0;
    let y = 0;
    for (const a of population) {
      if (a.getValue() < target) {
        x++;
      }
      if (a.getValue() == target) {
        y++;
      }
    }
    const z = 100 * (x + (y / 2)) / population.length;
    return Math.round(z);
  }

  getStat(originalStat: InventoryStat, i: InventoryItem): InventoryStat {
    if (i.stats == null) {
      return null;
    }
    for (const s of i.stats) {
      if (s.name == originalStat.name) {
        return s;
      }
    }
    return null;
  }

  getComparableStats(originalStat: InventoryStat): InventoryStat[] {
    const returnMe: InventoryStat[] = [];
    for (const i of this.items) {
      if (i.stats == null) {
        continue;
      }
      for (const s of i.stats) {
        if (s.name == originalStat.name) {
          returnMe.push(s);
        }
      }
    }
    return returnMe;
  }
}


