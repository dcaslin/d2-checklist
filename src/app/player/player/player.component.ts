
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { XyzService } from "../../service/xyz.service";
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


  @ViewChild('maintabs') tabs: MatTabGroup;

  platforms: Platform[];
  selectedPlatform: Platform;
  hiddenMilestones: string[];
  msg: string;
  selectedTab: string;
  gamerTag: string;
  player: Player;
  hideCompleteChecklist = false;

  constructor(private bungieService: BungieService, 
    private xyzService: XyzService,
    storageService: StorageService,
    private notificationService: NotificationService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.selectedPlatform = this.platforms[0];
    this.hiddenMilestones = this.loadHiddenMilestones();
  }


  public historyPlayer(p: Player) {
    let c: Character = p.characters[0];
    this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
  }

  public getRaidLink(p: Player) {
    let platformstr: string;
    let memberid: string;
    if (p.profile.userInfo.membershipType==1){
      platformstr = "xb";
      memberid = p.profile.userInfo.displayName;
    }
    else if (p.profile.userInfo.membershipType==2){
      platformstr = "ps";
      memberid = p.profile.userInfo.displayName;
    }
    else if (p.profile.userInfo.membershipType==4){
      platformstr = "pc"
      memberid = p.profile.userInfo.membershipId;
    }
    return "http://raid.report/"+platformstr+"/"+memberid;
  }

  public getTrialsLink(p: Player){
    let platformstr: string;
    if (p.profile.userInfo.membershipType==1){
      platformstr = "xbox";
    }
    else if (p.profile.userInfo.membershipType==2){
      platformstr = "ps";
    }
    else if (p.profile.userInfo.membershipType==4){
      platformstr = "pc";
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


  public changeTab(event: MatTabChangeEvent) {
    const tabName: string = event.tab.textLabel.toLowerCase();
    if (this.debugmode){
      console.log("Change tab: "+tabName);
    }
    this.selectedTab = tabName;
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, tabName]);
  }

  public progress(){
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, "progress"]);
    this.setTab();
  }

  private setTab(): void {
    if (this.tabs==null) return;
    const tab: string = this.selectedTab;
    if (tab!=null){
      if (tab == "gear"){
        this.tabs.selectedIndex = 4;
      }
      else if (tab == "nodes" || tab == "checklist"){
        this.tabs.selectedIndex = 2;
      }
      else if (tab == "chars"){
        this.tabs.selectedIndex = 3;
      }
      else if (tab == "milestones"){
        this.tabs.selectedIndex = 0;
      }
      else if (tab == "progress"){
        this.tabs.selectedIndex = 1;
      }
    }
  }

  private loadHiddenMilestones(): string[] {
    try{
      let sMs: string = localStorage.getItem("hiddenMilestones");
      let ms:string[] = JSON.parse(sMs);
      if (ms!=null) return ms;
    }
    catch (e){
      localStorage.removeItem("hiddenMilestones");
      return [];
    }
    return [];
  }

  private saveHiddenMilestones(): void{
    let sMs = JSON.stringify(this.hiddenMilestones);
    localStorage.setItem("hiddenMilestones", sMs);
  }

  public hideMilestone(ms: string): void {
    this.hiddenMilestones.push(ms);
    this.saveHiddenMilestones();
  }

  public showAllMilestones(): void {
    this.hiddenMilestones = [];
    this.saveHiddenMilestones();
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
          
          
          this.bungieService.getChars(p.membershipType, p.membershipId, 
            ['Profiles','Characters','CharacterProgressions','CharacterActivities',
            'CharacterEquipment','ProfileInventories','CharacterInventories',
            'ItemInstances','ItemPerks','ItemStats','ItemSockets','ItemPlugStates',
            'ProfileProgression'
            //'ItemTalentGrids','ItemCommonData','ItemPlugStates','ItemObjectives'
          ])
            .then((x: Player) => {
            
            this.player = x;
            this.setTab();
            this.loading = false;

            //hack for raid
            if (x.characters!=null){
              this.bungieService.updateAggHistory(x.characters).then(x=>{
                //nothing needed
              });
              this.bungieService.updateRaidHistory(x.milestoneList, x.characters).then(x=>{
                //nothing needed
              });
              this.bungieService.updateNfHistory(x.milestoneList, x.characters).then(x=>{
                //nothing needed
              });
              this.xyzService.updateDrops(x).then(x=>{
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

    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
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
