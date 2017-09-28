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
    this.selectedPlatform = this.platforms[0];
  }

  
  public historyPlayer(p: Player) {
    let c: Character = p.characters[0];
    this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
  }

  public getTrialsLink(p: Player){
    let platformstr: string;
    if (p.profile.userInfo.membershipType==1){
      platformstr = "xbox";
    }
    else if (p.profile.userInfo.membershipType==2){
      platformstr = "ps";
    }
    else if (p.profile.userInfo.membershipType==2){
      platformstr = "bnet";
    }
    return "https://trials.report/report/"+platformstr+"/"+encodeURI(p.profile.userInfo.displayName);
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
    if (this.gamerTag == null || this.gamerTag.trim().length == 0) {
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

            //hack for raid
            if (x.characters!=null){
              this.bungieService.updateRaidHistory(x.milestoneList, x.characters).then(x=>{
                //nothing needed

              });
            }


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
      const tab: string = params['tab'];

      //nothing changed
      if (this.currentGt == newGt && this.currentPlatform == newPlatform) {
        return;
      }

      let oNewPlatform: Platform = null;
      let redirected: boolean = false;
      this.platforms.forEach((p: Platform) => {
        if ((p.type + "") == newPlatform) {
          oNewPlatform = p;
        }
        else if (p.name.toLowerCase() == newPlatform.toLowerCase()) {
          this.router.navigate([p.type, newGt, tab]);
          redirected = true;
        }
      });

      //we already redirected
      if (redirected) return;

      //invalid platform
      if (oNewPlatform==null){
        this.router.navigate(["home"]);
        return;
      }

      //we have a valid numeric platform, and a gamer tag, and a tab
      this.currentGt = newGt;
      this.currentPlatform = newPlatform;

      this.selectedPlatform = oNewPlatform;

      this.gamerTag = newGt;
      this.selectedTab = tab.trim().toLowerCase();

      this.performSearch();
    });

  }


  onPlatformChange() {
    this.storageService.setItem("defaultplatform", this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem("defaultgt", this.gamerTag);
  }


}
