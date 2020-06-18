import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TodoListComponent } from './components/todo-list.component';
import { TodoListRoutingModule } from './todo-list-routing.module';
import { ActivityCatalogService } from './services/activity-catalog.service';
import { BountyCatalogService } from './services/bounty-catalog.service';

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
  ],
  exports: [
    TodoListComponent,
  ]
})
export class TodoListModule { }
