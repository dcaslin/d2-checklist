import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';

import { AuthComponent } from './auth/auth.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [AuthComponent]
})
export class AuthModule { }
