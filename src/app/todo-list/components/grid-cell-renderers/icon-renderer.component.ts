import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityRow } from '@app/todo-list/interfaces/activity.interface';

@Component({
  selector: 'icon-cell',
  template: `
    <d2c-bungie-icon
      *ngIf="row.icon"
      [icon]="row.icon"
      [matTooltip]="row.iconTooltip"
      matTooltipClass="multi-line-tooltip">
    </d2c-bungie-icon>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconRenderer implements ICellRendererAngularComp {
  public params: any;
  public row: ActivityRow

  agInit(params: any): void {
    this.params = params;
    this.row = params.value
  }

  refresh(): boolean {
    return false;
  }
}
