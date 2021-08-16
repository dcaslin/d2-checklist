import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BurnDialogComponent } from '@app/home/burn-dialog/burn-dialog.component';
import { HomeComponent } from '@app/home/home.component';
import { SharedModule } from '@app/shared';
import { environment } from '../environments/environment';
import { AboutModule } from './about';
import { AppRoutingModule } from './app-routing.module';
import {
  AppComponent,
  InfoSnackbarComponent,
  SelectPlatformDialogComponent,
  SuccessSnackbarComponent,
  WarnSnackbarComponent
} from './app.component';
import { AuthModule } from './auth';
import { BungieSearchModule } from './bungie-search';
import { ClanModule } from './clan';
import { ClanSearchModule } from './clan-search';
import { ClanStateService } from './clan/clan-state.service';
import { ContentVaultSearchComponent } from './content-vault-search/content-vault-search.component';
import { ContentVaultComponent } from './content-vault/content-vault.component';
import { FriendsModule } from './friends';
import { GamerTagSearchComponent } from './gamer-tag-search/gamer-tag-search.component';
import { GearModule } from './gear';
import { LoggedInGuard } from './guards/logged-in.guard';
import { HistoryModule } from './history';
import { BountySetsDialogComponent } from './home/bounty-sets-dialog/bounty-sets-dialog.component';
import { PartyComponent } from './party/party.component';
import { PGCRModule } from './pgcr';
import { PlayerModule } from './player';
import { PlayerStateService } from './player/player-state.service';
import { PrivacyComponent } from './privacy/privacy.component';
import { RecentPlayersModule } from './recent-players';
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
import { BountyShoppingListContainerComponent } from './shopping-list/bounty-shopping-list-container/bounty-shopping-list-container.component';
import { BountyShoppingListComponent } from './shopping-list/bounty-shopping-list/bounty-shopping-list.component';
import { TestbedComponent } from './testbed/testbed.component';
import { VendorsContainerComponent } from './vendors/vendors-container/vendors-container.component';
import { VendorsComponent } from './vendors/vendors/vendors.component';
import { DealsContainerComponent } from './deals/deals-container/deals-container.component';
import { DealsComponent } from './deals/deals/deals.component';
import { CollectionDealsComponent } from './deals/collection-deals/collection-deals.component';
import { ExchangeDealsComponent } from './deals/exchange-deals/exchange-deals.component';
import { ArmorDealsComponent } from './deals/armor-deals/armor-deals.component';
import { ArmorCompareDialogComponent } from './deals/armor-compare-dialog/armor-compare-dialog.component';
import { PlayerCurrenciesComponent } from './player-currencies/player-currencies.component';
import { RobotHomeComponent } from './home/robot-home/robot-home.component';
import { AppStatusComponent } from './app-status/app-status.component';
import { UberPursuitCheckComponent } from './uber-list/uber-pursuit-check/uber-pursuit-check.component';
import { PwaService } from './service/pwa.service';
import { WeaponDealsComponent } from './deals/weapon-deals/weapon-deals.component';
import { WeaponCompareDialogComponent } from './deals/weapon-compare-dialog/weapon-compare-dialog.component';
import { PerkbenchComponent } from './perkbench/perkbench.component';
import { PerkBenchDialogComponent } from './perkbench/perk-bench-dialog/perk-bench-dialog.component';
import { UberListToggleComponent } from './uber-list/uber-list-toggle/uber-list-toggle.component';
import { UberListParentComponent } from './uber-list/uber-list-parent/uber-list-parent.component';
import { UberListBuilderComponent } from './uber-list/uber-list-builder/uber-list-builder.component';
import { UberListViewComponent } from './uber-list/uber-list-view/uber-list-view.component';
import { UberRowDialogComponent } from './uber-list/uber-row-dialog/uber-row-dialog.component';




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
    PlayerModule,
    HistoryModule,
    RecentPlayersModule,
    BungieSearchModule,
    ClanSearchModule,
    ClanModule,
    PGCRModule,
    AuthModule,

    // app
    AppRoutingModule,

    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  declarations: [
    AppComponent,
    ChildComponent,
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent,
    SelectPlatformDialogComponent, GamerTagSearchComponent, PartyComponent, ContentVaultComponent,
    ContentVaultSearchComponent, PrivacyComponent, TestbedComponent, VendorsComponent, VendorsContainerComponent,
    BountyShoppingListComponent, BountyShoppingListContainerComponent, BountySetsDialogComponent, HomeComponent, BurnDialogComponent,
    DealsContainerComponent, DealsComponent, CollectionDealsComponent, ExchangeDealsComponent, ArmorDealsComponent, 
    ArmorCompareDialogComponent, PlayerCurrenciesComponent, RobotHomeComponent, AppStatusComponent, UberPursuitCheckComponent, WeaponDealsComponent, WeaponCompareDialogComponent, PerkbenchComponent, PerkBenchDialogComponent, UberListToggleComponent, UberListParentComponent, UberListBuilderComponent, UberListViewComponent, UberRowDialogComponent
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
    PwaService,
    StorageService,
    WeekService,
    LoggedInGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
