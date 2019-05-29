import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { PlayerComponent, QuestDialogComponent, BurnDialogComponent } from './player/player.component';
import { CollectionsComponent } from './player/collections/collections.component';
import { TriumphsComponent } from './player/triumphs/triumphs.component';
import { CharsComponent } from './player/chars/chars.component';
import { ChecklistComponent } from './player/checklist/checklist.component';
import { BountiesComponent } from './player/bounties/bounties.component';
import { ProgressComponent } from './player/progress/progress.component';
import { MilestonesComponent } from './player/milestones/milestones.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [PlayerComponent, QuestDialogComponent, BurnDialogComponent, CollectionsComponent, TriumphsComponent, CharsComponent, ChecklistComponent, BountiesComponent, ProgressComponent, MilestonesComponent],
  entryComponents: [
    QuestDialogComponent, BurnDialogComponent
  ],
})
export class PlayerModule { }
