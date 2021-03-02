import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { AuthService } from '@app/service/auth.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

import { ActivityFilterService } from '../services/activity-filter.service';
import { ContextService } from '../services/context-service';
import { GridSettingsService } from '../services/grid-settings.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent {

  public filterPanelOpen: boolean = false;
  public filterButtonText: string = 'Edit Filters';

  constructor(
    public auth: AuthService,
    public signedOnUserService: SignedOnUserService,
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
    this.context.refresh();
  }

  public onCompactToggleChange(event: MatSlideToggleChange) {
    this.gridSettings.changeCompactMode(event.checked);
  }

  public hideCompleteToggle(event: MatCheckboxChange) {
    this.gridSettings.changeCompleteHide(event.checked);
  }
}
