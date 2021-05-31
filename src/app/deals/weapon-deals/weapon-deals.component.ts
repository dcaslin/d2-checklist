import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { InventoryItem } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { VendorDeals } from '@app/service/vendor.service';
import { WeaponCompareDialogComponent } from '../weapon-compare-dialog/weapon-compare-dialog.component';

@Component({
  selector: 'd2c-weapon-deals',
  templateUrl: './weapon-deals.component.html',
  styleUrls: ['./weapon-deals.component.scss']
})
export class WeaponDealsComponent implements OnInit {
  @Input() vendorDeals: VendorDeals;

  constructor(
    public dialog: MatDialog,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService) { }

  ngOnInit(): void {
  }

  
  showLegendaryDialog(ii: InventoryItem[]) {    
    this.showDialog(ii[0].name, ii);
  }
  
  private showDialog(title: string, gear: InventoryItem[]) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      title,
      gear
    };
    return this.dialog.open(WeaponCompareDialogComponent, dc);

  }

}
