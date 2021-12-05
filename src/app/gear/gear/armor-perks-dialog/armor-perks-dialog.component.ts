import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { GearComponent } from '../gear.component';
import { Character, InventoryPlug, Player } from '@app/service/model';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-armor-perks-dialog',
  templateUrl: './armor-perks-dialog.component.html',
  styleUrls: ['./armor-perks-dialog.component.scss']
})
export class ArmorPerksDialogComponent {
  parent: GearComponent;
  charPerks: { [key: string]: PlayerMods[] };

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<ArmorPerksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    const player = this.parent.player$.getValue();
    this.charPerks = {};
    if (player) {
      for (const char of player.characters) {
        const perks = ArmorPerksDialogComponent.getEquippedPerks(player, char);
        this.charPerks[char.id] = perks;
      }
    }
  }

  public static getEquippedPerks(player: Player, char: Character): PlayerMods[] {
    const armorMods: InventoryPlug[] = [];
    if (player.gear == null) {
      return [];
    }
    const equippedArmor = player.gear.filter(g => g.equipped.getValue() && g.owner.getValue().id == char.id && g.type == 2);
    for (const g of equippedArmor) {
      for (const s of g.sockets) {
        const mod = s.plugs.find(p => p.active);
        if (mod) {
          armorMods.push(mod);
        }
      }
    }
    const mods = ArmorPerksDialogComponent.rollUpMods(armorMods);
    return mods;
  }

  private static rollUpMods(mods: InventoryPlug[]): PlayerMods[] {
    const map: { [key: string]: InventoryPlug[] } = {};
    for (const m of mods) {
      if (!map[m.hash]) {
        map[m.hash] = [];
      }
      map[m.hash].push(m);
    }
    const returnMe: PlayerMods[] = [];
    for (const key of Object.keys(map)) {
      const val = map[key];
      returnMe.push({
        count: val.length,
        mod: val[0]
      });
    }
    returnMe.sort((a, b) => {
      if (a.mod.name > b.mod.name) {
        return 1;
      }
      if (b.mod.name > a.mod.name) {
        return -1;
      }
      return 0;
    });
    return returnMe;
  }
}

export interface PlayerMods {
  count: number;
  mod: InventoryPlug;
}
