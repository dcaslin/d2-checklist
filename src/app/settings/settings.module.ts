import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../shared';

import { SettingsComponent } from './settings/settings.component';
import { StorageService } from '../service/storage.service';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [SettingsComponent]
})
export class SettingsModule { }
