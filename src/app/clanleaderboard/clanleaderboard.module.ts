import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClanLeaderboardComponent } from './clanleaderboard/clanleaderboard.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [ClanLeaderboardComponent]
})
export class ClanLeaderboardModule { }
