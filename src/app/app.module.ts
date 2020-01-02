import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';


import { AuthService } from './service/auth.service';
import { BungieService } from './service/bungie.service';
import { LowLineService } from './service/lowline.service';
import { MarkService } from './service/mark.service';
import { WishlistService } from './service/wishlist.service';
import { BucketService } from './service/bucket.service';
import { GearService } from './service/gear.service';
import { StorageService } from './service/storage.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { NotificationService } from './service/notification.service';
import { ParseService } from './service/parse.service';


import { SharedModule } from '@app/shared';

import { ChildComponent } from './shared/child.component';
import { HomeModule } from './home';
import { BungieSearchModule } from './bungie-search';
import { ClanSearchModule } from './clan-search';
import { ClanModule } from './clan';
import { PlayerModule } from './player';
import { AuthModule } from './auth';
import { HistoryModule } from './history';
import { RecentPlayersModule } from './recent-players';
import { PGCRModule } from './pgcr';
import { ResourcesModule } from './resources';
import { SettingsModule } from './settings';
import { AboutModule } from './about';
import { FriendsModule } from './friends';
import { GearModule } from './gear';

import { AppRoutingModule } from './app-routing.module';
import {
  AppComponent, SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent,
  SelectPlatformDialogComponent
} from './app.component';
import { GamerTagSearchComponent } from './gamer-tag-search/gamer-tag-search.component';
import { PartyComponent } from './party/party.component';
import { IconService } from './service/icon.service';
import { TargetPerkService } from './service/target-perk.service';
import { ClanStateService } from './clan/clan-state.service';
import { PlayerStateService } from './player/player-state.service';
import { PreferredStatService } from './service/preferred-stat.service';
import { WeekService } from './service/week.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,

    SharedModule,

    AboutModule,
    FriendsModule,
    GearModule,
    SettingsModule,
    HomeModule,
    PlayerModule,
    HistoryModule,
    RecentPlayersModule,
    BungieSearchModule,
    ClanSearchModule,
    ClanModule,
    PGCRModule,
    ResourcesModule,
    AuthModule,

    // app
    AppRoutingModule,

    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  declarations: [
    AppComponent,
    ChildComponent,
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent, SelectPlatformDialogComponent, GamerTagSearchComponent, PartyComponent
  ],
  entryComponents: [
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent, SelectPlatformDialogComponent
  ],
  providers: [
    AuthService,
    BucketService,
    BungieService,
    ClanStateService,
    DestinyCacheService,
    GearService,
    IconService,
    LowLineService,
    MarkService,
    NotificationService,
    ParseService,
    PlayerStateService,
    PreferredStatService,
    StorageService,
    TargetPerkService,
    WeekService,
    WishlistService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
