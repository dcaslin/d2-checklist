import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { TargetArmorStatsDialogComponent } from '@app/gear/target-armor-stats-dialog/target-armor-stats-dialog.component';
import { IconService } from '@app/service/icon.service';
import { ClassAllowed, InventoryItem } from '@app/service/model';
import { ParseService } from '@app/service/parse.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { ClassInventoryBucket, ExoticInventoryBucket, VendorDeals } from '@app/service/vendor.service';
import { ArmorCompareDialogComponent } from '../armor-compare-dialog/armor-compare-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-armor-deals',
  templateUrl: './armor-deals.component.html',
  styleUrls: ['./armor-deals.component.scss']
})
export class ArmorDealsComponent {
  @Input() vendorDeals: VendorDeals;

  constructor(
    public dialog: MatDialog,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService) { }

  public showTargetArmorStats(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    const dialogRef = this.dialog.open(TargetArmorStatsDialogComponent, dc);
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Save' || result === 'Reset') {
        this.signedOnUserService.refreshPlayerAndVendors();
      }
    });
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
