import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import { SharedModule } from '../shared';
import { CharsComponent } from './chars/chars.component';
import { ChecklistComponent } from './checklist/checklist.component';
import { CollectionBadgeComponent } from './collections/collection-badge/collection-badge.component';
import { CollectionBadgesComponent } from './collections/collection-badges/collection-badges.component';
import { CollectionSearchComponent } from './collections/collection-search/collection-search.component';
import { CollectionTreeComponent } from './collections/collection-tree/collection-tree.component';
import { CollectionsComponent } from './collections/collections.component';
import { LifetimeComponent } from './lifetime/lifetime.component';
import { PlayerEfficiencyGraphComponent } from './lifetime/player-efficiency-graph/player-efficiency-graph.component';
import { MilestonesComponent } from './milestones/milestones.component';
import { RewardDescComponent } from './milestones/reward-desc/reward-desc.component';
import { MoreComponent } from './more/more.component';
import { BurnDialogComponent, PlayerComponent } from './player.component';
import { ProgressStepDialogComponent } from './progress/progress-step-dialog/progress-step-dialog.component';
import { ProgressComponent } from './progress/progress.component';
import { PursuitListComponent } from './pursuits/pursuit-list/pursuit-list.component';
import { QuestDialogComponent } from './pursuits/pursuit-list/quest-dialog/quest-dialog.component';
import { PursuitsComponent } from './pursuits/pursuits.component';
import { TriumphClosestComponent } from './triumphs/triumph-closest/triumph-closest.component';
import { TriumphSealsComponent } from './triumphs/triumph-seals/triumph-seals.component';
import { TriumphSearchComponent } from './triumphs/triumph-search/triumph-search.component';
import { TriumphSeasonsComponent } from './triumphs/triumph-seasons/triumph-seasons.component';
import { TriumphTrackedComponent } from './triumphs/triumph-tracked/triumph-tracked.component';
import { TriumphTreeComponent } from './triumphs/triumph-tree/triumph-tree.component';
import { TriumphsComponent } from './triumphs/triumphs.component';


@NgModule({
  imports: [
    SharedModule,
    ChartsModule
  ],
  declarations: [PlayerComponent, QuestDialogComponent, ProgressStepDialogComponent, BurnDialogComponent, CollectionsComponent, TriumphsComponent, 
    CharsComponent, ChecklistComponent, ProgressComponent, MilestonesComponent, TriumphTreeComponent, TriumphSeasonsComponent, TriumphSealsComponent, 
    TriumphClosestComponent, TriumphSearchComponent, TriumphTrackedComponent, CollectionTreeComponent, CollectionSearchComponent, CollectionBadgesComponent, 
    CollectionBadgeComponent, RewardDescComponent, PursuitsComponent, ProgressStepDialogComponent, LifetimeComponent, MoreComponent, 
    PlayerEfficiencyGraphComponent, PursuitListComponent],
  entryComponents: [
    QuestDialogComponent, BurnDialogComponent, ProgressStepDialogComponent
  ],
})
export class PlayerModule { }
