
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatTabGroup } from '@angular/material';
import { environment as env } from '@env/environment';
import { Const, Platform} from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { WeekService, Today } from '@app/service/week.service';

@Component({
  selector: 'd2c-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends ChildComponent implements OnInit, OnDestroy {

  @ViewChild(MatTabGroup) tabs: MatTabGroup;

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
    private ref: ChangeDetectorRef,
    private weekService: WeekService,
    private router: Router) {
    super(storageService, ref);
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

    this.router.navigate([this.selectedPlatform.type, this.gamerTag]);
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
