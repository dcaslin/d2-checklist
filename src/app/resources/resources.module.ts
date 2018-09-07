import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';


import { ResourcesComponent } from './resources/resources.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [ResourcesComponent]
})
export class ResourcesModule { }
