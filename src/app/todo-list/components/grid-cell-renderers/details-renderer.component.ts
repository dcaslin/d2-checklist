import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Component } from '@angular/core';
import { ActivityRow } from '@app/todo-list/interfaces/activity.interface';

@Component({
  selector: 'details-cell',
  template: `
  <div class="multi-line-cell" [matTooltip]="data.detailTooltip">
    <div class="text-wrapper">
      <div>{{ data.detailTitle }}</div>
      <div class="type-caption">{{ data.detailSubText }}</div>
    </div>
  </div>
  `,
  styles: [`
    .text-wrapper {
      align-self: center;
    }
  `]
})
export class DetailsRenderer implements ICellRendererAngularComp {
  public params: any;
  public data: ActivityRow;

  /**
   * Takes in the whole ActivityRow object
   * @param params
   */
  agInit(params: any): void {
    this.params = params;
    this.data = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
