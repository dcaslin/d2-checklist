import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router} from '@angular/router';
import { MdTabChangeEvent, MdTabGroup } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { SearchResult, BungieService, Platform } from "../../service/bungie.service";
import { Player, Character } from "../../service/parse.service";
import { StorageService } from '../../service/storage.service';
import {ChildComponent} from '../../shared/child.component';

@Component({
  selector: 'anms-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent  extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  
  @ViewChild(MdTabGroup) tabs: MdTabGroup;

  platforms: Platform[];
  selectedPlatform: Platform;
  selectedTab: string;
  gamerTag: string;
  dontSearch: boolean;

  player: Player;

  navigation = [
    { link: 'checklist', label: 'Checklist' },
    { link: 'progress', label: 'Progress' }
  ];

  constructor(private bungieService: BungieService, storageService: StorageService, private router: Router) {
    super(storageService);
    this.platforms = bungieService.getPlatforms();
    this.selectedPlatform = this.platforms[0];


    this.storageService.settingFeed
      .takeUntil(this.unsubscribe$)
      .subscribe(
      x => {
        if (x.defaultplatform != null) {
          this.setPlatform(x.defaultplatform);
        }
        if (x.defaultgt != null) {
          this.gamerTag = x.defaultgt;
        }
      });
    this.storageService.refresh();

  }

  private setPlatform(type: number) {
    //already set
    if (this.selectedPlatform != null && this.selectedPlatform.type === type) return;

    this.platforms.forEach((p: Platform) => {
      if (p.type === type) {
        this.selectedPlatform = p;
      }
    });
  }

  public routeSearch(): void{
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }
    
    this.router.navigate([this.selectedPlatform.type, this.gamerTag]);
  }

  onPlatformChange() {
    this.storageService.setItem("defaultplatform", this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem("defaultgt", this.gamerTag);
  }

  ngOnInit() {

   
  }

}
