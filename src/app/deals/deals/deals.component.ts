import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { VendorDeals } from '@app/service/vendor.service';
import { NgIf } from '@angular/common';
import { CollectionDealsComponent } from '../collection-deals/collection-deals.component';
import { WeaponDealsComponent } from '../weapon-deals/weapon-deals.component';
import { ArmorDealsComponent } from '../armor-deals/armor-deals.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-deals',
    templateUrl: './deals.component.html',
    styleUrls: ['./deals.component.scss'],
    standalone: true,
    imports: [NgIf, CollectionDealsComponent, WeaponDealsComponent, ArmorDealsComponent]
})
export class DealsComponent {

  // @Input() currUser: SelectedUser;
  // @Input() player: Player;
  // @Input() vendorData: CharacterVendorData[];

  @Input() debugmode!: boolean;
  @Input() loading!: boolean;
  @Input() vendorsLoading!: boolean;
  @Input() vendorDeals!: VendorDeals;

  @Output() refresh = new EventEmitter<void>();

}
