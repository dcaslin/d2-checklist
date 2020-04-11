import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClipboardModule } from 'ngx-clipboard';
import { GearComponent} from './gear/gear.component';
import { GodRollPlugComponent } from './god-roll-plug/god-roll-plug.component';
import { GodRollItemComponent } from './god-roll-item/god-roll-item.component';
import { PossibleRollsDialogComponent } from './possible-rolls-dialog/possible-rolls-dialog.component';
import { TargetArmorStatsDialogComponent } from './target-armor-stats-dialog/target-armor-stats-dialog.component';
import { GearCompareDialogComponent } from './gear/gear-compare-dialog/gear-compare-dialog.component';
import { GearHelpDialogComponent } from './gear/gear-help-dialog/gear-help-dialog.component';
import { BulkOperationsHelpDialogComponent } from './gear/bulk-operations-help-dialog/bulk-operations-help-dialog.component';
import { GearUtilitiesDialogComponent } from './gear/gear-utilities-dialog/gear-utilities-dialog.component';
import { ArmorPerksDialogComponent } from './gear/armor-perks-dialog/armor-perks-dialog.component';
import { GearToggleComponent } from './gear/gear-toggle/gear-toggle.component';
import { HorizontalSortComponent } from './gear/gear-compare-dialog/horizontal-sort/horizontal-sort.component';

@NgModule({
  imports: [
    SharedModule, ClipboardModule
  ],
  declarations: [GearComponent, GearToggleComponent, GearCompareDialogComponent, GearHelpDialogComponent, BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent,
    ArmorPerksDialogComponent, TargetArmorStatsDialogComponent, GodRollPlugComponent, GodRollItemComponent, PossibleRollsDialogComponent, TargetArmorStatsDialogComponent, GearCompareDialogComponent, HorizontalSortComponent],
  entryComponents: [
    PossibleRollsDialogComponent,
    GearCompareDialogComponent, GearHelpDialogComponent,
    BulkOperationsHelpDialogComponent, GearUtilitiesDialogComponent,
    ArmorPerksDialogComponent, TargetArmorStatsDialogComponent
  ],
})
export class GearModule  { }
