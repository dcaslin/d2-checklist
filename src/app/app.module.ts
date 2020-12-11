import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SharedModule } from '@app/shared';

import { environment } from '../environments/environment';
import { AboutModule } from './about';
import { AppRoutingModule } from './app-routing.module';
import {
  AppComponent,
  InfoSnackbarComponent,
  SelectPlatformDialogComponent,
  SuccessSnackbarComponent,
  WarnSnackbarComponent,
} from './app.component';
import { AuthModule } from './auth';
import { BungieSearchModule } from './bungie-search';
import { ClanModule } from './clan';
import { ClanSearchModule } from './clan-search';
import { ClanStateService } from './clan/clan-state.service';
import { FriendsModule } from './friends';
import { GamerTagSearchComponent } from './gamer-tag-search/gamer-tag-search.component';
import { GearModule } from './gear';
import { LoggedInGuard } from './guards/logged-in.guard';
import { HistoryModule } from './history';
import { HomeModule } from './home';
import { PartyComponent } from './party/party.component';
import { PGCRModule } from './pgcr';
import { PlayerModule } from './player';
import { PlayerStateService } from './player/player-state.service';
import { RecentPlayersModule } from './recent-players';
import { ResourcesModule } from './resources';
import { AuthService } from './service/auth.service';
import { BucketService } from './service/bucket.service';
import { BungieService } from './service/bungie.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { GearService } from './service/gear.service';
import { IconService } from './service/icon.service';
import { LowLineService } from './service/lowline.service';
import { MarkService } from './service/mark.service';
import { NotificationService } from './service/notification.service';
import { PandaGodrollsService } from './service/panda-godrolls.service';
import { ParseService } from './service/parse.service';
import { PreferredStatService } from './service/preferred-stat.service';
import { StorageService } from './service/storage.service';
import { WeekService } from './service/week.service';
import { SettingsModule } from './settings';
import { ChildComponent } from './shared/child.component';
import { ContentVaultComponent } from './content-vault/content-vault.component';
import { ContentVaultSearchComponent } from './content-vault-search/content-vault-search.component';
import { PrivacyComponent } from './privacy/privacy.component';







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
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent, SelectPlatformDialogComponent, GamerTagSearchComponent, PartyComponent, ContentVaultComponent, ContentVaultSearchComponent, PrivacyComponent
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
    PandaGodrollsService,
    PlayerStateService,
    PreferredStatService,
    StorageService,
    WeekService,
    LoggedInGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
