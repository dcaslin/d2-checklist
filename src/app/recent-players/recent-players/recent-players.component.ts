
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { Entry, Game, PgcrService } from '@app/service/pgcr.service';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { Activity, ActivityMode, Const, Player, UserInfo } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-history',
  templateUrl: './recent-players.component.html',
  styleUrls: ['./recent-players.component.scss']
})
export class RecentPlayersComponent extends ChildComponent implements OnInit, OnDestroy {
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


  displayedColumns = ['period', 'mode', 'name', 'kd', 'timePlayedSeconds'];

  constructor(storageService: StorageService, private bungieService: BungieService,
    public iconService: IconService,
    private pgcrService: PgcrService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.activityModes = BungieService.getActivityModes();
    this.selectedMode = this.activityModes[0];
    this.maxResults = [5, 10, 20, 50];
    this.selectedMaxResults = this.maxResults[0];

  }

  public async history() {
    this.loading.next(true);
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
      this.loading.next(false);
    }
  }

  private async loadNextRow(): Promise<void> {
    if (this.rowCntr >= this.rows.length) {
      return;
    }
    const row = this.rows[this.rowCntr];
    try {
      const data: Game = await this.pgcrService.loadPGCR(row.instanceId);
      this.processPGCR(data);
      this.ref.markForCheck();
    }
    finally {
      this.rowCntr++;
    }
    this.loadNextRow();
  }

  private processPGCR(p: Game) {
    if (p == null) { return; }
    let targetFireTeamId = null;
    for (const e of p.entries) {
      if (e.info.characterId === this.characterId) {
        targetFireTeamId = e.values.fireteamId;
        break;
      }
    }
    if (targetFireTeamId == null) { return; }
    for (const e of p.entries) {
      if (e.info.characterId !== this.characterId) {
        if (e.values.fireteamId === targetFireTeamId) {
          this.countFriend(p, e);
        }
      }
    }
  }

  private countFriend(p: Game, e: Entry) {
    const user = e.info.player.destinyUserInfo;
    const membershipId = user.membershipId;
    if (this.friendsDict[e.info.player.destinyUserInfo.membershipId] == null) {
      this.friendsDict[e.info.player.destinyUserInfo.membershipId] = {
        user: e.info.player.destinyUserInfo,
        instances: []
      };
      // async store clans
      this.bungieService.loadClansForUser(user as unknown as UserInfo).then(() => {
        // update view if clan updates
        this.ref.markForCheck();
      });
      this.friends.push(this.friendsDict[membershipId]);
    }
    this.friendsDict[membershipId].instances.push(p);

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
