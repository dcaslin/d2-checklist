import { Component, OnInit } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';

@Component({
  selector: 'anms-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent extends ChildComponent  implements OnInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  constructor(storageService: StorageService) {
    super(storageService);
  }

  ngOnInit() {}

}
