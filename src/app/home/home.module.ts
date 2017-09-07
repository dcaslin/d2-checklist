import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';


import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [HomeComponent]
})
export class HomeModule { }
