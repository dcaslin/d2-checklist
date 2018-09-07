
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  constructor(storageService: StorageService, private bungieService: BungieService, 
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }
  
  private load() {
    this.loading = true;
    this.bungieService.getVendorData().then((res) => {
      
      this.loading = false;
    }).catch((x) => {
      this.loading = false;
    });
  }

  private sub: any;
  ngOnInit() {
    this.load();
    
  }
}
