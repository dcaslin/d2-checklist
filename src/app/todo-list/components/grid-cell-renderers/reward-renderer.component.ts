import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivityRow } from '@app/todo-list/interfaces/activity.interface';

@Component({
  selector: 'details-cell',
  templateUrl: './reward-renderer.component.html',
  styleUrls: ['./reward-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RewardRenderer implements ICellRendererAngularComp {
  public params: any;
  public data: ActivityRow;

  /**
   * should pass in a whole bounty/milestone object
   * @param params
   */
  agInit(params: any): void {
    this.params = params;
    // If the status is for a bounty, set the status
    this.data = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
