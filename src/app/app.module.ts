import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';
import {RouterModule, RouteReuseStrategy} from '@angular/router';
import {StickyReuseStrategy} from './sticky-reuse-strategy';


import { AuthService } from './service/auth.service';
import { BungieService } from './service/bungie.service';
import { XyzService } from './service/xyz.service';
import { StorageService } from './service/storage.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { NotificationService } from './service/notification.service';
import { ParseService } from './service/parse.service';


import { SharedModule } from '@app/shared';

import {ChildComponent} from './shared/child.component';
import { HomeModule } from './home';
import { BungieSearchModule } from './bungie-search';
import { ClanModule } from './clan';
import { ClanLeaderboardModule } from './clanleaderboard';
import { LeaderboardModule} from './leaderboard';
import { PlayerModule } from './player';
import { AuthModule } from './auth';
import { HistoryModule } from './history';
import { PGCRModule } from './pgcr';
import { SettingsModule } from './settings';
import { AboutModule } from './about';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent, SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent } from './app.component';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    HttpModule,

    SharedModule,

    AboutModule,
    SettingsModule,
    HomeModule,
    PlayerModule,
    HistoryModule,
    BungieSearchModule,
    ClanModule,
    ClanLeaderboardModule,
    LeaderboardModule,
    PGCRModule,
    AuthModule,

    // app
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    ChildComponent,
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent
  ],
  entryComponents: [
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent
  ],
  providers: [XyzService, BungieService, AuthService, StorageService, NotificationService, 
    DestinyCacheService, ParseService,
    {provide: RouteReuseStrategy, useClass: StickyReuseStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
