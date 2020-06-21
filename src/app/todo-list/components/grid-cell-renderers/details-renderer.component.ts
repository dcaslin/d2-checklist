import { Component } from '@angular/core';

import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Bounty } from '@app/todo-list/interfaces/vendor.interface';

@Component({
  selector: 'details-cell',
  template: `
  <div class="multi-line-cell" [matTooltip]="description">
    <div>{{name}}</div>
    <div class="type-caption">{{type}}</div>
  </div>
  `,
})
export class DetailsRenderer implements ICellRendererAngularComp {
  public params: any;
  public name: string;
  public type: string;
  public description: string;

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
    this.name = value.displayProperties.name;
    this.type = value.itemTypeDisplayName;
    this.description = value.displayProperties.description;
  }
}
