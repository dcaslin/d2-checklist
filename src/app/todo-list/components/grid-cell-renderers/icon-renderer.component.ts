import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityRow } from '@app/todo-list/interfaces/activity.interface';

import { faBowArrow as fadBow} from '@fortawesome/pro-duotone-svg-icons';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'icon-cell',
  template: `<d2c-bungie-icon
      *ngIf="row.icon; else noIcon"
      [icon]="row.icon"
      [matTooltip]="row.iconTooltip"
      matTooltipClass="multi-line-tooltip">
    </d2c-bungie-icon>
    <ng-template #noIcon>
      <fa-icon [icon]="fadBow" size="3x"></fa-icon>
    </ng-template>
    `
})
export class IconRenderer implements ICellRendererAngularComp {
  public params: any;
  public row: ActivityRow;
  public fadBow = fadBow;

  agInit(params: any): void {
    this.params = params;
    this.row = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
