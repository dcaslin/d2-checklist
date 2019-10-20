
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { BungieMember, BungieMemberPlatform } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';


@Component({
  selector: 'd2c-bungie-search',
  templateUrl: './bungie-search.component.html',
  styleUrls: ['./bungie-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BungieSearchComponent extends ChildComponent implements OnInit, OnDestroy {
  routedName: string;
  name: string;
  public accounts: BehaviorSubject<BungieMember[]> = new BehaviorSubject(null);

  constructor(storageService: StorageService, private bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService);
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
      const x: BungieMember[] = await this.bungieService.searchBungieUsers(this.name);
      this.accounts.next(x);
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
