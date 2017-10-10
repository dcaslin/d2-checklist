import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../shared';
import { PlayerComponent } from './player/player.component';
import {GearComponent} from './player/gear/gear.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [PlayerComponent, GearComponent]
})
export class PlayerModule { }
