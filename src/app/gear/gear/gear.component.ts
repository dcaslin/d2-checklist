import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { fromEvent as observableFromEvent, Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Player, InventoryItem, SelectedUser, ItemType, DamageType } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';
import { MarkService, Marks } from '@app/service/mark.service';
import { GearService } from '@app/service/gear.service';

// DONE equip gear
// DONE transfer gear
// DONE sort (light, masterwork tier, mod, quantity)
// DONE lock unlock gear
// DONE is random roll
// DONE count dupes 
// DONE improve search text to include perks

// TODO filter UI
// weap & armor global: tags, owner, rarity, 20/50/100/All rows
// weap: type,
// armor: type, class


// TODO compare all like items in modal
// TODO stats modal
// TODO auto process locking items
// TODO make work in mobile
// TODO final tweaks to UI


@Component({
  selector: 'anms-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearComponent extends ChildComponent implements OnInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
  marks: Marks = null;
  player: Player = null;
  @ViewChild('filter') filter: ElementRef;
  filterText: string = null;
  options = [
    { name: 'Weapons', type: ItemType.Weapon },
    { name: 'Armor', type: ItemType.Armor },
    { name: 'Mods', type: ItemType.GearMod },
    { name: 'Consumable', type: ItemType.Consumable },
    { name: 'Material', type: ItemType.ExchangeMaterial }];
  option = this.options[0];
  sortBy: string = "power";
  sortDesc: boolean = true;
  gearToShow: InventoryItem[] = [];
  total: number = 0;

  ItemType = ItemType;
  DamageType = DamageType;


  filterChanged(): void{
    console.log("Filter changed");
  }


  constructor(storageService: StorageService, private bungieService: BungieService,
    public markService: MarkService,
    public gearService: GearService) {
    super(storageService);
    this.loading = true;
    this.marks = this.markService.buildEmptyMarks(null, null);
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) marking = null;
    item.mark = marking;
    this.markService.updateItem(item);
  }

  showCopies(i: InventoryItem){
    alert("TODO: show copies");  
  }


  showItem(i: InventoryItem){
    alert("TODO: show item");  
  }

  sort(val: string) {
    if (val == this.sortBy) {
      this.sortDesc = !this.sortDesc;
    }
    else {
      this.sortBy = val;
      this.sortDesc = true;
    }
    this.filterGear();
  }



  filterItem(i: InventoryItem): boolean {
    if (i.searchText.indexOf(this.filterText)>=0) return true;
    if (i.notes!=null && i.notes.indexOf(this.filterText)>=0) return true;
    return false;

  }

  filterGear() {
    if (this.player == null) return;
    let tempGear = this.player.gear.filter(i => i.type == this.option.type);
    if (this.filterText != null && this.filterText.trim().length > 0) {
      tempGear = tempGear.filter(this.filterItem, this);
    }
    this.total = tempGear.length;

    if (this.sortBy == "masterwork" || this.sortBy == "mod") {
      tempGear.sort((a: any, b: any): number => {
        let aV = "";
        let bV = "";
        if (this.sortBy == "masterwork") {
          aV = a[this.sortBy] != null ? a[this.sortBy].tier : -1;
          bV = b[this.sortBy] != null ? b[this.sortBy].tier : -1;
        }
        else if (this.sortBy == "mod") {
          aV = a[this.sortBy] != null ? a[this.sortBy].name : "";
          bV = b[this.sortBy] != null ? b[this.sortBy].name : "";
        }

        if (aV < bV) {
          return this.sortDesc ? 1 : -1;
        } else if (aV > bV) {
          return this.sortDesc ? -1 : 1;
        } else {
          if (this.sortBy == "masterwork") {    
            aV = a[this.sortBy] != null ? a[this.sortBy].name : "";
            bV = b[this.sortBy] != null ? b[this.sortBy].name : "";
            if (aV < bV) {
              return this.sortDesc ? 1 : -1;
            } else if (aV > bV) {
              return this.sortDesc ? -1 : 1;
            }
          }
          return 0;
        }
      });
    }
    else {
      tempGear.sort((a: any, b: any): number => {
        const aV = a[this.sortBy] != null ? a[this.sortBy] : "";
        const bV = b[this.sortBy] != null ? b[this.sortBy] : "";

        if (aV < bV) {
          return this.sortDesc ? 1 : -1;
        } else if (aV > bV) {
          return this.sortDesc ? -1 : 1;
        } else {
          return 0;
        }
      });
    }
    this.gearToShow = tempGear.slice(0, 20);
  }


  public async load() {
    this.loading = true;
    try {
      if (this.selectedUser == null) {
        this.player = null;
        this.filterGear();
        return;
      }
      this.player = await this.gearService.loadGear(this.selectedUser);
      this.filterGear();
    }
    finally {
      this.loading = false;
    }
  }

  async loadMarks() {
    this.marks = await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
      this.selectedUser.userInfo.membershipId);
    if (this.player != null)
      this.markService.processItems(this.player.gear);

  }

  ngOnInit() {
    this.load();
    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.loadMarks();
      this.load();
    });

    this.noteChanged.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(itm => {
        this.markService.updateItem(itm);
      });

    // filter changed
    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(150),
      distinctUntilChanged())
      .subscribe(() => {
        const val: string = this.filter.nativeElement.value;
        if (val == null || val.trim().length === 0) {
          this.filterText = null;
        } else {
          this.filterText = val.toLowerCase();
        }
        this.filterGear();
      });
  }
}