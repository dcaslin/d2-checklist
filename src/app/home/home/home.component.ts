
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { Today, WeekService } from '@app/service/week.service';
import { environment as env } from '@env/environment';
import { takeUntil } from 'rxjs/operators';
import { Const, Platform } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly version = env.versions.app;
  manifestVersion = '';
  readonly platforms: Platform[] = Const.PLATFORMS_ARRAY;

  selectedPlatform: Platform;
  gamerTag: string;
  showMoreInfo = false;
  today: Today = null;


  constructor(
    private destinyCacheService: DestinyCacheService,
    storageService: StorageService,
    private weekService: WeekService,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
    this.selectedPlatform = this.platforms[0];
    if (this.destinyCacheService.cache != null) {
      this.manifestVersion = this.destinyCacheService.cache.version;
    }

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          if (x.defaultplatform != null) {
            this.setPlatform(x.defaultplatform);

            this.ref.markForCheck();
          }
          if (x.defaultgt != null) {
            this.gamerTag = x.defaultgt;

            this.ref.markForCheck();
          }
        });

  }

  private setPlatform(type: number) {
    // already set
    if (this.selectedPlatform != null && this.selectedPlatform.type === type) { return; }
    this.selectedPlatform = Const.PLATFORMS_DICT['' + type];
  }

  public routeSearch(): void {
    if (this.selectedPlatform == null) {
      return;
    }
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }

    this.router.navigate(['gt', this.selectedPlatform.type, this.gamerTag]);
  }

  onPlatformChange() {
    this.storageService.setItem('defaultplatform', this.selectedPlatform.type);
  }

  onGtChange() {
    this.storageService.setItem('defaultgt', this.gamerTag);
  }


  async loadMileStones() {
    try {
      this.today = await this.weekService.getToday();
      this.ref.markForCheck();
    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() {

    this.loading.next(true);
    this.loadMileStones();
  }

}
