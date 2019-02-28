import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { PlayerComponent, QuestDialogComponent, BurnDialogComponent } from './player/player.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [PlayerComponent, QuestDialogComponent, BurnDialogComponent],
  entryComponents: [
    QuestDialogComponent, BurnDialogComponent
  ],
})
export class PlayerModule { }
