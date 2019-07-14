import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { PlayerComponent } from './player';
import { AuthComponent } from './auth';
import { HistoryComponent } from './history';
import { RecentPlayersComponent } from './recent-players';
import { PGCRComponent } from './pgcr';
import { ResourcesComponent } from './resources';
import { AboutComponent } from './about';
import { FriendsComponent } from './friends';
import { GearComponent } from './gear';
import { SettingsComponent } from './settings';
import { BungieSearchComponent } from './bungie-search';
import { ClanSearchComponent } from './clan-search';
import { ClanComponent } from './clan';
import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { DestinyCacheService } from './service/destiny-cache.service';
import { Subject, Observable } from 'rxjs';
import { BungieService } from '@app/service/bungie.service';
import { filter } from 'rxjs/operators';
import { MilestonesComponent } from './player/milestones/milestones.component';
import { ChecklistComponent } from './player/checklist/checklist.component';
import { ProgressComponent } from './player/progress/progress.component';
import { CharsComponent } from './player/chars/chars.component';
import { TriumphsComponent } from './player/triumphs/triumphs.component';
import { TriumphTreeComponent } from './player/triumphs/triumph-tree/triumph-tree.component';
import { TriumphSeasonsComponent } from './player/triumphs/triumph-seasons/triumph-seasons.component';
import { TriumphSealsComponent } from './player/triumphs/triumph-seals/triumph-seals.component';
import { TriumphClosestComponent } from './player/triumphs/triumph-closest/triumph-closest.component';
import { TriumphSearchComponent } from './player/triumphs/triumph-search/triumph-search.component';
import { TriumphTrackedComponent } from './player/triumphs/triumph-tracked/triumph-tracked.component';
import { CollectionBadgesComponent } from './player/collections/collection-badges/collection-badges.component';
import { CollectionSearchComponent } from './player/collections/collection-search/collection-search.component';
import { CollectionTreeComponent } from './player/collections/collection-tree/collection-tree.component';
import { CollectionsComponent } from './player/collections/collections.component';
import { CollectionBadgeComponent } from './player/collections/collection-badge/collection-badge.component';
import { PursuitsComponent } from './player/pursuits/pursuits.component';
import { QuestsComponent } from './player/pursuits/quests/quests.component';
import { BountiesComponent } from './player/pursuits/bounties/bounties.component';
import { TriumphMotComponent } from './player/triumphs/triumph-mot/triumph-mot.component';

@Injectable()
export class AuthGuard implements CanActivate {
  public loader$ = new Subject<boolean>();

  constructor(private destinyCacheService: DestinyCacheService, private bungieService: BungieService) {
  }

  canActivate(): Observable<boolean> {
    return this.destinyCacheService.ready.asObservable().pipe(filter(x => x === true));
  }
}

@NgModule({
  imports: [RouterModule.forRoot(
    [{
      path: '',
      redirectTo: 'home',
      pathMatch: 'full'
    }
      , {
      path: 'home',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: HomeComponent
    },
    {
      path: 'auth',
      pathMatch: 'full',
      component: AuthComponent
    },

    {
      path: 'settings',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: SettingsComponent
    }, {
      path: 'about',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: AboutComponent
    }, {
      path: 'friends',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: FriendsComponent
    }, {
      path: 'gear',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: GearComponent
    }, {
      path: 'search',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: BungieSearchComponent
    }, {
      path: 'searchClans',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: ClanSearchComponent
    }, {
      path: 'search/:name',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: BungieSearchComponent
    }, {
      path: 'clan/:id',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: ClanComponent
    },
    {
      path: 'pgcr/:instanceId',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: PGCRComponent
    },
    {
      path: 'vendors/:characterId/:tab',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: ResourcesComponent
    },
    {
      path: 'vendors/:characterId',
      pathMatch: 'full',
      redirectTo: 'vendors/:characterId/Bounties'
    },
    {
      path: 'vendors',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: ResourcesComponent
    },
    {
      path: 'history/:platform/:memberId/:characterId',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: HistoryComponent
    },
    {
      path: 'recent-players/:platform/:memberId/:characterId',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: RecentPlayersComponent
    },
    {
      path: ':platform/:gt',
      pathMatch: 'prefix',
      canActivate: [AuthGuard],
      component: PlayerComponent,
      children: [
        {
          path: '',
          redirectTo: 'milestones',
          pathMatch: 'full'
        },
        {
          path: 'milestones',
          component: MilestonesComponent,
        },
        {
          path: 'pursuits',
          component: PursuitsComponent,
          children: [
            {
              path: '',
              redirectTo: 'bounties',
              pathMatch: 'full'
            },
            {
              path: 'bounties',
              component: BountiesComponent,
            },
            {
              path: 'quests',
              component: QuestsComponent,
            }
          ]
        },
        {
          path: 'checklist',
          component: ChecklistComponent,
        },
        {
          path: 'progress',
          component: ProgressComponent,
        },
        {
          path: 'triumphs',
          component: TriumphsComponent,
          children: [
            // {
            //   path: '',
            //   redirectTo: 'tree',
            //   pathMatch: 'full'
            // },
            {
              path: '',
              redirectTo: 'mot',
              pathMatch: 'full'
            },
            {
              path: 'mot',
              component: TriumphMotComponent,
            },
            {
              path: 'tree/:node',
              component: TriumphTreeComponent,
            },
            {
              path: 'tree',
              component: TriumphTreeComponent,
            },
            {
              path: 'seasons',
              component: TriumphSeasonsComponent,
            },
            {
              path: 'seals',
              component: TriumphSealsComponent,
            },
            {
              path: 'closest',
              component: TriumphClosestComponent,
            },
            {
              path: 'search',
              component: TriumphSearchComponent,
            },
            {
              path: 'tracked',
              component: TriumphTrackedComponent,
            }
          ]
        },
        {
          path: 'collections',
          component: CollectionsComponent,
          children: [
            {
              path: '',
              redirectTo: 'tree',
              pathMatch: 'full'
            },
            {
              path: 'tree/:node',
              component: CollectionTreeComponent,
            },
            {
              path: 'tree',
              component: CollectionTreeComponent,
            },
            {
              path: 'search',
              component: CollectionSearchComponent,
            },
            {
              path: 'badges',
              component: CollectionBadgesComponent,
            },
            {
              path: 'badges/:node',
              component: CollectionBadgeComponent,
            },
          ]
        },
        {
          path: 'chars',
          component: CharsComponent,
        },
      ]
    },
    {
      path: '**',
      redirectTo: 'home'
    }
    ], { useHash: false })],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
