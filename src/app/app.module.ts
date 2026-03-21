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

import { FriendsModule } from './friends';
import { GamerTagSearchComponent } from './gamer-tag-search/gamer-tag-search.component';
import { GearModule } from './gear';
import { LoggedInGuard } from './guards/logged-in.guard';
import { HistoryModule } from './history';
import { PartyComponent } from './party/party.component';
import { PGCRModule } from './pgcr';
import { PlayerModule } from './player';

import { PrivacyComponent } from './privacy/privacy.component';
import { RecentPlayersModule } from './recent-players';

import { SettingsModule } from './settings';
import { ChildComponent } from './shared/child.component';
import { TestbedComponent } from './testbed/testbed.component';
import { VendorsContainerComponent } from './vendors/vendors-container/vendors-container.component';
import { VendorsComponent } from './vendors/vendors/vendors.component';
import { DealsContainerComponent } from './deals/deals-container/deals-container.component';
import { DealsComponent } from './deals/deals/deals.component';
import { CollectionDealsComponent } from './deals/collection-deals/collection-deals.component';
import { ArmorDealsComponent } from './deals/armor-deals/armor-deals.component';
import { ArmorCompareDialogComponent } from './deals/armor-compare-dialog/armor-compare-dialog.component';
import { WeaponDealsComponent } from './deals/weapon-deals/weapon-deals.component';
import { WeaponCompareDialogComponent } from './deals/weapon-compare-dialog/weapon-compare-dialog.component';
import { PlayerCurrenciesComponent } from './player-currencies/player-currencies.component';
import { RobotHomeComponent } from './home/robot-home/robot-home.component';
import { AppStatusComponent } from './app-status/app-status.component';
import { UberPursuitCheckComponent } from './uber-list/uber-pursuit-check/uber-pursuit-check.component';

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
    SelectPlatformDialogComponent, GamerTagSearchComponent, PartyComponent, PrivacyComponent, TestbedComponent, VendorsComponent, VendorsContainerComponent,
    HomeComponent, BurnDialogComponent,
    DealsContainerComponent, DealsComponent, CollectionDealsComponent, ArmorDealsComponent,
    ArmorCompareDialogComponent, WeaponDealsComponent, WeaponCompareDialogComponent,
    PlayerCurrenciesComponent, RobotHomeComponent, AppStatusComponent, UberPursuitCheckComponent, PerkbenchComponent, PerkBenchDialogComponent, UberListToggleComponent, UberListParentComponent, UberListBuilderComponent, UberListViewComponent, UberRowDialogComponent
  ],
  providers: [
    LoggedInGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
