import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IconService } from '@app/service/icon.service';
import { BountySet } from '@app/service/model';

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
        if (a.vendor && !b.vendor) {
          return 1;
        } else if (!a.vendor && b.vendor) {
          return -1;
        } else if (a.vendor && b.vendor) {
          if (a.vendor.name > b.vendor.name) {
            return 1;
          } else if (a.vendor.name < b.vendor.name) {
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
