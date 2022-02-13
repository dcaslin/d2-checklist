import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { VendorDeals } from '@app/service/vendor.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-exchange-deals',
  templateUrl: './exchange-deals.component.html',
  styleUrls: ['./exchange-deals.component.scss']
})
export class ExchangeDealsComponent {
  @Input() vendorDeals: VendorDeals;

  constructor(public iconService: IconService, public signedOnUserService: SignedOnUserService) {}

}
