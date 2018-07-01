
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { MatPaginator, MatSort } from '@angular/material';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { BungieMember, BungieMembership, BungieMemberPlatform, SearchResult, Player, BungieGroupMember, ClanInfo, MileStoneName } from "../../service/model";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import * as moment from 'moment';

@Component({
  selector: 'clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss']
})
export class ClanComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  id: string;
  info: ClanInfo;
  members: BungieGroupMember[] = [];
  sortedMembers: BungieGroupMember[] = [];
  modelPlayer: Player;
  sort: string = "memberAsc";
  playerCntr: 0;
  allLoaded: boolean;

  filterMode: string = "none";
  filterActivity: MileStoneName = null;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  public toggleMemberSort() {
    if (this.sort == "memberAsc") {
      this.sort = "memberDesc";
    }
    else {
      this.sort = "memberAsc";
    }
    this.sortData();
  }

  public toggleDateSort() {
    if (this.sort == "dateAsc") {
      this.sort = "dateDesc";
    }
    else {
      this.sort = "dateAsc";
    }
    this.sortData();
  }

  private static compareDate(a: BungieGroupMember, b: BungieGroupMember): number{
    let aD: number = 0;
    let bD: number = 0;
    if (a.player!=null) aD = Date.parse(a.player.profile.dateLastPlayed);
    if (b.player!=null) bD = Date.parse(b.player.profile.dateLastPlayed);
   
    if (aD < bD) return 1;
    if (aD > bD) return -1;
    return 0;
  }

  private static compareDateReverse(a, b): number{
    return ClanComponent.compareDate(a,b)*-1;
  }
  private static compareName(a: BungieGroupMember, b: BungieGroupMember): number{  
      let bs: string = b.destinyUserInfo.displayName;
      let as: string = a.destinyUserInfo.displayName;
      if (bs < as) return 1;
      if (bs > as) return -1;
      return 0;
  }
  
  private static compareNameReverse(a, b): number{
    return ClanComponent.compareName(a,b)*-1;
  }

  private filterPlayers(){
    if (this.filterMode=="none"){
      this.filterActivity = null;
    }
    this.sortData();

  }

  private sortData(): void{
    //restore list
    let temp = this.members.slice(0);
    //filter list if necessary

    this.sortedMembers = temp.filter(member=>{
      if (this.filterActivity==null) return true;
      if (member.player==null) return false;
      if (member.player.characters==null) return false;
      if (member.player.characters.length==0) return false;
      if (member.player.characters[0].milestones==null) return false;
      let comp:number =0;
      let total: number = 0;
      member.player.characters.forEach(char=>{
        total++;
        if (char.milestones[this.filterActivity.key].complete) comp++;
      });
      if (this.filterMode=="zero" && comp==0) return true;
      if (this.filterMode=="all" && comp==total) return true;
      return false;
    });

    if (this.sort=="memberAsc") this.sortedMembers.sort(ClanComponent.compareName);
    if (this.sort=="memberDesc") this.sortedMembers.sort(ClanComponent.compareNameReverse);
    if (this.sort=="dateAsc") this.sortedMembers.sort(ClanComponent.compareDate);
    if (this.sort=="dateDesc") this.sortedMembers.sort(ClanComponent.compareDateReverse);
  }

  public loadSpecificPlayer(target: BungieGroupMember) {
    this.bungieService.getChars(target.destinyUserInfo.membershipType, target.destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions']).then(x => {
      target.player = x;
      //hack for raid
      if (x!=null && x.characters!=null){
        //in case this is a retry 
        this.members[this.playerCntr].errorMsg = null;

        //also update raid history
        this.bungieService.updateRaidHistory(x.milestoneList, x.characters).then(x=>{
          //nothing needed
        });

        this.bungieService.updateNfHistory(x.milestoneList, x.characters).then(x=>{
          //nothing needed
        });
      }
      else{
        this.members[this.playerCntr].errorMsg = "Unabled to load player data, have they logged in since DLC?";
      }
    });
  }

  private downloadCsvReport(){
    let sDate = new Date().toISOString().slice(0,10);
    let sCsv = "member,platform,chars,lastPlayed days ago,";
    this.modelPlayer.milestoneList.forEach(m=>{
      let tempName = m.name;
      tempName = m.name.replace(",","_");
      sCsv+=tempName+",";
      sCsv+=tempName+"%,";
    });
    sCsv+="\n";

    this.members.forEach(member=>{
      if (member.destinyUserInfo==null) return;
      if (member.player==null) return;

      sCsv+=member.destinyUserInfo.displayName+",";
      sCsv+=member.destinyUserInfo.platformName+",";
      if (member.player.characters!=null){
        sCsv+=member.player.characters.length+",";
      }
      else{
        sCsv+="0,";
      }
      
      let today = moment();
      let lastPlayed = moment(member.player.profile.dateLastPlayed);
      let diff = today.diff(lastPlayed, "days");
      sCsv+=diff+",";

      if (member.player.characters!=null){
        this.modelPlayer.milestoneList.forEach(mileStoneName=>{
          let total = 0;
          let pctTotal = 0;
          let possible = 0;
          member.player.characters.forEach(char=>{
            // handle privacy settings
            if (char.milestones == null){
              return;
            }
            if (char.milestones[mileStoneName.key]!=null){
              if (char.milestones[mileStoneName.key].pct!=null){
                pctTotal+=char.milestones[mileStoneName.key].pct;
                possible++;
              }
              if (char.milestones[mileStoneName.key].complete==true){
                total++;
              }
            }
          });
          sCsv+=total+",";
          if (possible==0) possible = 1;
          sCsv+=pctTotal/possible+",";
        });
      }

      sCsv+="\n";

    });

    this.downloadCsv("clan-progress-"+sDate+".csv", sCsv);
  }


  private downloadCsv(filename: string, csv: string){
    console.log("Downloading csv: "+filename);
    let anch: HTMLAnchorElement = document.createElement('a');
    anch.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    anch.setAttribute("download", filename);
    anch.setAttribute("visibility", "hidden");
    document.body.appendChild(anch);
    anch.click();
  }


  private slowlyLoadRest() {

    if (this.playerCntr >= this.members.length){
      this.allLoaded = true;
      return;
    }


    this.bungieService.getChars(this.members[this.playerCntr].destinyUserInfo.membershipType, this.members[this.playerCntr].destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions'], true).then(x => {
      if (this.modelPlayer == null && x!=null && x.characters!=null && x.characters[0].clanMilestones!=null) {
        this.modelPlayer = x;
      }
      if (x!=null && x.characters!=null){
        //in case this is a retry 
        this.members[this.playerCntr].errorMsg = null;
        //also update raid history
        this.bungieService.updateRaidHistory(x.milestoneList, x.characters).then(x=>{
          //nothing needed
        });
        this.bungieService.updateNfHistory(x.milestoneList, x.characters).then(x=>{
          //nothing needed
        });
      }
      else{
        this.members[this.playerCntr].errorMsg = "Unabled to load player data, have they logged on since DLC?";
      }
      this.members[this.playerCntr].player = x;
      this.playerCntr++;
      this.sortData();
      this.slowlyLoadRest();
    }).catch(err => {
      console.dir(err);
      //reloading mid load can break this
      if (this.members[this.playerCntr]!=null){
        console.log("Skipping error on " + this.members[this.playerCntr].destinyUserInfo.displayName + " and continuing");
        
        this.playerCntr++;
        this.slowlyLoadRest();
      }
    });

  }

  private load() {
    this.loading = true;
    this.members = [];
    this.modelPlayer = null;
    this.playerCntr = 0;
    this.allLoaded = false;

    this.bungieService.getClanInfo(this.id).then(i => {
      this.info = i;
      if (i != null) {
        //load the clan members
        this.bungieService.getClanMembers(this.id).then(x => {
          this.members = x;
          this.sortedMembers = this.members.slice(0);
          this.loading = false;
          if (this.members.length > 0) {
            this.slowlyLoadRest();
          }
        });
        // //also load clan stats and leaderboards
        // this.bungieService.getClanStats(this.id).then( (x)=>{
        //   console.dir(x);

        // });
        // this.bungieService.getClanLeaderboards(this.id).then( (x)=>{
        //   console.dir(x);
        // });
      }
      else {
        this.loading = false;
      }

    }).catch((x) => {
      this.loading = false;
    });
  }

  private sub: any;
  ngOnInit() {
    this.sub = this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.id = params['id'];
      if (this.id != null) {
        this.load();
      }
    });
  }
}
