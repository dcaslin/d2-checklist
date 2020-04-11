import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { WishlistService } from '@app/service/wishlist.service';
import { GearComponent } from '../gear.component';


@Component({
  selector: 'd2c-gear-utilities-dialog',
  templateUrl: './gear-utilities-dialog.component.html',
  styleUrls: ['../gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearUtilitiesDialogComponent {
  parent: GearComponent;
  tempWishlistPveOverrideUrl: string;
  tempWishlistPvpOverrideUrl: string;
  WishlistService = WishlistService;
  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    this.tempWishlistPveOverrideUrl = this.parent.wishlistOverridePveUrl != null ? this.parent.wishlistOverridePveUrl : WishlistService.DEFAULT_PVE_URL;
    this.tempWishlistPvpOverrideUrl = this.parent.wishlistOverridePvpUrl != null ? this.parent.wishlistOverridePvpUrl : WishlistService.DEFAULT_PVP_URL;
  }
}
