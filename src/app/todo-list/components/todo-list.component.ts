import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AuthService } from '@app/service/auth.service';

import { ActivityFilterService } from '../services/activity-filter.service';
import { ContextService } from '../services/context-service';
import { GridSettingsService } from '../services/grid-settings.service';

@Component({
  selector: 'd2c-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent {

  public filterPanelOpen: boolean = false;
  public filterButtonText: string = 'Edit Filters';
  /**
   * Initialize to false because the first load shouldn't spin the icon
   */
  public loading: boolean = false;
  public initialLoaded: boolean = false;

  constructor(
    public auth: AuthService,
    public filters: ActivityFilterService,
    public gridSettings: GridSettingsService,
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
    if (!this.loading) { // prevent spamming the reload button
      this.loading = true;
      this.context.refresh();
    }
  }

  public onDataLoad() {
    this.loading = false;
    this.initialLoaded = true;
    this.queueNextAutoLoad();
  }

  public onCompactToggleChange(event: MatSlideToggleChange) {
    this.gridSettings.changeCompactMode(event.checked);
  }

  public hideCompleteToggle(event: MatCheckboxChange) {
    this.gridSettings.changeCompleteHide(event.checked);
  }

  private queueNextAutoLoad() {
    setTimeout(() => {
      this.loading = true;
      this.context.refresh();
    }, REFRESH_INTERVAL * 1000)
  }
}

// how often the table will refresh its data (in seconds)
const REFRESH_INTERVAL = 60;
