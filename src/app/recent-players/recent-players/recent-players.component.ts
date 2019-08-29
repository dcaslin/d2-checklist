
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { Activity, ActivityMode, BungieNetUserInfo, Const, PGCR, PGCREntry, Player } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'd2c-history',
  templateUrl: './recent-players.component.html',
  styleUrls: ['./recent-players.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.activityModes = bungieService.getActivityModes();
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
      const data: PGCR = await this.bungieService.getPGCR(row.instanceId);
      this.processPGCR(data);
      this.ref.markForCheck();
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
      };
      // async store clans
      this.bungieService.loadClansForUser(e.user).then(() => {
        // update view if clan updates
        this.ref.markForCheck();
      });
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
    const bnetName = await this.bungieService.getFullBNetName(target.membershipId);
    if (bnetName != null) { this.router.navigate(['/', 4, bnetName]); }
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
