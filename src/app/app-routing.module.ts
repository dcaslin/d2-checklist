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
      path: 'leaderboard/last-wish',
      pathMatch: 'full',
      redirectTo: 'leaderboard/last-wish/1'
    },

    {
      path: 'leaderboard',
      pathMatch: 'full',
      redirectTo: 'leaderboard/last-wish/1'
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
      path: ':platform/:gt/:tab',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: PlayerComponent
    },
    {
      path: ':platform/:gt/:tab',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      component: PlayerComponent
    },
    {
      path: ':platform/:gt',
      pathMatch: 'full',
      canActivate: [AuthGuard],
      redirectTo: ':platform/:gt/milestones'
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
