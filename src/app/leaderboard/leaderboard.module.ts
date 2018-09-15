import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../shared';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { LeviathanComponent } from './leaderboard/leviathan.component';
import { LeviathanPrestigeComponent } from './leaderboard/leviathan-prestige.component';
import { RaidLastWishComponent } from './leaderboard/raid-last-wish.component';


@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [LeaderboardComponent, LeviathanComponent, LeviathanPrestigeComponent, RaidLastWishComponent]
})
export class LeaderboardModule { }
