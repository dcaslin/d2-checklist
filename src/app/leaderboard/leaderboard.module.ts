import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../shared';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [LeaderboardComponent]
})
export class LeaderboardModule { }
