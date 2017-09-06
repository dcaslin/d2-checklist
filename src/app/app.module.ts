import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AdsenseModule } from 'ng2-adsense';



import { SharedModule } from '@app/shared';
import { CoreModule } from '@app/core';

import { HomeModule } from './home';
import { SettingsModule } from './settings';
import { AboutModule } from './about';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  imports: [
    // angular
    BrowserAnimationsModule,
    BrowserModule,
    AdsenseModule.forRoot({
      adClient: 'ca-pub-4577479845324857',
      adSlot: 6246523328 //responsive right 7862857321 responsive banner
    }),
    // core & shared
    CoreModule,
    SharedModule,

    AboutModule,
    SettingsModule,
    HomeModule,

    // app
    AppRoutingModule
  ],
  declarations: [
    AppComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
