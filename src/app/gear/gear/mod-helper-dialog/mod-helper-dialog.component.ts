import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GearComponent } from '@app/gear';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { Character, InventoryItem, ItemType } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { applyMods, clearMods, getEnergyApproachArray, getEnergyApproachString, ModChoices, PreferredStat, PreferredStats } from './mod-wizard-logic';

@Component({
  selector: 'd2c-mod-helper-dialog',
  templateUrl: './mod-helper-dialog.component.html',
  styleUrls: ['./mod-helper-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModHelperDialogComponent extends ChildComponent {

  parent: GearComponent;
  PreferredStats = PreferredStats;

  public choices = getEnergyApproachArray();
  public getEnergyApproachString = getEnergyApproachString

  armor$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public modChoices: ModChoices = this.defaultChoices();
  log$: BehaviorSubject<string[]> = new BehaviorSubject([]);


  public previewMods(): void {
    applyMods(this.gearService, this.notificationService, this.modChoices, this.armor$.getValue(), this.log$, true);
  }

  public applyMods(): void {
    applyMods(this.gearService, this.notificationService, this.modChoices, this.armor$.getValue(), this.log$, false);
  }

  public clearMods(): void {
    clearMods(this.gearService, this.armor$.getValue(), this.log$);
  }

  constructor(
    public gearService: GearService,
    private notificationService: NotificationService,
    public iconService: IconService,
    public storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super(storageService);
    this.parent = data.parent;
    this.parent.player$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(player => {
      if (!player || player.characters.length < 1) {
        this.char$.next(null);
      } else {
        this.char$.next(player.characters[0]);
      }
    });
    this.char$.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(char => {
      if (!char) {
        this.armor$.next([]);
        return;
      }
      const player = this.parent.player$.getValue();
      const armor = player.gear.filter(i => (i.equipped.getValue())).filter(i => i.type == ItemType.Armor).filter(i => i.owner.getValue().id == char.id);
      this.armor$.next(armor);

    });
  }

  private defaultChoices(): ModChoices {
    return {
      pve: true,
      priorityEnergy: null,
      secondaryEnergy: null,
      preferredStat: PreferredStat.LeaveAlone
    };
  }
}