import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import { MatPaginator, MatSort } from '@angular/material';
import 'rxjs/add/operator/takeUntil';
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
    });
  }

  private downloadCsvReport(){
    let sDate = new Date().toISOString().slice(0,10);
    let sCsv = "member,platform,lastPlayed days ago,";
    this.modelPlayer.milestoneList.forEach(m=>{
      sCsv+=m.name+",";
    });
    sCsv+="\n";

    this.members.forEach(member=>{
      if (member.destinyUserInfo==null) return;
      if (member.player==null) return;

      sCsv+=member.destinyUserInfo.displayName+",";
      sCsv+=member.destinyUserInfo.platformName+",";
      let today = moment();
      let lastPlayed = moment(member.player.profile.dateLastPlayed);
      let diff = today.diff(lastPlayed, "days");
      sCsv+=diff+",";

      if (member.player.characters!=null){
        this.modelPlayer.milestoneList.forEach(mileStoneName=>{
          let total = 0;
          member.player.characters.forEach(char=>{
            if (char.milestones[mileStoneName.key]!=null && char.milestones[mileStoneName.key].complete==true){
              total++;
            }
          });
          sCsv+=total+",";
        });
      }

      sCsv+="\n";

    });

    this.downloadCsv("clan-progress-"+sDate+".csv", sCsv);
  }


  private downloadCsv(filename: string, csv: string){
    filename = filename+".csv";
    let anch: HTMLAnchorElement = document.createElement('a');
    anch.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    anch.setAttribute("download", filename);
    anch.click();
  }


  private slowlyLoadRest() {

    if (this.playerCntr >= this.members.length){
      this.allLoaded = true;
      return;
    }


    this.bungieService.getChars(this.members[this.playerCntr].destinyUserInfo.membershipType, this.members[this.playerCntr].destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions'], true).then(x => {
      if (this.modelPlayer == null) {
        this.modelPlayer = x;
      }
      this.members[this.playerCntr].player = x;
      this.playerCntr++;
      this.sortData();
      this.slowlyLoadRest();
    }).catch(err => {
      console.dir(err);
      console.log("Skipping error on " + this.members[this.playerCntr].destinyUserInfo.displayName + " and continuing");
      this.playerCntr++;
      this.slowlyLoadRest();
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
    this.sub = this.route.params.takeUntil(this.unsubscribe$).subscribe(params => {
      this.id = params['id'];
      if (this.id != null) {
        this.load();
      }
    });
  }
}
