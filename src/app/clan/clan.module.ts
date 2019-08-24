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

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [ClanComponent, ClanMilestonesComponent, ClanInfoComponent,
    ClanLifetimeComponent, ClanTriumphsComponent, ClanMembersComponent, ClanSealsComponent, ClanTriumphSearchComponent, ClanTriumphTrackedComponent, ClanTriumphItemComponent, ClanTriumphItemDialogComponent],
  entryComponents: [ClanTriumphItemDialogComponent]
})
export class ClanModule { }
