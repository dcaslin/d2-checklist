import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { AboutComponent } from './about';
import { SettingsComponent } from './settings';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
  , {
    path: 'home',
    component: HomeComponent
  }, {
    path: 'settings',
    component: SettingsComponent
  }, {
    path: 'about',
    component: AboutComponent
  }
  ,{
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
