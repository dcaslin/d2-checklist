import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TodoListComponent } from './components/todo-list.component';
import { TodoListRoutingModule } from './todo-list-routing.module';
import { ActivityCatalogService } from './services/activity-catalog.service';
import { BountyCatalogService } from './services/bounty-catalog.service';
import { ContextService } from './services/context-service';
import { HttpService } from './services/http.service';
import { DictionaryService } from './services/dictionary.service';
import { MilestoneCatalogService } from './services/milestone-catalog.service';

@NgModule({
  imports: [
    CommonModule,
    TodoListRoutingModule,
  ],
  declarations: [
    TodoListComponent,
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
