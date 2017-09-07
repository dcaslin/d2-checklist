import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';


import { HistoryComponent } from './history/history.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [HistoryComponent]
})
export class HistoryModule { }
