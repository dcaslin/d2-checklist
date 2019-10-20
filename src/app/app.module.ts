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
    AppRoutingModule
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
    LowLineService, MarkService, WishlistService, BucketService, GearService,
    BungieService, AuthService, StorageService, NotificationService,
    DestinyCacheService, ParseService
    // ,
    // {
    //   provide: RouteReuseStrategy,
    //   useClass: StickyReuseStrategy
    // }
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
