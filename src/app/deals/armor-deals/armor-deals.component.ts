import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClassAllowed, InventoryItem } from '@app/service/model';
import { ParseService } from '@app/service/parse.service';
import { ClassInventoryBucket, ExoticInventoryBucket, VendorDeals } from '@app/service/vendor.service';
import { ArmorCompareDialogComponent } from '../armor-compare-dialog/armor-compare-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-armor-deals',
  templateUrl: './armor-deals.component.html',
  styleUrls: ['./armor-deals.component.scss']
})
export class ArmorDealsComponent implements OnInit {
  @Input() vendorDeals: VendorDeals;

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }


  showLegendaryDialog(show: ClassInventoryBucket) {
    const title = `${ParseService.cookEnergyType(show.energyType)} ${ClassAllowed[show.classType]} ${show.bucket.displayProperties.name}`;
    this.showDialog(title, show.gear);
  }

  showExoticDialog(show: ExoticInventoryBucket) {
    const title = `${show.gear[0].name}`;
    this.showDialog(title, show.gear);
  }

  private showDialog(title: string, gear: InventoryItem[]) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      title,
      gear
    };
    return this.dialog.open(ArmorCompareDialogComponent, dc);

  }

}
