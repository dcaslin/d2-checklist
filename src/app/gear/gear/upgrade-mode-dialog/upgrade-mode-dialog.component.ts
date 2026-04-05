import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { SimpleInventoryItem } from '@app/service/destiny-cache.service';
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
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { ManifestItemIconComponent } from '../../../shared/manifest-item-icon/manifest-item-icon.component';
import { MatProgressBar } from '@angular/material/progress-bar';



interface Tuple {
  desc: SimpleInventoryItem;
  upgradeMe: InventoryItem;
  infuseMe: InventoryItem[];
  home: number;
  away: number;
}

interface UpgradeModeDialogData {
  weapons: Tuple[];
  armor: Tuple[];
}


function buildEmptyData(): UpgradeModeDialogData {
  return {
    weapons: [],
    armor: []
  };
}
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-upgrade-mode-dialog',
    templateUrl: './upgrade-mode-dialog.component.html',
    styleUrls: ['./upgrade-mode-dialog.component.scss'],
    standalone: true,
    imports: [MatDialogTitle, MatButton, FaIconComponent, CdkScrollable, MatDialogContent, NgIf, MatTooltip, NgFor, ManifestItemIconComponent, MatProgressBar, MatDialogActions, MatDialogClose, AsyncPipe]
})
export class UpgradeModeDialogComponent extends ChildComponent {
  parent: GearComponent;
  ItemType = ItemType;
  data$ = new BehaviorSubject<UpgradeModeDialogData>(buildEmptyData());
  operating$ = new BehaviorSubject<boolean>(false);
  gm$ = new BehaviorSubject<GearMetaData>(null!);

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<UpgradeModeDialogComponent>,
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
      for (const i of player.gear) {
        if (i.mark!='upgrade' || !(i.type == ItemType.Weapon || i.type == ItemType.Armor)) {
          continue;
        }

        
        const held = i.owner.getValue().id == target.id && !i.postmaster ? 1 : 0;
          
        let copies = GearService.findCopies(i, player);
        copies = copies.filter(copy => copy.mark == 'infuse');
        copies = copies.filter(copy => copy.power > i.power);
        // nothing to infuse
        if (copies.length == 0) {
            continue;
        }
        copies.push(i);
        // nothing to infuse
        if (copies.length == 0) {
            continue;
        } 
        const home = held + copies.filter(copy => copy.owner.getValue().id == target.id && !copy.postmaster).length;
        
        const tuple: Tuple = {
          desc: i.toSimpleInventoryItem(),
          upgradeMe: i,
          infuseMe: copies,
          home: home,
          away: 1 + copies.length - home
        };
        if (i.type == ItemType.Weapon) {
          data.weapons.push(tuple);
        } else {
          data.armor.push(tuple);
        }
      }
      this.data$.next(data);
    });
  }
  
  public async upgradeMode(itemType?: ItemType) {
    this.operating$.next(true);
    try {
      this.parent.gearService.setExplicitOperatingOnMessage(`Refreshing inventory from Bungie`);
      await this.parent.load(true);
      // dummy subject to avoid repainting gear component prematurely
      const msg = await this.gearService.upgradeMode(this.parent.player$.getValue()!, new Subject<void>(), itemType);
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


}
