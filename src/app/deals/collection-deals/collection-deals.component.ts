import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { VendorDeals } from '@app/service/vendor.service';
import { DestinyClasses } from '@app/service/model';
import { MatTooltip } from '@angular/material/tooltip';
import { NgIf, NgFor } from '@angular/common';
import { ItemIconComponent } from '../../shared/item-icon/item-icon.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-collection-deals',
    templateUrl: './collection-deals.component.html',
    styleUrls: ['./collection-deals.component.scss'],
    standalone: true,
    imports: [MatTooltip, NgIf, NgFor, ItemIconComponent]
})
export class CollectionDealsComponent {
  @Input() vendorDeals!: VendorDeals;

  public DestinyClasses = DestinyClasses;

}
