
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { Const, Platform, PublicMilestone, NameDesc } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { BungieService } from '../../service/bungie.service';
import { Nightfall } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'anms-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;


  @ViewChild(MatTabGroup) tabs: MatTabGroup;

  platforms: Platform[];
  selectedPlatform: Platform;
  selectedTab: string;
  gamerTag: string;
  dontSearch: boolean;
  publicMilestones: PublicMilestone[];
  burns: NameDesc[] = [];
  missions: string[] = [];
  flashpoint: string = "";
  showMoreInfo = false;

  constructor(storageService: StorageService, private bungieService: BungieService, private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.selectedPlatform = this.platforms[0];


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

  ngOnInit() {
    this.bungieService.getPublicMilestones().then(ms => {
      this.publicMilestones = ms;
      if (ms!=null){
        for (let m of ms){
          //daily heroic
          if ("3082135827" === m.hash){
            const missions = [];
            for (let a of m.aggActivities){
              let name = a.activity.name+" "+a.activity.ll; 
              name = name.replace("Daily Heroic Story Mission: ", "");
              missions.push(name);
            }
            this.missions = missions;
          }
          else if ("3172444947" === m.hash){
            this.burns = m.aggActivities[0].activity.modifiers;
          }
          else if ("463010297" === m.hash){
            let name = m.summary;
            name = name.replace("FLASHPOINT: ","");
            this.flashpoint = name;
          }

        }
      }
    });


  }

}
