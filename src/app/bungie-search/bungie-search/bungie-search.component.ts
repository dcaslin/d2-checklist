
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BungieService } from '../../service/bungie.service';
import { BungieMember, BungieMemberPlatform, SearchResult, Player, ClanRow } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'd2c-bungie-search',
  templateUrl: './bungie-search.component.html',
  styleUrls: ['./bungie-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BungieSearchComponent extends ChildComponent implements OnInit, OnDestroy {
  name: string;
  public accounts: BehaviorSubject<BungieMember[]> = new BehaviorSubject([]);

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  public async loadPlayer(a: BungieMemberPlatform) {
    this.loading.next(true);
    try {
      const p = await this.bungieService.searchPlayer(a.platform.type, a.name);
      if (p != null) {
        const x = await this.bungieService.getChars(p.membershipType, p.membershipId, ['Profiles', 'Characters']);
        if (x != null) {
          this.router.navigate([a.platform.type, a.name]);
        } else {
          a.defunct = true;
        }
      } else {
        a.defunct = true;
      }
    }
    finally {
      this.loading.next(false);
    }
    this.ref.markForCheck();
  }

  public async loadClan(member: BungieMember) {
    this.loading.next(true);
    try {
      const x = await this.bungieService.getClans(member.id);
      if (x.length === 0) {
        member.noClan = true;
      } else {
        member.clans = x;
      }
    }
    finally {
      this.loading.next(false);
    }
    this.ref.markForCheck();

  }

  search() {
    if (this.name != null) {
      this.router.navigate(['search', this.name]);
    }

  }

  private async load() {
    this.loading.next(true);
    try {
      const x: BungieMember[] = await this.bungieService.searchBungieUsers(this.name);
      this.accounts.next(x);
    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.name = params['name'];
      if (this.name != null) {
        this.load();
      }
    });
  }
}
