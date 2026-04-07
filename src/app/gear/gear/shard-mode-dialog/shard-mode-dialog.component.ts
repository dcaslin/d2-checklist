import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { GearMetaData, InventoryItem, ItemType, Player } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GearComponent } from '../gear.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { ManifestItemIconComponent } from '../../../shared/manifest-item-icon/manifest-item-icon.component';
import { MatProgressBar } from '@angular/material/progress-bar';

interface Tuple {
  held: number;
  toMove: number;
}

interface ShardModeDialogData {
  junkWeapons: Tuple;
  junkArmor: Tuple;
  junkAll: Tuple;
  blueWeapons: Tuple;
  blueArmor: Tuple;
  blueAll: Tuple;
}


function buildEmptyData(): ShardModeDialogData {
  return {
    junkWeapons: { held: 0, toMove: 0 },
    junkArmor: { held: 0, toMove: 0 },
    junkAll: { held: 0, toMove: 0 },
    blueWeapons: { held: 0, toMove: 0 },
    blueArmor: { held: 0, toMove: 0 },
    blueAll: { held: 0, toMove: 0 }
  };
}


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-shard-mode-dialog',
    templateUrl: './shard-mode-dialog.component.html',
    styleUrls: ['./shard-mode-dialog.component.scss'],
    imports: [MatDialogTitle, MatButton, FaIconComponent, CdkScrollable, MatDialogContent, NgIf, MatTooltip, ManifestItemIconComponent, MatProgressBar, MatDialogActions, MatDialogClose, AsyncPipe]
})
export class ShardModeDialogComponent extends ChildComponent {
  parent: GearComponent;
  ItemType = ItemType;
  data$ = new BehaviorSubject<ShardModeDialogData>(buildEmptyData());
  operating$ = new BehaviorSubject<boolean>(false);
  gm$ = new BehaviorSubject<GearMetaData>(null!);

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<ShardModeDialogComponent>,
    public gearService: GearService,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super();
    this.parent = data.parent;
    // subscribe to parent's filter updates
    this.parent.player$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((player: Player | null) => {
      if (!player) {
        return;
      }
      this.gm$.next(player.gearMetaData);

      const target = player.characters[0];
      data = buildEmptyData();
      for (const item of player.gear) {
        if (!(item.type == ItemType.Weapon || item.type == ItemType.Armor)) {
          continue;
        }
        const held = item.owner.getValue().id == target.id;
        if (item.tier == 'Rare' && (item.mark == 'junk' || item.mark == null)) {
          if (item.type == ItemType.Weapon) {
            // is item held by current char
            held ? data.blueWeapons.held++ : data.blueWeapons.toMove++;
          } else if (item.type == ItemType.Armor) {
            held ? data.blueArmor.held++ : data.blueArmor.toMove++;
          }
          held ? data.blueAll.held++ : data.blueAll.toMove++;
        }
        if (item.mark == 'junk') {
          if (item.type == ItemType.Weapon) {
            held ? data.junkWeapons.held++ : data.junkWeapons.toMove++;
          } else if (item.type == ItemType.Armor) {
            held ? data.junkArmor.held++ : data.junkArmor.toMove++;
          }
          held ? data.junkAll.held++ : data.junkAll.toMove++;
        }
      }
      this.data$.next(data);
    });
  }

  public async syncLocks() {
    this.operating$.next(true);
    try {      
      this.parent.gearService.setExplicitOperatingOnMessage(`Refreshing inventory from Bungie`);
      await this.parent.load(true);
      await this.parent.gearService.processGearLocks(this.parent.player$.getValue()!, true);
    } finally {
      this.parent.gearService.clearOperatingOn();
      this.operating$.next(false);
    }

  }

  public async shardMode(itemType?: ItemType) {
    this.operating$.next(true);
    try {
      this.parent.gearService.setExplicitOperatingOnMessage(`Refreshing inventory from Bungie`);
      await this.parent.load(true);
      // dummy subject to avoid repainting gear component prematurely
      const msg = await this.parent.gearService.shardMode(this.parent.player$.getValue()!, new Subject<void>(), itemType);
      this.parent.gearFilterStateService.filterUpdated$.next();
      await this.parent.load(true);
      await this.parent.syncLocks();
      this.parent.gearFilterStateService.filterUpdated$.next();
      this.notificationService.success(msg);
    } finally {
      this.parent.gearService.clearOperatingOn();
      this.operating$.next(false);
    }
  }

  public async shardBlues(itemType?: ItemType) {
    this.operating$.next(true);
    try {
      this.parent.gearService.setExplicitOperatingOnMessage(`Refreshing inventory from Bungie`);
      await this.parent.load(true);
      const msg = await this.parent.gearService.shardBlues(this.parent.player$.getValue()!, new Subject<void>(), itemType);
      await this.parent.load(true);
      await this.parent.syncLocks();
      this.parent.gearFilterStateService.filterUpdated$.next();
      this.notificationService.success(msg);
    } finally {
      this.parent.gearService.clearOperatingOn();
      this.operating$.next(false);
    }
  }

  public async emptyVault() {
    this.operating$.next(true);
    try {
      this.parent.gearService.setExplicitOperatingOnMessage(`Refreshing inventory from Bungie`);
      await this.parent.load(true);
      const totalMoved = await this.parent.gearService.emptyVault(this.parent.player$.getValue()!, new Subject<void>());
      await this.parent.load(true);
      await this.parent.syncLocks();
      this.parent.gearFilterStateService.filterUpdated$.next();
      this.notificationService.info(`Moved ${totalMoved} items from vault to idle characters.`);
    } finally {
      this.parent.gearService.clearOperatingOn();
      this.operating$.next(false);
    }

  }

}
