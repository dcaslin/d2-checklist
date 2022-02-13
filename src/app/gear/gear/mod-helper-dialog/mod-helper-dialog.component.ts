import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GearComponent } from '@app/gear';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { Character, DestinyAmmunitionType, InventoryItem, ItemType } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { applyMods, clearMods, ModChoices, PreferredStat, PreferredStats, SeasonalApproach } from './mod-wizard-logic';

@Component({
  selector: 'd2c-mod-helper-dialog',
  templateUrl: './mod-helper-dialog.component.html',
  styleUrls: ['./mod-helper-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModHelperDialogComponent extends ChildComponent {

  parent: GearComponent;
  PreferredStats = PreferredStats;
  SeasonalApproach = SeasonalApproach;

  equipped$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  weapons$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  armor$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public modChoices: ModChoices = this.defaultChoices();
  log$: BehaviorSubject<string[]> = new BehaviorSubject([]);


  public previewMods(): void {
    applyMods(this.gearService, this.notificationService, this.modChoices, this.armor$.getValue(), this.weapons$.getValue(), this.log$, true);
  }

  public applyMods(): void {
    applyMods(this.gearService, this.notificationService, this.modChoices, this.armor$.getValue(), this.weapons$.getValue(), this.log$, false);
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
        this.equipped$.next([]);
        this.weapons$.next([]);
        this.armor$.next([]);
        return;
      }
      const player = this.parent.player$.getValue();
      const equipped = player.gear.filter(i => (i.equipped.getValue())).filter(i => i.type == ItemType.Armor || i.type == ItemType.Weapon).filter(i => i.owner.getValue().id == char.id);
      const weapons = equipped.filter(i => i.type == ItemType.Weapon);
      const armor = equipped.filter(i => i.type == ItemType.Armor);
      this.equipped$.next(equipped);
      this.weapons$.next(weapons);

      if (this.modChoices.priorityWeapon) {
        // if the weapons reloaded we need to re-attach to the new object
        if (!weapons.find(x => x === this.modChoices.priorityWeapon)) {
          this.modChoices.priorityWeapon = weapons.find(x => x.id == this.modChoices.priorityWeapon.id);
        }
      }
      if (this.modChoices.secondaryWeapon) {
        // if the weapons reloaded we need to re-attach to the new object
        if (!weapons.find(x => x === this.modChoices.secondaryWeapon)) {
          this.modChoices.secondaryWeapon = weapons.find(x => x.id == this.modChoices.secondaryWeapon.id);
        }
      }
      // auto select new weapons if we don't have any selected or if the list changed

      if (weapons.length > 0 && (this.modChoices.priorityWeapon == null ||
        !weapons.find(x => x.id == this.modChoices.priorityWeapon.id))) {
          const special = weapons.filter(x => x.ammoType == DestinyAmmunitionType.Special);
          const heavy = weapons.find(x => x.ammoType == DestinyAmmunitionType.Heavy);
          const primary = weapons.filter(x => x.ammoType == DestinyAmmunitionType.Primary);
          if (this.modChoices.pve) {
            if (special.length > 0) {
              this.modChoices.priorityWeapon = special[0];
              this.modChoices.secondaryWeapon = heavy;
            } else { // double primary
              this.modChoices.priorityWeapon = heavy;
              this.modChoices.secondaryWeapon = primary[0];
            }
          } else {
            if (special.length > 0) {
              this.modChoices.priorityWeapon = special[0];
              if (primary.length > 0) {
                this.modChoices.secondaryWeapon = primary[0];
              }
              if (special.length > 1) {
                this.modChoices.secondaryWeapon = special[1];
              }
            } else if (primary.length > 1) {
              this.modChoices.priorityWeapon = primary[0];
              this.modChoices.secondaryWeapon = primary[1];
            }
          }
      }
      this.armor$.next(armor);

    });
  }

  private defaultChoices(): ModChoices {
    return {
      pve: true,
      priorityWeapon: null,
      secondaryWeapon: null,
      champions: false,
      seasonApproach: SeasonalApproach.LeaveAlone,
      preferredStat: PreferredStat.LeaveAlone
    };
  }
}