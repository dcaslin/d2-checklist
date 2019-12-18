import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { DamageType, EnergyType, InventoryItem, InventoryStat, ItemType } from '@app/service/model';
import { GearComponent } from '../gear.component';
import { GearService } from '@app/service/gear.service';

@Component({
  selector: 'd2c-gear-compare-dialog',
  templateUrl: './gear-compare-dialog.component.html',
  styleUrls: ['../gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearCompareDialogComponent {
  ItemType = ItemType;
  EnergyType = EnergyType;
  DamageType = DamageType;
  hideJunk = false;
  items: InventoryItem[];
  parent: GearComponent;
  showAllNames: boolean;

  constructor(
    public iconService: IconService,
    public gearService: GearService,
    private cacheService: DestinyCacheService,
    public dialogRef: MatDialogRef<GearCompareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.items = data.items;
    this.parent = data.parent;
    this.showAllNames = data.showNames;
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
    const statDb = this.cacheService.cache.Stat;
    stats.sort(function (a, b) {
      const aDesc = statDb[a.hash];
      const bDesc = statDb[b.hash];
      if (aDesc && bDesc) {
        if (aDesc.index > bDesc.index) {
          return 1;
        } else if (aDesc.index < bDesc.index) {
          return -1;
        } else {
          return 0;
        }
      }
      const bs: string = b.name;
      const as: string = a.name;
      if (bs < as) { return 1; }
      if (bs > as) { return -1; }
      return 0;
    });

    return stats;
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
}


