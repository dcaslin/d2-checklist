
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, AfterContentInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
// import { XyzService } from "../../service/xyz.service";
import { Player, Character, SearchResult, Platform, Const } from "../../service/model";
import { StorageService } from '../../service/storage.service';
import { NotificationService } from '../../service/notification.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'anms-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent extends ChildComponent implements OnInit, OnDestroy  {
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

  constructor(public bungieService: BungieService, 
    // private xyzService: XyzService,
    storageService: StorageService,
    private notificationService: NotificationService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.selectedPlatform = this.platforms[0];
    this.hiddenMilestones = this.loadHiddenMilestones();
  }


  public historyPlayer(p: Player) {
    p.profile.userInfo.membershipType,p.profile.userInfo.membershipId
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

  public getCharacterById(p:Player, id: string){
    if (p.characters==null) return null;
    for (let c of p.characters){
      if (c.characterId === id){
        return c;
      }
    }
    return null;
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
    return "https://trials.report/report/"+platformstr+"/"+encodeURI(this.gamerTag);
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
    const tabName: string = this.getTabLabel(event.index);

    if (this.debugmode){
      console.log("Change tab: "+tabName);
    }
    this.selectedTab = tabName;
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, tabName]);
  }

  private getTabLabel(index: number): string {
    if (index === 0){ 
      return "milestones";
    }
    else if (index === 1){ 
      return "bounties";
    }
    else if (index === 2){ 
      return "checklist";
    }
    else if (index === 3){ 
      return "triumphs";
    }
    else if (index === 4){ 
      return "progress";
    }    
    else if (index === 5){ 
      return "chars";
    }
    
  }

  private setTab(): void {
    if (this.tabs==null){
      console.log("--- this.tabs is null");
       return;
    }
    const tab: string = this.selectedTab;
    if (tab!=null){
      if (tab == "milestones"){
        this.tabs.selectedIndex = 0;
      }
      else if (tab == "bounties"){
        this.tabs.selectedIndex = 1;
      }
      else if (tab == "nodes" || tab == "checklist"){
        this.tabs.selectedIndex = 2;
      }
      else if (tab == "triumphs"){
        this.tabs.selectedIndex = 3;
      }
      else if (tab == "progress"){
        this.tabs.selectedIndex = 4;
      }
      else if (tab == "chars"){
        this.tabs.selectedIndex = 5;
      }
    }
    else{
      console.log("---tab is null!");
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

  public async performSearch(): Promise<void> {
    if (this.gamerTag == null || this.gamerTag.trim().length == 0) {
      return;
    }
    //this.player = null;
    this.loading = true;
    const p = await this.bungieService.searchPlayer(this.selectedPlatform.type, this.gamerTag);
    
    try{ 
      if (p != null) {
        const x = await this.bungieService.getChars(p.membershipType, p.membershipId, 
          ['Profiles','Characters','CharacterProgressions','CharacterActivities',
          'CharacterEquipment','ProfileInventories','CharacterInventories',          
          'ProfileProgression','ItemObjectives','PresentationNodes','Records'
          //'ItemInstances','ItemPerks','ItemStats','ItemSockets','ItemPlugStates',
          //'ItemTalentGrids','ItemCommonData'
        ]);
        this.player = x;

        // need to get out of this change detection cycle to have tabs set
        setTimeout(()=>{
          this.setTab();
        },0)
        
        this.loading = false;

        if (x.characters!=null){
          await this.bungieService.updateAggHistory(x.characters);
          await this.bungieService.updateRaidHistory(x.milestoneList, x.characters);
          // this.player.mots = await this.bungieService.getMots(p.membershipType, p.membershipId);
          // await this.bungieService.updateNfHistory(x.milestoneList, x.characters);
          // await this.xyzService.updateDrops(x);
        }
      }
      else {
        this.loading = false;
        this.player = null;
      }
    }
    catch (x){
      this.loading = false;

    }
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
