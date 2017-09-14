import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { PlayerComponent } from './player';
import { AuthComponent } from './auth';
import { HistoryComponent } from './history';
import { PGCRComponent } from './pgcr';
import { AboutComponent } from './about';
import { SettingsComponent } from './settings';
import { BungieSearchComponent } from './bungie-search';
import { ClanComponent } from './clan';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
  , {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'auth',
    component: AuthComponent
  },

  {
    path: 'settings',
    component: SettingsComponent
  }, {
    path: 'about',
    component: AboutComponent
  }, {
    path: 'search',
    component: BungieSearchComponent
  }
  , {
    path: 'search/:name',
    component: BungieSearchComponent
  }
  , {
    path: 'clan/:id',
    component: ClanComponent
  },
  {
    path: 'pgcr/:instanceId',
    component: PGCRComponent
  },
  {
    path: ':platform/:gt',
    redirectTo: ':platform/:gt/checklist'
  },
  {
    path: ':platform/:gt/:tab',
    component: PlayerComponent
  },
  {
    path: 'history/:platform/:memberId/:characterId',
    component: HistoryComponent
  }
  , {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: false })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
