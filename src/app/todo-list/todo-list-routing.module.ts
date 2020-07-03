import { Routes } from '@angular/router';
import { RouterModule } from  '@angular/router';

import { NgModule } from '@angular/core';
import { TodoListComponent } from './components/todo-list.component';

const routes: Routes = [
  { path: '', component: TodoListComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TodoListRoutingModule { }
