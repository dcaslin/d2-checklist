import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { GearComponent, GearDetailsDialogComponent, GearHelpDialogComponent } from './gear/gear.component';
import { GearToggleComponent} from './gear/gear-toggle.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [GearComponent, GearToggleComponent, GearDetailsDialogComponent, GearHelpDialogComponent],
  entryComponents: [
    GearDetailsDialogComponent, GearHelpDialogComponent
  ],
})
export class GearModule  { }
