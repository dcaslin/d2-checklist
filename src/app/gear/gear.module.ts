import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { GearComponent } from './gear/gear.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [GearComponent]
})
export class GearModule  { }
