
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { BungieNetUserInfo, BungieMember, PGCR } from '@app/service/model';

@Component({
  selector: 'pgcr-history',
  templateUrl: './pgcr.component.html',
  styleUrls: ['./pgcr.component.scss']
})
export class PGCRComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  instanceId: string;
  data: PGCR;

  constructor(storageService: StorageService, private bungieService: BungieService, 
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }
  
  private async load() {
    this.loading = true;
    try{
      this.data = await this.bungieService.getPGCR(this.instanceId);
    }
    finally{
      this.loading = false;
    }
  }

  
  public async navigateBnetMember(target: BungieNetUserInfo){
    const match: BungieMember = await this.bungieService.getBungieMemberById(target.membershipId);
    if (match==null) return;
    this.router.navigate(['/',match.bnet.platform.type, match.bnet.name]);
    return;
  }
  

  private sub: any;
  ngOnInit() {
    this.sub = this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.instanceId = params['instanceId'];
      this.load();
    });
  }
}
