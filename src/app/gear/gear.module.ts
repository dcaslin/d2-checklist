import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClipboardModule } from 'ngx-clipboard';
import { GearComponent, GearDetailsDialogComponent, GearHelpDialogComponent, BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent, ArmorPerksDialogComponent } from './gear/gear.component';
import { GearToggleComponent} from './gear/gear-toggle.component';

@NgModule({
  imports: [
    SharedModule, ClipboardModule
  ],
  declarations: [GearComponent, GearToggleComponent, GearDetailsDialogComponent, GearHelpDialogComponent, BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent, ArmorPerksDialogComponent],
  entryComponents: [
    GearDetailsDialogComponent, GearHelpDialogComponent, BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent, ArmorPerksDialogComponent
  ],
})
export class GearModule  { }
