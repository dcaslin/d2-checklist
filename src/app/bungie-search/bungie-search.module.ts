import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { BungieSearchComponent } from './bungie-search/bungie-search.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [BungieSearchComponent]
})
export class BungieSearchModule { }
