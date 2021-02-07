import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { VendorDeals } from '@app/service/vendor.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-armor-deals',
  templateUrl: './armor-deals.component.html',
  styleUrls: ['./armor-deals.component.scss']
})
export class ArmorDealsComponent implements OnInit {
  @Input() vendorDeals: VendorDeals;

  constructor() { }

  ngOnInit(): void {
  }

}
