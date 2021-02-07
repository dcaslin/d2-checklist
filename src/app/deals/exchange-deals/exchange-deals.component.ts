import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { VendorDeals } from '@app/service/vendor.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-exchange-deals',
  templateUrl: './exchange-deals.component.html',
  styleUrls: ['./exchange-deals.component.scss']
})
export class ExchangeDealsComponent implements OnInit {
  @Input() vendorDeals: VendorDeals;

  constructor() { }

  ngOnInit(): void {
  }

}
