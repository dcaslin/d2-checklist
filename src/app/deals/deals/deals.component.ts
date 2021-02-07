import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VendorDeals } from '@app/service/vendor.service';

@Component({
  selector: 'd2c-deals',
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})
export class DealsComponent implements OnInit {

  // @Input() currUser: SelectedUser;
  // @Input() player: Player;
  // @Input() vendorData: CharacterVendorData[];

  @Input() debugmode: boolean;
  @Input() loading: boolean;
  @Input() vendorsLoading: boolean;
  @Input() vendorDeals: VendorDeals;

  @Output() refresh = new EventEmitter<void>();
  // @Output() showModalBountySet = new EventEmitter<BountySet>();

  constructor() { }

  ngOnInit(): void {
  }

}
