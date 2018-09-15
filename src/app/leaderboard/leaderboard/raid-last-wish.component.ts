
import {fromEvent as observableFromEvent,  Subject ,  Observable } from 'rxjs';

import {debounceTime, takeUntil, distinctUntilChanged} from 'rxjs/operators';
import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-raid-last-wish',
  templateUrl: './raid-last-wish.component.html',
  styleUrls: ['./raid-last-wish.component.scss']
})
export class RaidLastWishComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  constructor(storageService: StorageService, private httpClient: HttpClient, private router: Router, private route: ActivatedRoute) {
    super(storageService);

  }

  private sub: any;
  ngOnInit() {
    
  }

}
