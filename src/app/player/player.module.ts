import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../shared';
import { PlayerComponent } from './player/player.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [PlayerComponent]
})
export class PlayerModule { }
