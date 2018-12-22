import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { fromEvent as observableFromEvent, of as observableOf, combineLatest } from 'rxjs';


import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { UserInfo, Player, FriendListEntry, BungieMember, InventoryItem, SelectedUser, ItemType, DamageType } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';

@Component({
  selector: 'anms-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearComponent extends ChildComponent implements OnInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER; 
  selectedUser: SelectedUser = null;
  player: Player = null;
  @ViewChild('filter') filter: ElementRef;
  filterText: string = null;


  gear: InventoryItem[] = [];

  ItemType = ItemType;
  DamageType = DamageType;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);

    this.loading = true;
  }

  public async load() {
    this.loading = true;
    try{
      if (this.selectedUser==null){
        this.player = null;
        this.gear = [];

        return;
      }
      this.player = await this.bungieService.getChars(this.selectedUser.userInfo.membershipType,
        this.selectedUser.userInfo.membershipId, ['Profiles', 'Characters',
        'CharacterEquipment', 'CharacterInventories','ItemObjectives',
        'ItemInstances','ItemPerks','ItemStats','ItemSockets','ItemPlugStates',
        'ItemTalentGrids','ItemCommonData','ProfileInventories'], false, true);
        this.gear = this.player.gear;
      

    }
    finally{
      this.loading = false;
    }
  }

  ngOnInit() { 
    this.load();

    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.load();
    });

    // filter changed
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(), )
      .subscribe(() => {
        const val: string = this.filter.nativeElement.value;
        if (val == null || val.trim().length === 0) {
          this.filterText = null;
        } else {
          this.filterText = val.toLowerCase();
        }
      });
  }
}