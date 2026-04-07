import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ChildComponent } from '@app/shared/child.component';
import { BungieService } from '../service/bungie.service';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Platform, Const } from '@app/service/model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-gamer-tag-search',
    templateUrl: './gamer-tag-search.component.html',
    styleUrls: ['./gamer-tag-search.component.scss'],
    imports: [NgIf, NgFor, MatButton, MatProgressSpinner, AsyncPipe]
})
export class GamerTagSearchComponent extends ChildComponent implements OnInit {

  public errorMsg: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public progressMsg: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public playerNotFound: BehaviorSubject<boolean> = new BehaviorSubject(false);
  platform: Platform | null = null;
  gamerTag: string | null = null;
  platforms = Const.PLATFORMS_ARRAY;

  constructor(private bungieService: BungieService,
    private route: ActivatedRoute, public router: Router,
    private ref: ChangeDetectorRef) {
    super();
  }

  private async init(params: Params) {
    this.loading.set(true);
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
      this.loading.set(false);
    }
  }


  ngOnInit() {

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {

      this.init(params);
    });
  }

}
