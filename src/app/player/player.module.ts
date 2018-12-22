import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { PlayerComponent, QuestDialogComponent } from './player/player.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [PlayerComponent, QuestDialogComponent],
  entryComponents: [
    QuestDialogComponent
  ],
})
export class PlayerModule { }
