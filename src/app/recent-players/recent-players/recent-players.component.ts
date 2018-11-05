
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from '../../service/bungie.service';
import { Player, Character, Platform, ActivityMode, Const, Activity, PGCR, UserInfo,
  PGCREntry, BungieNetUserInfo, BungieMember } from '../../service/model';
import { MatPaginator, MatSort } from '@angular/material';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-history',
  templateUrl: './recent-players.component.html',
  styleUrls: ['./recent-players.component.scss']
})
export class RecentPlayersComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  activityModes: ActivityMode[];
  maxResults: number[];
  selectedMaxResults: number;
  selectedMode: ActivityMode;

  membershipType: number;
  membershipId: string;
  characterId: string;
  player: Player;

  msg: string;
  rows: Activity[];
  rowCntr = 0;
  friendsDict = {};
  friends = [];


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns = ['period', 'mode', 'name', 'kd', 'timePlayedSeconds'];

  constructor(storageService: StorageService, private bungieService: BungieService, private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.activityModes = bungieService.getActivityModes();
    this.selectedMode = this.activityModes[0];
    this.maxResults = [5, 10, 20, 50];
    this.selectedMaxResults = this.maxResults[0];

  }

  public async history() {
    this.loading = true;
    try {
      const r = await this.bungieService.getActivityHistory(this.membershipType, this.membershipId,
        this.characterId, this.selectedMode.type, this.selectedMaxResults);
      if (r.length > this.selectedMaxResults) {
        this.rows = r.splice(0, this.selectedMaxResults);
      } else {
        this.rows = r;
      }
      this.friendsDict = {};
      this.friends = [];
      this.rowCntr = 0;
      this.msg = 'Analyzing ' + this.rows.length + ' matches...';
      this.loadNextRow();
    }
    finally {
      this.loading = false;
    }
  }

  private async loadNextRow(): Promise<void> {
    if (this.rowCntr >= this.rows.length) {
      return;
    }
    const row = this.rows[this.rowCntr];
    try {
      const data: PGCR = await this.bungieService.getPGCR(row.instanceId);
      this.processPGCR(data);
    }
    finally {
      this.rowCntr++;
    }
    this.loadNextRow();
  }

  private processPGCR(p: PGCR) {
    if (p == null) { return; }
    let targetFireTeamId = null;
    for (const e of p.entries) {
      if (e.characterId === this.characterId) {
        targetFireTeamId = e.fireteamId;
        break;
      }
    }
    if (targetFireTeamId == null) { return; }
    for (const e of p.entries) {
      if (e.characterId !== this.characterId) {
        if (e.fireteamId === targetFireTeamId) {
          this.countFriend(p, e);
        }
      }
    }
  }

  private countFriend(p: PGCR, e: PGCREntry) {
    if (this.friendsDict[e.user.membershipId] == null) {
      this.friendsDict[e.user.membershipId] = {
        user: e.user,
        bungieNetUserInfo: e.bungieNetUserInfo,
        instances: []
      }
      this.friends.push(this.friendsDict[e.user.membershipId]);
    }
    this.friendsDict[e.user.membershipId].instances.push(p);

    this.friends.sort((a, b) => {
      if (a.instances.length > b.instances.length ) { return -1; }
      if (a.instances.length  < b.instances.length ) { return 1; }

      if (a.user.name > b.user.name) { return 1; }
      if (a.user.name < b.user.name) { return -1; }
      return 0;
    });
  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  public async navigateBnetMember(target: BungieNetUserInfo) {
    const match: BungieMember = await this.bungieService.getBungieMemberById(target.membershipId);
    if (match == null) { return; }
    this.router.navigate(['/', match.bnet.platform.type, match.bnet.name]);
    return;
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const platform: string = params['platform'];
      if (platform == null) { return; }
      const selPlatform = Const.PLATFORMS_DICT[platform];
      if (selPlatform != null) {
        this.membershipType = selPlatform.type;
        this.membershipId = params['memberId'];
        this.bungieService.getChars(this.membershipType, this.membershipId, ['Profiles', 'Characters'], false).then(p => {
          this.player = p;

        });
        this.characterId = params['characterId'];
        this.history();
      }
    });
  }

}

interface Friend {
  user: UserInfo[];
  bungieNetUserInfo: BungieNetUserInfo;
  instances: PGCR[];
}
