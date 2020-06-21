import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Component } from '@angular/core';
import { BountyCharInfo, SaleStatus } from '@app/todo-list/interfaces/vendor.interface';

@Component({
  selector: 'progress-cell',
  templateUrl: './progress-renderer.component.html',
  styleUrls: ['./progress-renderer.component.scss']
})
export class ProgressRenderer implements ICellRendererAngularComp {
  public params: any;
  public statusText: string;
  public state: ProgressStates;
  public info: BountyCharInfo;

  // expiration counter
  public count: number;

  public states = ProgressStates; // for intellisense in the template

  agInit(params: any): void {
    this.params = params;
    // If the status is for a bounty, set the status
    this.setBountyStatus(params.value);
  }

  refresh(): boolean {
    return false;
  }

  private setBountyStatus(info: BountyCharInfo) {
    // If there's no data, assume the bounty is not available
    info = this.cleanValue(info);
    const displayStuff = BOUNTY_STATUS_MAP[info.saleStatus];
    this.statusText = displayStuff.text;
    this.state = displayStuff.state;
    this.info = info;
  }

  /**
   * Makes sure the value isn't null and it has the properties to work
   */
  private cleanValue(v: any) {
    v = v ? v : {};
    // 0 is a valid sale status, and we don't want that being replaced
    v.saleStatus = v.saleStatus !== undefined ? v.saleStatus : SaleStatus.NOT_AVAILABLE;
    return v;
  }
}

/**
 * Maps for looking shit up
 */

 // I went with progress states instead of specifying a specific icon because
 // for milestones (and maybe bounties eventually, completion isn't just a yes/no check)
 // but can have intermediate progress that I would want to show
enum ProgressStates {
  INCOMPLETE = 0,
  IN_PROGRESS = 1,
  COMPLETE = 2,
  UNKNOWN = 3
}

const NOT_AVAILABLE_META = {
  text: 'Not Available',
  state: ProgressStates.UNKNOWN
}

const BOUNTY_STATUS_MAP = {
  [SaleStatus.AVAILABLE]: {
    text: '',
    state: ProgressStates.INCOMPLETE
  },
  [SaleStatus.COMPLETED]: {
    text: '',
    state: ProgressStates.COMPLETE
  },
  [SaleStatus.NOT_FOR_SALE]: NOT_AVAILABLE_META,
  [SaleStatus.NOT_AVAILABLE]: NOT_AVAILABLE_META,
  [SaleStatus.ALREADY_HELD]: {
    text: 'Purchased',
    state: ProgressStates.IN_PROGRESS
  }
}
