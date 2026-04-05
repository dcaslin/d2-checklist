
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { BungieMemberPlatform, BungieGlobalSearchResult, Const } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-bungie-search',
  templateUrl: './bungie-search.component.html',
  styleUrls: ['./bungie-search.component.scss']
})
export class BungieSearchComponent extends ChildComponent implements OnInit {
  Const = Const;
  routedName!: string;
  name!: string;
  public rows$: BehaviorSubject<BungieGlobalSearchResult[] | null> = new BehaviorSubject<BungieGlobalSearchResult[] | null>(null);

  constructor(private bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, public router: Router,
    private ref: ChangeDetectorRef) {
    super();
  }

  public async loadClan(member: BungieGlobalSearchResult) {
    this.loading.next(true);
    try {
      const x = await this.bungieService.getClans(member.bungieNetMembershipId!);
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
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.routedName = params['name'];
      this.name = params['name'];
      if (this.name != null) {
        this.load();
      }
    });
  }
}
