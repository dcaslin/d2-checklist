import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Component } from '@angular/core';
import { ActivityCharInfo, ProgressStyle, ActivityStatus } from '@app/todo-list/interfaces/activity.interface';

@Component({
  selector: 'progress-cell',
  templateUrl: './progress-renderer.component.html',
  styleUrls: ['./progress-renderer.component.scss']
})
export class ProgressRenderer implements ICellRendererAngularComp {
  public params: any;
  public data: ActivityCharInfo;

  //for enum referencing in the template
  public ProgressStyle = ProgressStyle;
  public ActivityStatus = ActivityStatus;

  // expiration counter if needed
  public count: number;

  agInit(params: any): void {
    this.params = params;
    this.data = params.value;
  }

  refresh(): boolean {
    return false;
  }
}
