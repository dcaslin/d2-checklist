import { NgModule } from '@angular/core';

import { SharedModule } from '../shared';

import { SettingsComponent } from './settings/settings.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [SettingsComponent]
})
export class SettingsModule { }
