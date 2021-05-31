import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { VendorDeals } from '@app/service/vendor.service';

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
}
