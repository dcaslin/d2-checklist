import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import { SharedModule } from '../shared';
import { ClanBadgesComponent } from './clan-collections/clan-badges/clan-badges.component';
import { ClanCollectionSearchComponent } from './clan-collections/clan-collection-search/clan-collection-search.component';
import { ClanCollectionsComponent } from './clan-collections/clan-collections.component';
import { ClanInfoComponent } from './clan-info/clan-info.component';
import { ClanLifetimeDialogComponent } from './clan-lifetime/clan-lifetime-dialog/clan-lifetime-dialog.component';
import { ClanLifetimeGraphComponent } from './clan-lifetime/clan-lifetime-graph/clan-lifetime-graph.component';
import { ClanLifetimeComponent } from './clan-lifetime/clan-lifetime.component';
import { ClanMembersComponent } from './clan-members/clan-members.component';
import { ClanMilestonesComponent } from './clan-milestones/clan-milestones.component';
import { ClanSettingsComponent } from './clan-settings/clan-settings.component';
import { ClanUserListDialogComponent } from './clan-settings/clan-user-list-dialog/clan-user-list-dialog.component';
import { ClanSealsComponent } from './clan-triumphs/clan-seals/clan-seals.component';
import { ClanTriumphGraphComponent } from './clan-triumphs/clan-triumph-graph/clan-triumph-graph.component';
import { ClanTriumphItemDialogComponent } from './clan-triumphs/clan-triumph-item-dialog/clan-triumph-item-dialog.component';
import { ClanTriumphItemComponent } from './clan-triumphs/clan-triumph-item/clan-triumph-item.component';
import { ClanTriumphSealDialogComponent } from './clan-triumphs/clan-triumph-seal-dialog/clan-triumph-seal-dialog.component';
import { ClanTriumphSearchComponent } from './clan-triumphs/clan-triumph-search/clan-triumph-search.component';
import { ClanTriumphTrackedComponent } from './clan-triumphs/clan-triumph-tracked/clan-triumph-tracked.component';
import { ClanTriumphsComponent } from './clan-triumphs/clan-triumphs.component';
import { ClanComponent } from './clan.component';

@NgModule({
  imports: [
    SharedModule,
    ChartsModule
  ],
  declarations: [ClanComponent, ClanMilestonesComponent, ClanInfoComponent,
    ClanLifetimeComponent, ClanTriumphsComponent, ClanMembersComponent, ClanSealsComponent, ClanTriumphSearchComponent, ClanTriumphTrackedComponent, ClanTriumphItemComponent, ClanTriumphItemDialogComponent, ClanTriumphSealDialogComponent, ClanTriumphGraphComponent, ClanSettingsComponent, ClanUserListDialogComponent, ClanLifetimeDialogComponent, ClanLifetimeGraphComponent, ClanCollectionsComponent, ClanBadgesComponent, ClanCollectionSearchComponent],
  entryComponents: [ClanTriumphItemDialogComponent, ClanTriumphSealDialogComponent, ClanUserListDialogComponent, ClanLifetimeDialogComponent]
})
export class ClanModule { }
