import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { TargetPerkService, PlayerMods } from '@app/service/target-perk.service';
import { WishlistService } from '@app/service/wishlist.service';
import { GearComponent } from '../gear.component';
import { Character } from '@app/service/model';


@Component({
  selector: 'd2c-armor-perks-dialog',
  templateUrl: './armor-perks-dialog.component.html',
  styleUrls: ['./armor-perks-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArmorPerksDialogComponent {
  parent: GearComponent;
  charPerks: { [key: string]: PlayerMods[] };
  tempWishlistOverrideUrl: string;
  WishlistService = WishlistService;
  TargetPerkService = TargetPerkService;

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<ArmorPerksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    const player = this.parent._player.getValue();
    this.charPerks = {};
    if (player) {
      for (const char of player.characters) {
        const perks = TargetPerkService.getEquippedPerks(player, char);
        this.charPerks[char.id] = perks;
      }
    }
  }
}