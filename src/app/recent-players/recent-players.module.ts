import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';
import { RecentPlayersComponent } from './recent-players/recent-players.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [RecentPlayersComponent]
})
export class RecentPlayersModule { }
