
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { BungieMember, BungieMembership, BungieMemberPlatform, SearchResult, ActivityMode, Player, BungieGroupMember, ClanInfo, LeaderBoardList, LeaderboardEntry } from "../../service/model";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-clanleaderboard',
  templateUrl: './clanleaderboard.component.html',
  styleUrls: ['./clanleaderboard.component.scss']
})
export class ClanLeaderboardComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  id: string;
  info: ClanInfo;
  list: LeaderBoardList[] = [];
  selectedLeaderList: LeaderBoardList = null;

  activityModes: ActivityMode[];
  selectedMode: ActivityMode;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);

    //remove "all" and "social"
    this.activityModes = bungieService.getActivityModes();
    this.activityModes.splice(-1,1);
    this.activityModes.shift();

    this.selectedMode = this.activityModes[0];
  }


  private load() {
    this.loading = true; 
    this.list = [];
    this.selectedLeaderList = null;
    this.bungieService.getClanInfo(this.id).then(i => {
      this.info = i;
      if (i != null) {
        this.bungieService.getClanLeaderboards(this.id, 100, this.selectedMode.type).then(x=>{
          if (x==null)
            this.list = [];
          else{
            this.list = x;
            this.selectedLeaderList = this.list[0];
          }
          this.loading = false;
        }).catch((x) => {
          this.loading = false;
        });
      }
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
