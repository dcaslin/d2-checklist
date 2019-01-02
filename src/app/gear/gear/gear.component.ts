import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { fromEvent as observableFromEvent, Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Player, InventoryItem, SelectedUser, ItemType, DamageType, ClassAllowed } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';
import { MarkService, Marks } from '@app/service/mark.service';
import { GearService } from '@app/service/gear.service';
import { Choice, GearToggleComponent } from './gear-toggle.component';
import { WishlistService } from '@app/service/wishlist.service';

// DONE equip gear
// DONE transfer gear
// DONE sort (light, masterwork tier, mod, quantity)
// DONE lock unlock gear
// DONE is random roll
// DONE count dupes 
// DONE improve search text to include perks
// DONE hard coded wishlist

//DONE show class for armor

// TODO filter UI
// weap & armor global: tags, owner, rarity, 20/50/100/All rows
// weap: type,
// armor: type, class


// TODO compare all like items in modal
// TODO stats modal
// TODO auto process locking items
// TODO make work in mobile
// TODO final tweaks to UI
// TODO wish list configurability

@Component({
  selector: 'anms-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearComponent extends ChildComponent implements OnInit, AfterViewInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  readonly markChoices: Choice[] = [
    new Choice("upgrade", "Upgrade"),
    new Choice("keep", "Keep"),
    new Choice("infuse", "Infuse"),
    new Choice("junk", "Junk"),
    new Choice(null, "Not Marked")
  ];


  readonly classTypeChoices: Choice[] = [
    new Choice(ClassAllowed.Titan + "", "Titan"),
    new Choice(ClassAllowed.Warlock + "", "Warlock"),
    new Choice(ClassAllowed.Hunter + "", "Hunter"),
    new Choice(ClassAllowed.Any + "", "Any"),
  ];
  weaponTypeChoices: Choice[] = [];
  armorTypeChoices: Choice[] = [];
  modTypeChoices: Choice[] = [];
  consumableTypeChoices: Choice[] = [];
  exchangeTypeChoices: Choice[] = [];
  ownerChoices: Choice[] = [];
  rarityChoices: Choice[] = [];

  @ViewChild('markToggle')
  public markToggle: GearToggleComponent;
  @ViewChild('weaponTypeToggle')
  public weaponTypeToggle: GearToggleComponent;
  @ViewChild('armorTypeToggle')
  public armorTypeToggle: GearToggleComponent;
  @ViewChild('modTypeToggle')
  public modTypeToggle: GearToggleComponent;
  @ViewChild('consumableTypeToggle')
  public consumableTypeToggle: GearToggleComponent;
  @ViewChild('exchangeTypeToggle')
  public exchangeTypeToggle: GearToggleComponent;
  @ViewChild('classTypeToggle')
  public classTypeToggle: GearToggleComponent;
  @ViewChild('ownerToggle')
  public ownerToggle: GearToggleComponent;
  @ViewChild('rarityToggle')
  public rarityToggle: GearToggleComponent;

  filters: GearToggleComponent[] = [];
  filtersDirty: boolean =  false;



  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
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
  size = 20;
  total: number = 0;

  ItemType = ItemType;
  DamageType = DamageType;
  ClassAllowed = ClassAllowed;

  show(count: number) {
    this.size = count;
    this.filterChanged();
  }

  filterChanged(): void {
    this.filtersDirty = this.checkFilterDirty();
    this.filterGear();
  }

  resetFilters(): void{
    this.filter.nativeElement.value = "";
    this.filterText = null;
    for (const toggle of this.filters){
      toggle.selectAll(true);
    }
    this.filterChanged();

  }


  constructor(storageService: StorageService, private bungieService: BungieService,
    public markService: MarkService,
    public gearService: GearService,
    private wishlistSerivce: WishlistService) {
    super(storageService);
    this.loading = true;
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) marking = null;
    item.mark = marking;
    this.markService.updateItem(item);
  }

  showCopies(i: InventoryItem) {
    alert("TODO: show copies");
  }


  showItem(i: InventoryItem) {
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
    if (i.searchText.indexOf(this.filterText) >= 0) return true;
    if (i.notes != null && i.notes.indexOf(this.filterText) >= 0) return true;
    return false;

  }

  private wildcardFilter(gear: InventoryItem[]): InventoryItem[] {
    if (this.filterText != null && this.filterText.trim().length > 0) {
      return gear.filter(this.filterItem, this);
    }
    else {
      return gear;
    }
  }

  checkFilterDirty(){
    if (this.filterText!=null && this.filterText.trim().length>0) return true;
    for (const toggle of this.filters){
      if (!toggle.isAllSelected()) return true;
    }
    return false;
  }

  private toggleFilterSingle(i: InventoryItem): boolean {
    if (!this.markToggle.isChosen(i.mark)) return false;
    if (!this.weaponTypeToggle.isChosen(i.typeName)) return false;
    if (!this.armorTypeToggle.isChosen(i.typeName)) return false;
    if (!this.modTypeToggle.isChosen(i.typeName)) return false;
    if (!this.consumableTypeToggle.isChosen(i.typeName)) return false;
    if (!this.exchangeTypeToggle.isChosen(i.typeName)) return false;

    if (!this.ownerToggle.isChosen(i.owner.id)) return false;
    if (!this.rarityToggle.isChosen(i.tier)) return false;
    if (!this.classTypeToggle.isChosen(i.classAllowed)) return false;

    return true;
  }

  private toggleFilter(gear: InventoryItem[]): InventoryItem[] {
    const returnMe: InventoryItem[] = [];
    for (const i of gear) {
      if (this.toggleFilterSingle(i)) {
        returnMe.push(i);
      }
    }
    return returnMe;
  }

  filterGear() {
    if (this.player == null) return;
    let tempGear = this.player.gear.filter(i => i.type == this.option.type);
    tempGear = this.wildcardFilter(tempGear);
    tempGear = this.toggleFilter(tempGear);
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
    if (this.size > 0)
      this.gearToShow = tempGear.slice(0, this.size);
    else
      this.gearToShow = tempGear.slice(0);
  }


  public async load() {
    this.loading = true;
    try {
      if (this.selectedUser == null) {
        this.player = null;
      }
      else {
        this.player = await this.gearService.loadGear(this.selectedUser);
      }
      this.generateChoices();
      this.filterGear();
    }
    finally {
      this.loading = false;
    }
  }

  private generateChoices(force?: boolean) {
    if (this.player == null) return;
    if (this.player.gear == null) return;
    if (this.player.gear.length == 0) return;
    if (this.weaponTypeChoices.length > 0 && !force) return;

    const tempOwners = [];
    for (const char of this.player.characters) {
      tempOwners.push(new Choice(char.id, char.label));
    }
    tempOwners.push(new Choice(this.player.vault.id, this.player.vault.label));
    tempOwners.push(new Choice(this.player.shared.id, this.player.shared.label));
    this.ownerChoices = tempOwners;

    const temp: any = {};
    temp["rarity"] = {};
    for (const i of this.player.gear) {
      if (temp[i.type + ""] == null) {
        temp[i.type + ""] = [];
      }
      temp[i.type + ""][i.typeName] = true;
      temp["rarity"][i.tier] = true;

    }
    const arrays: any = {};
    for (const key in temp) {
      const arr = [];
      for (const typeName in temp[key]) {
        arr.push(new Choice(typeName, typeName));
      }
      arr.sort(function (a, b) {
        if (a.display < b.display)
          return -1;
        if (a.display > b.display)
          return 1;
        return 0;
      });
      arrays[key] = arr;
    }
    this.weaponTypeChoices = arrays[ItemType.Weapon + ""];
    this.armorTypeChoices = arrays[ItemType.Armor + ""];
    this.modTypeChoices = arrays[ItemType.GearMod + ""];
    this.consumableTypeChoices = arrays[ItemType.Consumable + ""];
    this.exchangeTypeChoices = arrays[ItemType.ExchangeMaterial + ""];
    this.rarityChoices = arrays["rarity"];
  }

  async loadMarks() {
    await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
      this.selectedUser.userInfo.membershipId);
    if (this.player != null)
      this.markService.processItems(this.player.gear);
  }

  async loadWishlist() {
    await this.wishlistSerivce.init();
    if (this.player != null)
      this.wishlistSerivce.processItems(this.player.gear);
  }


  ngAfterViewInit() {
    this.filters.push(this.markToggle);
    this.filters.push(this.weaponTypeToggle);
    this.filters.push(this.armorTypeToggle);
    this.filters.push(this.modTypeToggle);
    this.filters.push(this.consumableTypeToggle);
    this.filters.push(this.exchangeTypeToggle);
    this.filters.push(this.ownerToggle);
    this.filters.push(this.rarityToggle);
    this.filters.push(this.classTypeToggle);
  }

  ngOnInit() {
    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.loadMarks();
      this.load();
    });
    this.loadWishlist();


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
        this.filterChanged();
      });
  }
}