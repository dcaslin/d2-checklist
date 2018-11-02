import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClanSearchComponent } from './clan-search/clan-search.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [ClanSearchComponent]
})
export class ClanSearchModule { }
