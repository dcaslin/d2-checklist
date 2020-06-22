import { AgGridModule } from '@ag-grid-community/angular';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BungieIconModule } from '@app/bungie-icon/bungie-icon.module';
import { CountdownModule } from '@app/countdown/countdown.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { BountyFiltersComponent } from './components/bounty-filters/bounty-filters.component';
import { DetailsRenderer } from './components/grid-cell-renderers/details-renderer.component';
import { IconRenderer } from './components/grid-cell-renderers/icon-renderer.component';
import { ProgressRenderer } from './components/grid-cell-renderers/progress-renderer.component';
import { RewardRenderer } from './components/grid-cell-renderers/reward-renderer.component';
import { IconComponent } from './components/icon/icon.component';
import { TodoListComponent } from './components/todo-list.component';
import { TodoTableComponent } from './components/todo-table/todo-table.component';
import { CostRewardPipe } from './pipes/cost-reward.pipe';
import { ActivityCatalogService } from './services/activity-catalog.service';
import { BountyCatalogService } from './services/bounty-catalog.service';
import { ContextService } from './services/context-service';
import { DictionaryService } from './services/dictionary.service';
import { HttpService } from './services/http.service';
import { MilestoneCatalogService } from './services/milestone-catalog.service';
import { TodoListRoutingModule } from './todo-list-routing.module';

ModuleRegistry.registerModules([
    ClientSideRowModelModule
]);

@NgModule({
  imports: [
    CommonModule,
    TodoListRoutingModule,
    AgGridModule.withComponents([
      IconRenderer,
      ProgressRenderer,
      DetailsRenderer,
      RewardRenderer
    ]),
    MatTooltipModule,
    FontAwesomeModule,
    CountdownModule,
    BungieIconModule
  ],
  declarations: [
    TodoListComponent,
    TodoTableComponent,
    IconRenderer,
    ProgressRenderer,
    DetailsRenderer,
    RewardRenderer,
    CostRewardPipe,
    IconComponent,
    BountyFiltersComponent,
  ],
  providers: [
    ActivityCatalogService,
    BountyCatalogService,
    ContextService,
    DictionaryService,
    HttpService,
    MilestoneCatalogService,
  ],
  exports: [
    TodoListComponent,
  ]
})
export class TodoListModule { }
