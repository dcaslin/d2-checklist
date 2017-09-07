import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';


import { AdsenseModule } from 'ng2-adsense';

import { BungieService } from './service/bungie.service';
import { StorageService } from './service/storage.service';
import { DestinyCacheService } from './service/destiny-cache.service';
import { NotificationService } from './service/notification.service';
import { ParseService } from './service/parse.service';


import { SharedModule } from '@app/shared';

import { HomeModule } from './home';
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
    AdsenseModule.forRoot({
      adClient: 'ca-pub-4577479845324857',
      adSlot: 7862857321 //7862857321 responsive right 6246523328 responsive banner
    }),
    SharedModule,

    AboutModule,
    SettingsModule,
    HomeModule,

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
  providers: [BungieService, StorageService, NotificationService, DestinyCacheService, ParseService],
  bootstrap: [AppComponent]
})
export class AppModule { }
