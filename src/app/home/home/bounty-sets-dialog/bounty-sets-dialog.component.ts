import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IconService } from '@app/service/icon.service';
import { BountySet, SaleItem } from '@app/service/model';

@Component({
  selector: 'd2c-bounty-sets-dialog',
  templateUrl: './bounty-sets-dialog.component.html',
  styleUrls: ['./bounty-sets-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountySetsDialogComponent implements OnInit {

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<BountySetsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BountySet) {
      data.bounties.sort((a, b) => {
        const vA = a as SaleItem;
        const vB = b as SaleItem;
        if (vA.vendor && !vB.vendor) {
          return 1;
        } else if (!vA.vendor && vB.vendor) {
          return -1;
        } else if (vA.vendor && vB.vendor) {
          if (vA.vendor.name > vB.vendor.name) {
            return 1;
          } else if (vA.vendor.name < vB.vendor.name) {
            return -1;
          }
        }
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        }
        return 0;
      });
  }

  ngOnInit() {
  }

}
