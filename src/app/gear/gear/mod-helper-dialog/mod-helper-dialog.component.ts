import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GearComponent } from '@app/gear';
import { GearService } from '@app/service/gear.service';
import { IconService } from '@app/service/icon.service';
import { Character, InventoryItem, ItemType } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { safeStringify } from '@app/shared/utilities';
import { BehaviorSubject, iif } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { applyMods, clearMods, ModChoices, PreferredStats } from './mod-wizard-logic';

@Component({
  selector: 'd2c-mod-helper-dialog',
  templateUrl: './mod-helper-dialog.component.html',
  styleUrls: ['./mod-helper-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModHelperDialogComponent extends ChildComponent implements OnInit {

  parent: GearComponent;
  PreferredStats = PreferredStats;

  equipped$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  weapons$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  armor$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public modChoices: ModChoices = this.defaultChoices();
  log$: BehaviorSubject<string[]> = new BehaviorSubject([]);


  public applyMods(): void {
    applyMods(this.gearService, this.notificationService, this.modChoices, this.armor$.getValue(), this.weapons$.getValue(), this.log$);
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
      this.armor$.next(armor);

    });
  }
  ngOnInit(): void {
  }

  private defaultChoices(): ModChoices {
    return {
      pve: true,
      priorityWeapon: null,
      secondaryWeapon: null,
      champions: false,
      protectiveLight: true,
      highEnergyFire: true,
      preferredStat: 'Recovery'
    };
  }
}