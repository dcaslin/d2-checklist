
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { BungieMemberPlatform, BungieGlobalSearchResult, Const } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-bungie-search',
  templateUrl: './bungie-search.component.html',
  styleUrls: ['./bungie-search.component.scss']
})
export class BungieSearchComponent extends ChildComponent implements OnInit, OnDestroy {
  Const = Const;
  routedName: string;
  name: string;
  public rows$: BehaviorSubject<BungieGlobalSearchResult[]> = new BehaviorSubject(null);

  constructor(storageService: StorageService, private bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, public router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
  }

  public async loadClan(member: BungieGlobalSearchResult) {
    this.loading.next(true);
    try {
      const x = await this.bungieService.getClans(member.bungieNetMembershipId);
      member.clans = x;
    }
    finally {
      this.loading.next(false);
    }
    this.ref.markForCheck();

  }

  search() {
    if (this.name != null) {
      if (this.name === this.routedName) {
        this.load();
      } else {
        this.router.navigate(['search', this.name]);
      }
    }

  }

  private async load() {
    console.log('loading');
    this.loading.next(true);
    try {
      const x: BungieGlobalSearchResult[] = await this.bungieService.searchBungieUsers(this.name);
      this.rows$.next(x);
    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.routedName = params['name'];
      this.name = params['name'];
      if (this.name != null) {
        this.load();
      }
    });
  }
}
