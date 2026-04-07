
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { BungieMemberPlatform, BungieGlobalSearchResult, Const } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-bungie-search',
    templateUrl: './bungie-search.component.html',
    styleUrls: ['./bungie-search.component.scss'],
    imports: [NgIf, MatProgressSpinner, MatFormField, MatLabel, MatInput, FormsModule, MatMiniFabButton, MatIcon, NgFor, RouterLink, FaIconComponent, AsyncPipe]
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
    this.loading.set(true);
    try {
      const x = await this.bungieService.getClans(member.bungieNetMembershipId!);
      member.clans = x;
    }
    finally {
      this.loading.set(false);
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
    this.loading.set(true);
    try {
      const x: BungieGlobalSearchResult[] = await this.bungieService.searchBungieUsers(this.name);
      this.rows$.next(x);
    }
    finally {
      this.loading.set(false);
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
