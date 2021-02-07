import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ChildComponent } from '@app/shared/child.component';
import { BungieService } from '../service/bungie.service';
import { StorageService } from '../service/storage.service';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Platform, Const } from '@app/service/model';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gamer-tag-search',
  templateUrl: './gamer-tag-search.component.html',
  styleUrls: ['./gamer-tag-search.component.scss']
})
export class GamerTagSearchComponent extends ChildComponent implements OnInit {

  public errorMsg: BehaviorSubject<string> = new BehaviorSubject(null);
  public progressMsg: BehaviorSubject<string> = new BehaviorSubject(null);
  public playerNotFound: BehaviorSubject<boolean> = new BehaviorSubject(false);
  platform: Platform = null;
  gamerTag: string = null;
  platforms = Const.PLATFORMS_ARRAY;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, public router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
  }

  private async init(params: Params) {
    this.loading.next(true);
    try {
      this.errorMsg.next(null);
      this.progressMsg.next(null);
      this.playerNotFound.next(false);
      this.platform = null;
      this.gamerTag = null;


      const sPlatform: string = params['platform'];
      const sGamerTag: string = params['gamertag'];

      const platform = BungieService.parsePlatform(sPlatform);
      if (platform == null) {
        this.errorMsg.next(sPlatform + ' is not a valid platform.');
        return;
      }
      this.platform = platform;
      this.gamerTag = sGamerTag;

      const p = await this.bungieService.searchPlayer(platform.type, sGamerTag);
      if (p == null) {
        this.playerNotFound.next(true);
        return;
      }
      this.router.navigate([p.membershipType, p.membershipId]);
      return;
    } catch (exc) {
      this.errorMsg.next(exc);
    } finally {
      this.loading.next(false);
    }
  }


  ngOnInit() {

    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {

      this.init(params);
    });
  }

}
