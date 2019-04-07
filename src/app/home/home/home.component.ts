
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabGroup } from '@angular/material';
import { environment as env } from '@env/environment';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { Const, Platform, PublicMilestone, NameDesc } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { BungieService } from '../../service/bungie.service';
import { ChildComponent } from '../../shared/child.component';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { WeekService, Today } from '@app/service/week.service';

@Component({
  selector: 'anms-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;


  @ViewChild(MatTabGroup) tabs: MatTabGroup;

  version = env.versions.app;
  manifestVersion = "";
  platforms: Platform[];
  selectedPlatform: Platform;
  selectedTab: string;
  gamerTag: string;
  dontSearch: boolean;
  showMoreInfo = false;
  today: Today = null;

  
  constructor(
    private destinyCacheService: DestinyCacheService, 
    storageService: StorageService, 
    private bungieService: BungieService, 
    private weekService: WeekService,
    private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.selectedPlatform = this.platforms[0];
    if (this.destinyCacheService.cache!=null){
      this.manifestVersion = this.destinyCacheService.cache.version;
    }

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.defaultplatform != null) {
            this.setPlatform(x.defaultplatform);
          }
          if (x.defaultgt != null) {
            this.gamerTag = x.defaultgt;
          }
        });

  }

  private setPlatform(type: number) {
    // already set
    if (this.selectedPlatform != null && this.selectedPlatform.type === type) { return; }
    this.selectedPlatform = Const.PLATFORMS_DICT['' + type];
  }

  public routeSearch(): void {
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }

    this.router.navigate([this.selectedPlatform.type, this.gamerTag]);
  }

  onPlatformChange() {
    this.storageService.setItem('defaultplatform', this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem('defaultgt', this.gamerTag);
  }


  async loadMileStones() {
    try{
      this.today = await this.weekService.getToday(); 
    }
    finally{
      this.loading = false;
    }   
  }

  ngOnInit() {

    this.loading = true;
    this.loadMileStones();
  }

}
