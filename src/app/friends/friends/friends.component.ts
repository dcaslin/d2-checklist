import { Component, OnInit } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil } from 'rxjs/operators';
import { UserInfo } from '@app/service/model';

@Component({
  selector: 'anms-friends',
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent extends ChildComponent  implements OnInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  friends: UserInfo[] = [];

  constructor(storageService: StorageService) {
    super(storageService);
    this.favoriteFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
          (x: UserInfo[]) => {
            this.friends = x;

          });
  }

  ngOnInit() {}

}
