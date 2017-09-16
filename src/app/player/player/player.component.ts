import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MdTabChangeEvent, MdTabGroup } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { Player, Character, SearchResult, Platform, Const } from "../../service/model";
import { StorageService } from '../../service/storage.service';
import { NotificationService } from '../../service/notification.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'anms-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;


  @ViewChild('maintabs') tabs: MdTabGroup;

  platforms: Platform[];
  selectedPlatform: Platform;
  msg: string;
  selectedTab: string;
  gamerTag: string;
  // dontSearch: boolean;

  player: Player;

  navigation = [
    { link: 'checklist', label: 'Checklist' },
    { link: 'progress', label: 'Progress' }
  ];

  constructor(private bungieService: BungieService, storageService: StorageService,
    private notificationService: NotificationService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
  }

  public history(c: Character) {
    this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
  }

  public routeSearch(): void {

    //if route hasn't changed it won't refresh, so we have to force it
    if (this.selectedPlatform.type == this.route.snapshot.params.platform &&
      this.gamerTag == this.route.snapshot.params.gt) {
      this.performSearch();
      return;
    }

    //otherwise just re-route

    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, this.selectedTab]);
  }


  public changeTab(event: MdTabChangeEvent) {
    const tabName: string = event.tab.textLabel.toLowerCase();
    this.selectedTab = tabName;
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, tabName]);
  }


  private setTab(): void {
    if (this.tabs==null) return;
    const tab: string = this.selectedTab;
    if (tab!=null){
      if (tab == "chars"){
        this.tabs.selectedIndex = 3;
      }
      else if (tab == "checklist"){
        this.tabs.selectedIndex = 0;
      }
      else if (tab == "progress"){
        this.tabs.selectedIndex = 1;
      }
    }
  }

  public performSearch(): void {
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }

    //this.player = null;
    this.loading = true;
    this.bungieService.searchPlayer(this.selectedPlatform.type, this.gamerTag)
      .then((p: SearchResult) => {
        if (p != null) {
          this.bungieService.getChars(p.membershipType, p.membershipId, ['Profiles','Characters','CharacterProgressions','CharacterActivities']).then((x: Player) => {
            this.player = x;
            this.setTab();
            this.loading = false;
          })
        }
        else {
          this.loading = false;
          this.player = null;
        }
      })
      .catch((x) => {
        this.loading = false;
      });
  }

  currentGt: string;
  currentPlatform: string;


  ngOnInit() {

    this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      const newPlatform: string = params['platform'];
      const newGt: string = params['gt'];

      let searchAgain: boolean = true;
      if (this.currentGt == newGt && this.currentPlatform == newPlatform) {
        searchAgain = false;
      }

      this.currentGt = newGt;
      this.currentPlatform = newPlatform;

      let redirPlat: number = null;

      this.platforms.forEach((p: Platform) => {
        if ((p.type + "") == newPlatform) {
          this.selectedPlatform = p;
        }
        else if (p.name.toLowerCase() == newPlatform.toLowerCase()) {
          redirPlat = p.type;
        }
      });

      //bad request, send them home
      if (this.selectedPlatform == null && redirPlat == null) {
        this.router.navigate(["home"]);
        return;
      }
      this.gamerTag = newGt;

      const tab: string = params['tab'];
      this.selectedTab = tab.trim().toLowerCase();

      if (redirPlat!=null){
        this.router.navigate([redirPlat, newGt, tab]);
      }

      if (searchAgain==true) {
        this.performSearch();
      }


    });

  }


  onPlatformChange() {
    this.storageService.setItem("defaultplatform", this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem("defaultgt", this.gamerTag);
  }


}
