import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { VendorDeals } from '@app/service/vendor.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-deals',
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})
export class DealsComponent {

  // @Input() currUser: SelectedUser;
  // @Input() player: Player;
  // @Input() vendorData: CharacterVendorData[];

  @Input() debugmode: boolean;
  @Input() loading: boolean;
  @Input() vendorsLoading: boolean;
  @Input() vendorDeals: VendorDeals;

  @Output() refresh = new EventEmitter<void>();

}
