import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';


import { HomeComponent } from './home/home.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [HomeComponent]
})
export class HomeModule { }
