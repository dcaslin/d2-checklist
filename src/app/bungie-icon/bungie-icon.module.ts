import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { BungieIconComponent } from './bungie-icon.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    BungieIconComponent,
  ],
  exports: [
    BungieIconComponent
  ]
})
export class BungieIconModule { }
