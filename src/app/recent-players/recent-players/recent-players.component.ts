
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { Player, Character, Platform, ActivityMode, Const, Activity, PGCR } from "../../service/model";
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
  rowCntr: number = 0;
  

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
      const r = await this.bungieService.getActivityHistory(this.membershipType, this.membershipId, this.characterId, this.selectedMode.type, this.selectedMaxResults);
      if (r.length>this.selectedMaxResults){
        this.rows = r.splice(0, this.selectedMaxResults);
      }
      else{
        this.rows = r;
      }
      this.rowCntr = 0;
      this.msg = "Analyzing " + this.rows.length + " matches...";
      this.loadNextRow();
    }
    finally {
      this.loading = false;
    }
  }

  private async loadNextRow(): Promise<void> {
    if (this.rowCntr >= this.rows.length) {
      //done
      return;
    }

    const row = this.rows[this.rowCntr];
    try {
      const data:PGCR = await this.bungieService.getPGCR(row.instanceId);
      this.processPGCR(data);
      console.log(data.instanceId);
    }
    finally {
      this.rowCntr++;
    }
    this.loadNextRow();
  }

  private processPGCR(p:PGCR){
    let targetFireTeamId = null;
    for (const e of p.entries){
      if (e.characterId==this.characterId){
        targetFireTeamId = e.fireteamId;
        break;
      }
    }
    if (targetFireTeamId==null) return;
    for (const e of p.entries){
      if (e.characterId!=this.characterId){
        if (e.fireteamId==targetFireTeamId){
          console.log(e.user.displayName);
        }
      }
    }

  }

  pgcr(instanceId: string) {
    this.router.navigate(['/pgcr', instanceId]);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const platform: string = params['platform'];
      if (platform == null) return;
      let selPlatform = Const.PLATFORMS_DICT[platform];
      if (selPlatform != null) {
        this.membershipType = selPlatform.type;
        this.membershipId = params['memberId'];
        this.bungieService.getChars(this.membershipType, this.membershipId, ["Profiles", "Characters"], false).then(p => {
          this.player = p;

        });
        this.characterId = params['characterId'];
        this.history();
      }
    });
  }

}
