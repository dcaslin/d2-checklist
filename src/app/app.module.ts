import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import {RouterModule, RouteReuseStrategy} from '@angular/router';
import {StickyReuseStrategy} from './sticky-reuse-strategy';


import { AuthService } from './service/auth.service';
import { BungieService } from './service/bungie.service';
import { LowLineService } from './service/lowline.service';
import { StorageService } from './service/storage.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { NotificationService } from './service/notification.service';
import { ParseService } from './service/parse.service';


import { SharedModule } from '@app/shared';

import {ChildComponent} from './shared/child.component';
import { HomeModule } from './home';
import { BungieSearchModule } from './bungie-search';
import { ClanSearchModule } from './clan-search';
import { ClanModule } from './clan';
import { LeaderboardModule} from './leaderboard';
import { PlayerModule } from './player';
import { AuthModule } from './auth';
import { HistoryModule } from './history';
import { RecentPlayersModule } from './recent-players';
import { PGCRModule } from './pgcr';
import { ResourcesModule } from './resources';
import { SettingsModule } from './settings';
import { AboutModule } from './about';

import { AppRoutingModule, AuthGuard } from './app-routing.module';
import { AppComponent, SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent,
  SelectPlatformDialogComponent } from './app.component';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,

    SharedModule,

    AboutModule,
    SettingsModule,
    HomeModule,
    PlayerModule,
    HistoryModule,
    RecentPlayersModule,
    BungieSearchModule,
    ClanSearchModule,
    ClanModule,
    LeaderboardModule,
    PGCRModule,
    ResourcesModule,
    AuthModule,

    // app
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    ChildComponent,
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent, SelectPlatformDialogComponent
  ],
  entryComponents: [
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent, SelectPlatformDialogComponent
  ],
  providers: [
    LowLineService,
    BungieService, AuthService, StorageService, NotificationService,
    DestinyCacheService, ParseService,
    {provide: RouteReuseStrategy, useClass: StickyReuseStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
