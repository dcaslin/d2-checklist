
import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../service/bungie.service';
import { Character, Const, NameDesc, Platform, Player, PublicMilestonesAndActivities } from '../service/model';
import { StorageService } from '../service/storage.service';
import { ChildComponent } from '../shared/child.component';
import { PlayerStateService } from './player-state.service';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent extends ChildComponent implements OnInit, OnDestroy {
  public today = moment(new Date());
  public const: Const = Const;
  public PLATFORMS_DICT = Const.PLATFORMS_DICT;
  public errorMsg: BehaviorSubject<string> = new BehaviorSubject(null);

  public publicInfo: PublicMilestonesAndActivities = null;

  constructor(public bungieService: BungieService,
    public iconService: IconService,
    storageService: StorageService,
    private route: ActivatedRoute, private router: Router,
    public dialog: MatDialog,
    public state: PlayerStateService) {
    super(storageService);
  }

  public getRaidLink(p: Player) {
    let platformstr: string;
    let memberid: string;
    if (p.profile.userInfo.membershipType === 1) {
      platformstr = 'xb';
      memberid = p.profile.userInfo.displayName;
    } else if (p.profile.userInfo.membershipType === 2) {
      platformstr = 'ps';
      memberid = p.profile.userInfo.displayName;
    } else if (p.profile.userInfo.membershipType === 4) {
      platformstr = 'pc';
      memberid = p.profile.userInfo.membershipId;
    }
    return 'http://raid.report/' + platformstr + '/' + memberid;
  }

  public history(c: Character) {
    this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
  }

  async setPublicInfo() {
    this.publicInfo = await this.bungieService.getPublicMilestones();
  }

  public static validateInteger(s: string): string {
    if (!/^[0-9]\d*$/.test(s)) {
      return null;
    }
    return s;
  }

  private async init(params: Params) {
    try {
      this.errorMsg.next(null);
      const sPlatform = params['platform'];
      const platform = BungieService.parsePlatform(sPlatform);
      if (platform == null) {
        throw new Error(sPlatform + ' is not a valid platform');
      }
      const sMemberId = params['memberId'];
      const memberId: string = PlayerComponent.validateInteger(sMemberId);
      // handle old URL's nicely
      if (memberId == null) {
        this.router.navigate(['gt', '' + platform.type, sMemberId]);
        return;
      }
      // if nothing changed, don't do anything
      const player = this.state.currPlayer();
      if (player != null) {
        const ui = player.profile.userInfo;
        if (ui.membershipType == platform.type && ui.membershipId == memberId) {
          if (this.state._contentVaultOnly.value != true) {
            return;
          }
        }
      }
      await this.state.loadPlayer(platform, memberId, false);


    } catch (exc) {
      console.dir(exc);
      this.errorMsg.next(exc.message);
    }
  }

  ngOnInit() {
    this.setPublicInfo();
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.init(params);
    });



  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
