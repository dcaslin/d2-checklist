import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';
import {RouterModule, RouteReuseStrategy} from '@angular/router';
import {StickyReuseStrategy} from './sticky-reuse-strategy';


import { BungieService } from './service/bungie.service';
import { StorageService } from './service/storage.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { NotificationService } from './service/notification.service';
import { ParseService } from './service/parse.service';


import { SharedModule } from '@app/shared';

import { HomeModule } from './home';
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
    HistoryModule,
    PGCRModule,

    // app
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent
  ],
  entryComponents: [
    SuccessSnackbarComponent, InfoSnackbarComponent, WarnSnackbarComponent
  ],
  providers: [BungieService, StorageService, NotificationService, DestinyCacheService, ParseService,
    {provide: RouteReuseStrategy, useClass: StickyReuseStrategy}],
  bootstrap: [AppComponent]
})
export class AppModule { }
