import { Component } from '@angular/core';
import { AuthService } from '@app/service/auth.service';

import { ActivityFilterService } from '../services/activity-filter.service';
import { ContextService } from '../services/context-service';

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
    public filters: ActivityFilterService,
    private context: ContextService
  ) { }

  public toggleFilterPanel() {
    this.filterPanelOpen = !this.filterPanelOpen;
    this.filterButtonText = this.filterPanelOpen ? 'Hide Filters' : 'Edit Filters';
  }

  public clearFilters() {
    this.filters.clearFilters();
  }

  /**
   * Not currently used, but this will be used eventually for refresh
   */
  public refresh() {
    this.context.refresh();
  }
}
