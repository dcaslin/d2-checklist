import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { GearComponent, GearDetailsDialogComponent } from './gear/gear.component';
import { GearToggleComponent} from './gear/gear-toggle.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [GearComponent, GearToggleComponent, GearDetailsDialogComponent],
  entryComponents: [
    GearDetailsDialogComponent
  ],
})
export class GearModule  { }
