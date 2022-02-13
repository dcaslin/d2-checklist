import { Injectable, NgModule } from '@angular/core';
import { CanActivate, Router, RouterModule } from '@angular/router';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AboutComponent } from './about';
import { AuthComponent } from './auth';
import { BungieSearchComponent } from './bungie-search';
import { ClanComponent } from './clan';
import { ClanSearchComponent } from './clan-search';
import { ClanBadgesComponent } from './clan/clan-collections/clan-badges/clan-badges.component';
import {
  ClanCollectionSearchComponent
} from './clan/clan-collections/clan-collection-search/clan-collection-search.component';
import { ClanCollectionsComponent } from './clan/clan-collections/clan-collections.component';
import { ClanInfoComponent } from './clan/clan-info/clan-info.component';
import { ClanLifetimeComponent } from './clan/clan-lifetime/clan-lifetime.component';
import { ClanMembersComponent } from './clan/clan-members/clan-members.component';
import { ClanMilestonesComponent } from './clan/clan-milestones/clan-milestones.component';
import { ClanSettingsComponent } from './clan/clan-settings/clan-settings.component';
import { ClanSealsComponent } from './clan/clan-triumphs/clan-seals/clan-seals.component';
import { ClanTriumphSearchComponent } from './clan/clan-triumphs/clan-triumph-search/clan-triumph-search.component';
import { ClanTriumphTrackedComponent } from './clan/clan-triumphs/clan-triumph-tracked/clan-triumph-tracked.component';
import { ClanTriumphsComponent } from './clan/clan-triumphs/clan-triumphs.component';
import { FriendsComponent } from './friends';
import { GamerTagSearchComponent } from './gamer-tag-search/gamer-tag-search.component';
import { GearComponent } from './gear';
import { HistoryComponent } from './history';
import { HomeComponent } from './home/home.component';
import { RobotHomeComponent } from './home/robot-home/robot-home.component';
import { PartyComponent } from './party/party.component';
import { PerkbenchComponent } from './perkbench/perkbench.component';
import { Pgcr2Component } from './pgcr/pgcr2/pgcr2.component';
import { PlayerComponent } from './player';
import { CharsComponent } from './player/chars/chars.component';
import { ChecklistComponent } from './player/checklist/checklist.component';
import { CollectionBadgeComponent } from './player/collections/collection-badge/collection-badge.component';
import { CollectionBadgesComponent } from './player/collections/collection-badges/collection-badges.component';
import { CollectionSearchComponent } from './player/collections/collection-search/collection-search.component';
import { CollectionTreeComponent } from './player/collections/collection-tree/collection-tree.component';
import { CollectionsComponent } from './player/collections/collections.component';
import { LifetimeComponent } from './player/lifetime/lifetime.component';
import { MilestonesComponent } from './player/milestones/milestones.component';
import { MoreComponent } from './player/more/more.component';
import { ProgressComponent } from './player/progress/progress.component';
import { PursuitListComponent } from './player/pursuits/pursuit-list/pursuit-list.component';
import { PursuitsComponent } from './player/pursuits/pursuits.component';
import { TriumphClosestComponent } from './player/triumphs/triumph-closest/triumph-closest.component';
import { TriumphSealsComponent } from './player/triumphs/triumph-seals/triumph-seals.component';
import { TriumphSearchComponent } from './player/triumphs/triumph-search/triumph-search.component';
import { TriumphSeasonsComponent } from './player/triumphs/triumph-seasons/triumph-seasons.component';
import { TriumphTrackedComponent } from './player/triumphs/triumph-tracked/triumph-tracked.component';
import { TriumphTreeComponent } from './player/triumphs/triumph-tree/triumph-tree.component';
import { TriumphsComponent } from './player/triumphs/triumphs.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { RecentPlayersComponent } from './recent-players';
import { DestinyCacheService } from './service/destiny-cache.service';
import { SignedOnUserService } from './service/signed-on-user.service';
import { SettingsComponent } from './settings';
import { SignInRequiredComponent } from './shared/sign-in-required/sign-in-required.component';
import { isSearchBot } from './shared/utilities';
import { TestbedComponent } from './testbed/testbed.component';
import { UberListBuilderComponent } from './uber-list/uber-list-builder/uber-list-builder.component';
import { UberListParentComponent } from './uber-list/uber-list-parent/uber-list-parent.component';
import { UberListViewComponent } from './uber-list/uber-list-view/uber-list-view.component';
import { VendorsContainerComponent } from './vendors/vendors-container/vendors-container.component';


const searchBot = isSearchBot();

@Injectable()
export class ManifestLoadedGuard implements CanActivate {
  public loader$ = new Subject<boolean>();

  constructor(private destinyCacheService: DestinyCacheService) {
  }

  canActivate(): Observable<boolean> {
    return this.destinyCacheService.ready$.asObservable().pipe(filter(x => x === true));
  }
}

@Injectable()
export class MyInfoGuard implements CanActivate {
  public loader$ = new Subject<boolean>();

  constructor(private router: Router, private signedOnUserService: SignedOnUserService) {
  }

