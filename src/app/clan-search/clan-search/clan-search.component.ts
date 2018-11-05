
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from '../../service/bungie.service';
import { BungieMember, BungieMembership, BungieMemberPlatform, SearchResult, Player, ClanRow, ClanInfo } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-clan-search',
  templateUrl: './clan-search.component.html',
  styleUrls: ['./clan-search.component.scss']
})
export class ClanSearchComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  name: string;
  clan: ClanInfo = null;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }
  search() {
    this.load();
  }

  private load() {
    this.loading = true;
    this.bungieService.searchClans(this.name)
      .then((x: ClanInfo) => {
        this.clan = x;
        this.loading = false;
        if (x != null) {
          localStorage.setItem('last-clan-search', this.name);
        }
      })
      .catch((x) => {
        this.clan = null;
        this.loading = false;
      });
  }

  ngOnInit() {
    this.name = localStorage.getItem('last-clan-search');
  }
}
