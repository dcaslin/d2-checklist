import { Component } from '@angular/core';
import { AuthService } from '@app/service/auth.service';

import { ActivityFilterService } from '../services/activity-filter.service';

@Component({
  selector: 'd2c-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent {

  public filterPanelOpen: boolean = false;
  public filterButtonText: string = 'Edit Filters';

  constructor(
    public auth: AuthService,
    public filters: ActivityFilterService
  ) { }

  public toggleFilterPanel() {
    this.filterPanelOpen = !this.filterPanelOpen;
    this.filterButtonText = this.filterPanelOpen ? 'Hide Filters' : 'Edit Filters';
  }
}
