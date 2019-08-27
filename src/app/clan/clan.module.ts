import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClanComponent } from './clan.component';
import { ClanMilestonesComponent } from './clan-milestones/clan-milestones.component';
import { ClanInfoComponent } from './clan-info/clan-info.component';
import { ClanLifetimeComponent } from './clan-lifetime/clan-lifetime.component';
import { ClanTriumphsComponent } from './clan-triumphs/clan-triumphs.component';
import { ClanMembersComponent } from './clan-members/clan-members.component';
import { ClanSealsComponent } from './clan-triumphs/clan-seals/clan-seals.component';
import { ClanTriumphSearchComponent } from './clan-triumphs/clan-triumph-search/clan-triumph-search.component';
import { ClanTriumphTrackedComponent } from './clan-triumphs/clan-triumph-tracked/clan-triumph-tracked.component';
import { ClanTriumphItemComponent } from './clan-triumphs/clan-triumph-item/clan-triumph-item.component';
import { ClanTriumphItemDialogComponent } from './clan-triumphs/clan-triumph-item-dialog/clan-triumph-item-dialog.component';
import { ClanTriumphSealDialogComponent } from './clan-triumphs/clan-triumph-seal-dialog/clan-triumph-seal-dialog.component';
import { ChartsModule } from 'ng2-charts';
import { ClanTriumphGraphComponent } from './clan-triumphs/clan-triumph-graph/clan-triumph-graph.component';
import { ClanSettingsComponent } from './clan-settings/clan-settings.component';
import { ClanUserListDialogComponent } from './clan-settings/clan-user-list-dialog/clan-user-list-dialog.component';

@NgModule({
  imports: [
    SharedModule,
    ChartsModule
  ],
  declarations: [ClanComponent, ClanMilestonesComponent, ClanInfoComponent,
    ClanLifetimeComponent, ClanTriumphsComponent, ClanMembersComponent, ClanSealsComponent, ClanTriumphSearchComponent, ClanTriumphTrackedComponent, ClanTriumphItemComponent, ClanTriumphItemDialogComponent, ClanTriumphSealDialogComponent, ClanTriumphGraphComponent, ClanSettingsComponent, ClanUserListDialogComponent],
  entryComponents: [ClanTriumphItemDialogComponent, ClanTriumphSealDialogComponent, ClanUserListDialogComponent]
})
export class ClanModule { }
