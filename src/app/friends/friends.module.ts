import { NgModule } from '@angular/core';
import { SharedModule } from '../shared';
import { FriendsComponent } from './friends/friends.component';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [FriendsComponent]
})
export class FriendsModule  { }
