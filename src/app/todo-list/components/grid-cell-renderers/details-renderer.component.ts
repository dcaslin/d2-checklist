import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityRow } from '@app/todo-list/interfaces/activity.interface';

@Component({
  selector: 'details-cell',
  template: `
  <div class="multi-line-cell" [matTooltip]="data.detailTooltip">
    <div class="text-wrapper">
      <div class="truncate">{{ data.detailTitle }}</div>
      <div class="type-caption truncate">{{ data.detailSubText }}</div>
    </div>
  </div>
  `,
  styles: [`
    .text-wrapper {
      align-self: center;
      overflow: hidden;
      user-select: text;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
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
