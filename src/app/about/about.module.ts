import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';


import { AboutComponent } from './about/about.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [AboutComponent]
})
export class AboutModule { }
