
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { of as observableOf, combineLatest } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { SelectedUser, Player, Character, SaleItem, ItemType } from '@app/service/model';

@Component({
  selector: 'anms-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  selectedUser: SelectedUser = null;
  player: Player = null;
  char: Character = null;
  vendorData: SaleItem[] = null;
  options = ["Bounties", "Gear", "Exchange", "Cosmetics"];
  option = this.options[0];

  ItemType = ItemType;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
    this.loading = true;
  }

  public async setChar(c: Character, alreadyLoading: boolean) {
    if (c == null) {
      this.char = null;
      this.vendorData = null;
      if (!alreadyLoading) this.loading = false;
      return;
    }
    if (!alreadyLoading) this.loading = true;
    try {
      if (this.char != null && this.char.characterId == c.characterId && this.vendorData != null && this.vendorData.length > 0) {

      }
      else {
        this.char = c;
        this.vendorData = await this.bungieService.loadVendors(c);
      }
    }
    finally {
      if (!alreadyLoading) this.loading = false;
    }
  }

  private async load2(d: LoadInfo) {
    this.loading = true;
    try {
      if (d == null || d.user == null) {
        this.player = null;
        this.setChar(null, false);
        this.option = this.options[0];
        return;
      }
      this.selectedUser = d.user;
      if (d.tab != null) {
        let found = false;
        for (const o of this.options) {
          if (d.tab.toUpperCase() == o.toUpperCase()) {
            this.option = o;
            found = true;
            break;
          }
        }
        //bad option route
        if (!found) {
          this.router.navigate(["vendors", d.characterId]);
          return;
        }
      }
      this.selectedUser = d.user;
      if (this.player != null && this.player.profile.userInfo.membershipId == this.selectedUser.selectedUser.membershipId) {

      }
      else {
        this.player = await this.bungieService.getChars(this.selectedUser.selectedUser.membershipType, this.selectedUser.selectedUser.membershipId, ['Profiles', 'Characters']);
      }
      if (d.characterId != null) {
        let found = false;
        for (const c of this.player.characters) {
          if (d.characterId.toUpperCase() == c.characterId) {
            await this.setChar(c, true);
            found = true;
            break;
          }
        }
        //bad character route
        if (!found) {
          this.router.navigate(["vendors"]);
          return;
        }
      }
      //no char in route, so route them
      else {
        this.router.navigate(["vendors", this.player.characters[0].characterId]);
        return;
        // await this.setChar(this.player.characters[0], true);
      }



    }
    finally {
      this.loading = false;
    }
  }

  private sub: any;
  ngOnInit() {

    combineLatest(this.bungieService.selectedUserFeed, this.route.paramMap, this.route.url).pipe(
      switchMap(([selectedUser, params, url]) => {
        return observableOf({
          user: selectedUser,
          characterId: params.get('characterId'),
          tab: params.get('tab')
        });
      }
      ),
      catchError(() => {
        return observableOf(null);
      }),
      takeUntil(this.unsubscribe$)
    )
      .subscribe((d: LoadInfo) => {
        if (this.char != null && d.characterId == this.char.characterId && this.selectedUser == d.user) {
          this.option = d.tab;
        }
        else {
          this.load2(d);
        }
      });
  }
}

interface LoadInfo {
  user: SelectedUser;
  characterId: string;
  tab: string;
}