import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';


import { HistoryComponent } from './history/history.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [HistoryComponent]
})
export class HistoryModule { }
