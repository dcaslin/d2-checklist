import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { ClanComponent } from './clan/clan.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [ClanComponent]
})
export class ClanModule { }
