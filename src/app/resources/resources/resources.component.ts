
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from "../../service/bungie.service";
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { SelectedUser, Player, Character, SaleItem } from '@app/service/model';

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

  constructor(storageService: StorageService, private bungieService: BungieService, 
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  public async setChar(c: Character, alreadyLoading: boolean){
    if (c==null){
      this.char = null;
      this.vendorData = null;
      return;
    } 
    if (!alreadyLoading) this.loading = true;
    try{
      this.char = c;
      this.vendorData = await this.bungieService.loadVendors(c);
    }
    finally {
      if (!alreadyLoading) this.loading = false;
    }
  }
  
  private async load() {
    if (this.selectedUser==null){
      this.player = null;
      this.setChar(null, false);
      return;
    }
    this.loading = true;
    try{
      this.player = await this.bungieService.getChars(this.selectedUser.selectedUser.membershipType, this.selectedUser.selectedUser.membershipId, ['Profiles', 'Characters']);
      await this.setChar(this.player.characters[0], true);
    }
    finally{
      this.loading = false;
    }
  }

  private sub: any;
  ngOnInit() {
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.load();
    });
    
  }
}
