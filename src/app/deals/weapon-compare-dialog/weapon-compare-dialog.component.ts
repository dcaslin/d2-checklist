import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { GearCompareDialogComponent } from '@app/gear/gear/gear-compare-dialog/gear-compare-dialog.component';
import { SortEvent } from '@app/gear/gear/gear-compare-dialog/horizontal-sort/horizontal-sort.component';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { DamageType, InventoryItem, InventoryStat, ItemType } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { HorizontalSortComponent } from '../../gear/gear/gear-compare-dialog/horizontal-sort/horizontal-sort.component';
import { SeasonIndicatorComponent } from '../../shared/season-indicator/season-indicator.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ItemIconComponent } from '../../shared/item-icon/item-icon.component';
import { GodRollMwComponent } from '../../gear/god-roll-mw/god-roll-mw.component';
import { GodRollPlugComponent } from '../../gear/god-roll-plug/god-roll-plug.component';

@Component({
    selector: 'd2c-weapon-compare-dialog',
    templateUrl: './weapon-compare-dialog.component.html',
    styleUrls: ['./weapon-compare-dialog.component.scss'],
    standalone: true,
    imports: [NgIf, MatDialogTitle, CdkScrollable, MatDialogContent, HorizontalSortComponent, NgFor, SeasonIndicatorComponent, FaIconComponent, ItemIconComponent, NgClass, GodRollMwComponent, GodRollPlugComponent, AsyncPipe]
})
export class WeaponCompareDialogComponent extends ChildComponent {
  sortBy = 'preferredStatPoints';
  sortDesc = true;
  title: string;
  items: InventoryItem[];
  hideJunk = false;

  ItemType = ItemType;
  DamageType = DamageType;
  maxPlugs: number[] = [];


  sortedItems: BehaviorSubject<InventoryItem[]> = new BehaviorSubject<InventoryItem[]>([]);

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<WeaponCompareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    super();
    this.title = data.title;
    this.items = data.gear;

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
    return GearCompareDialogComponent.getAllStatsStatic(this.items);
  }

  getStat(originalStat: InventoryStat, i: InventoryItem): InventoryStat {
    return GearCompareDialogComponent.getStatStatic(originalStat, i);
  }

  public getColor(targetStat: InventoryStat): string {
    return GearCompareDialogComponent.getColorStatic(this.items, targetStat);
  }


}
