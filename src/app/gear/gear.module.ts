import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { GearComponent } from './gear/gear.component';
import { GearToggleComponent} from './gear/gear-toggle.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [GearComponent, GearToggleComponent]
})
export class GearModule  { }
