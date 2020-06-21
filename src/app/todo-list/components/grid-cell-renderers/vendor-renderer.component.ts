import { Component } from '@angular/core';

import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Bounty, CostReward } from '@app/todo-list/interfaces/vendor.interface';

@Component({
  selector: 'details-cell',
  template: `
  <div class="multi-line-cell">
    <div>{{vendorName}}</div>
    <div *ngFor="let cost of costs | costReward" class="type-caption">{{cost}}</div>
  </div>
  `,
})
export class VendorRenderer implements ICellRendererAngularComp {
  public params: any;
  public vendorName: string;
  public costs: CostReward[];

  /**
   * should pass in a whole bounty/milestone object
   * @param params
   */
  agInit(params: any): void {
    this.params = params;
    // If the status is for a bounty, set the status
    this.setBountyDisplayValues(params.value);
  }

  refresh(): boolean {
    return false;
  }

  private setBountyDisplayValues(value: Bounty) {
    this.vendorName = value.vendorName;
    // cost should always be array length 1
    this.costs = value.costs;
  }
}
