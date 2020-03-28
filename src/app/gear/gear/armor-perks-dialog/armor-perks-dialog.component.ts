import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IconService } from '@app/service/icon.service';
import { TargetPerkService } from '@app/service/target-perk.service';
import { WishlistService } from '@app/service/wishlist.service';
import { GearComponent } from '../gear.component';


@Component({
  selector: 'd2c-armor-perks-dialog',
  templateUrl: './armor-perks-dialog.component.html',
  styleUrls: ['../gear.component.scss']
})
export class ArmorPerksDialogComponent {
  parent: GearComponent;
  tempWishlistOverrideUrl: string;
  WishlistService = WishlistService;
  TargetPerkService = TargetPerkService;
  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<ArmorPerksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      // TODO fixme
    this.parent = data.parent;
  }
}