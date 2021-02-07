import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { PlayerStateService } from '@app/player/player-state.service';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '@app/service/bungie.service';
import { PlayerComponent } from '@app/player';
import { BehaviorSubject } from 'rxjs';
import { IconService } from '@app/service/icon.service';
import { Const } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-content-vault',
  templateUrl: './content-vault.component.html',
  styleUrls: ['./content-vault.component.scss']
})
export class ContentVaultComponent extends ChildComponent implements OnInit, OnDestroy {
  public errorMsg: BehaviorSubject<string> = new BehaviorSubject(null);
  public PLATFORMS_DICT = Const.PLATFORMS_DICT;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    private route: ActivatedRoute,
    private router: Router,
    public state: PlayerStateService) {
    super(storageService);
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.init(params);
    });
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
          return;
        }
      }
    } catch (exc) {
      console.dir(exc);
      this.errorMsg.next(exc.message);
    }
  }


}