  canActivate(): Observable<boolean> {
    return combineLatest([this.signedOnUserService.authorizing$, this.signedOnUserService.playerLoading$,
      this.signedOnUserService.signedOnUser$]).pipe(
      filter(([auth, loading, user]) => !auth && !loading),
      map(([auth, loading, user]) => {
        if (!user) {
          return true;
        } else {
          this.router.navigate([user.userInfo.membershipType, user.userInfo.membershipId]);
          return false;
        }
      })
      );
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
      canActivate: searchBot ? null : [ManifestLoadedGuard],
      component: searchBot ? RobotHomeComponent : HomeComponent
    },
    {
      path: 'auth',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: AuthComponent
    },
    {
      path: 'my-info',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard, MyInfoGuard],
      component: SignInRequiredComponent
    },
    {
      path: 'test',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: TestbedComponent
    },
    {
      path: 'settings',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: SettingsComponent
    },
    {
      path: 'perkbench',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: PerkbenchComponent
    },
    {
      path: 'about',
      pathMatch: 'full',
      component: AboutComponent
    }, {
      path: 'privacy',
      pathMatch: 'full',
      component: PrivacyComponent
    }, {
      path: 'friends',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: FriendsComponent
    },
    {
      path: 'gear',
      redirectTo: 'gear/weapons',
      pathMatch: 'full'
    },
    {
      path: 'gear/:tab',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: GearComponent
    },
    {
      path: 'search',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: BungieSearchComponent
    }, {
      path: 'searchClans',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: ClanSearchComponent
    }, {
      path: 'search/:name',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: BungieSearchComponent
    }, {
      path: 'todo',
      pathMatch: 'prefix',
      canActivate: [ManifestLoadedGuard],
      component: UberListParentComponent,
      children: [
        {
          path: '',
          redirectTo: 'builder',
          pathMatch: 'full'
        },
        {
          path: 'builder',
          component: UberListBuilderComponent,
        },
        {
          path: 'list',
          component: UberListViewComponent,
        }
      ]
    }, {
      path: 'clan/:id',
      pathMatch: 'prefix',
      canActivate: [ManifestLoadedGuard],
      component: ClanComponent,
      children: [
        {
          path: '',
          redirectTo: 'members',
          pathMatch: 'full'
        },
        {
          path: 'members',
          component: ClanMembersComponent,
        },
        {
          path: 'info',
          component: ClanInfoComponent,
        },
        {
          path: 'milestones',
          component: ClanMilestonesComponent,
        },

        {
          path: 'lifetime',
          component: ClanLifetimeComponent,
        },
        {
          path: 'settings',
          component: ClanSettingsComponent,
        },
        {
          path: 'triumphs',
          pathMatch: 'prefix',
          component: ClanTriumphsComponent,
          children: [
            {
              path: '',
              redirectTo: 'seals',
              pathMatch: 'full'
            },
            {
              path: 'seals',
              component: ClanSealsComponent
            }, {
              path: 'search',
              component: ClanTriumphSearchComponent
            }, {
              path: 'tracked',
              component: ClanTriumphTrackedComponent
            }
          ]
        },
        {
          path: 'collections',
          pathMatch: 'prefix',
          component: ClanCollectionsComponent,
          children: [
            {
              path: '',
              redirectTo: 'badges',
              pathMatch: 'full'
            },
            {
              path: 'badges',
              component: ClanBadgesComponent
            }, {
              path: 'search',
              component: ClanCollectionSearchComponent
            }
          ]
        }
      ]
    },
    {
      path: 'pgcr/:instanceId',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: Pgcr2Component
    },
    {
      path: 'pgcr2/:instanceId',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: Pgcr2Component
    },
    {
      path: 'vendors/:characterId/:tab',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: VendorsContainerComponent
    },
    {
      path: 'vendors/:characterId',
      pathMatch: 'full',
      redirectTo: 'vendors/:characterId/Bounties'
    },
    {
      path: 'vendors',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: VendorsContainerComponent
    },
    {
      path: 'history/:platform/:memberId/:characterId',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: HistoryComponent
    },
    {
      path: 'recent-players/:platform/:memberId/:characterId',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: RecentPlayersComponent
    },
    {
      path: 'party/:platform/:memberId',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: PartyComponent
    },
    {
      path: 'gt/:platform/:gamertag',
      pathMatch: 'full',
      canActivate: [ManifestLoadedGuard],
      component: GamerTagSearchComponent
    },
    {
      path: ':platform/:memberId',
      pathMatch: 'prefix',
      canActivate: [ManifestLoadedGuard],
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
              component: PursuitListComponent,
            },
            {
              path: 'quests',
              component: PursuitListComponent,
            },
            {
              path: 'gear',
              component: PursuitListComponent,
            },
            {
              path: 'seasons',
              component: TriumphSeasonsComponent,
            },
            {
              path: 'tracked',
              component: PursuitListComponent,
            }
          ]
        },
        {
          path: 'checklist',
          component: ChecklistComponent,
        },
        {
          path: 'triumphs',
          component: TriumphsComponent,
          children: [
            {
              path: '',
              redirectTo: 'seasons',
              pathMatch: 'full'
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
          path: 'lifetime',
          component: LifetimeComponent
        },
        {
          path: 'more',
          component: MoreComponent,
          children: [
            {
              path: '',
              redirectTo: 'progress',
              pathMatch: 'full'
            },
            {
              path: 'chars',
              component: CharsComponent,
            },
            {
              path: 'progress',
              component: ProgressComponent,
            }
          ]
        }
      ]
    },
    {
      path: '**',
      redirectTo: 'home'
    }
    ], { useHash: false, relativeLinkResolution: 'legacy' })],
  exports: [RouterModule],
  providers: [ManifestLoadedGuard, MyInfoGuard]
})
export class AppRoutingModule { }
