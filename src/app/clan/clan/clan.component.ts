import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil';
import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { BungieMember, BungieMembership, BungieMemberPlatform, SearchResult, Player, BungieGroupMember, ClanInfo } from "../../service/model";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

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

  private sortData(): void{
    if (this.sort=="memberAsc") this.members.sort(ClanComponent.compareName);
    if (this.sort=="memberDesc") this.members.sort(ClanComponent.compareNameReverse);
    if (this.sort=="dateAsc") this.members.sort(ClanComponent.compareDate);
    if (this.sort=="dateDesc") this.members.sort(ClanComponent.compareDateReverse);
  }

  public loadSpecificPlayer(target: BungieGroupMember) {
    this.bungieService.getChars(target.destinyUserInfo.membershipType, target.destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions']).then(x => {
      target.player = x;
    });
  }

  private slowlyLoadRest() {

    if (this.playerCntr >= this.members.length) return;


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

    this.bungieService.getClanInfo(this.id).then(i => {
      this.info = i;
      if (i != null) {
        this.bungieService.getClanMembers(this.id).then(x => {
          this.members = x;
          //TODO copy this array into the sorted target here
          this.loading = false;
          if (this.members.length > 0) {
            this.slowlyLoadRest();
          }
        });
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
