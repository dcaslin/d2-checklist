import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Inject } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { fromEvent as observableFromEvent, Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Player, InventoryItem, SelectedUser, ItemType, DamageType, ClassAllowed, Target, Character, InventoryPlug } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';
import { MarkService, Marks } from '@app/service/mark.service';
import { GearService } from '@app/service/gear.service';
import { Choice, GearToggleComponent } from './gear-toggle.component';
import { WishlistService } from '@app/service/wishlist.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog, MatButtonToggleGroup } from '@angular/material';
import { ClipboardService } from 'ngx-clipboard';
import { NotificationService } from '@app/service/notification.service';

// DONE equip gear
// DONE transfer gear
// DONE sort (light, masterwork tier, mod, quantity)
// DONE lock unlock gear
// DONE is random roll
// DONE count dupes 
// DONE improve search text to include perks
// DONE hard coded wishlist

// DONE show class for armor
// DONE filter UI


// DONE compare all like items in modal
// DONE tagging in modal
// DONE hide junk checkbox in modal
// DONE fix stats layout
// DONE make work in mobile

// DONE refresh filter aftre transfer
// DONE auto process locking items
// DONE shard mode

// DONE Fix BLAH, remove "copies" from mobile, remove <code>
// DONE shardit keepit copy paste
// DONE option to highlight any god perks
// DONE wish list configurability
// DONE upgrade like names, and fix armor utilities
// DONE update filter after shard mode
// DONE default check non god roll perks
// DONE sort copies by light level

// TODO show type name on item details

@Component({
  selector: 'anms-gear',
  templateUrl: './gear.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearComponent extends ChildComponent implements OnInit, AfterViewInit {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  filtering = false;

  readonly markChoices: Choice[] = [
    new Choice("upgrade", "Upgrade"),
    new Choice("keep", "Keep"),
    new Choice("infuse", "Infuse"),
    new Choice("junk", "Junk"),
    new Choice(null, "Unmarked")
  ];


  readonly classTypeChoices: Choice[] = [
    new Choice(ClassAllowed.Titan + "", "Titan"),
    new Choice(ClassAllowed.Warlock + "", "Warlock"),
    new Choice(ClassAllowed.Hunter + "", "Hunter"),
    new Choice(ClassAllowed.Any + "", "Any"),
  ];
  readonly equippedChoices: Choice[] = [
    new Choice("true", "Equipped"),
    new Choice("false", "Not Equipped")
  ];
  weaponTypeChoices: Choice[] = [];
  armorTypeChoices: Choice[] = [];
  modTypeChoices: Choice[] = [];
  consumableTypeChoices: Choice[] = [];
  exchangeTypeChoices: Choice[] = [];
  ownerChoices: Choice[] = [];
  rarityChoices: Choice[] = [];

  @ViewChild('optionsgroup')
  public optionsgroup: MatButtonToggleGroup;

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
  @ViewChild('equippedToggle')
  public equippedToggle: GearToggleComponent;
  @ViewChild('rarityToggle')
  public rarityToggle: GearToggleComponent;

  filters: GearToggleComponent[] = [];
  filtersDirty: boolean = false;
  filterNotes: string[] = [];


  private static HIGHLIGHT_ALL_PERKS_KEY = "highlightAllPerks";
  private static WISHLIST_OVERRIDE_URL_KEY = "wishlistOverrideUrl";
  public wishlistOverrideUrl;
  public highlightAllPerks = true;

  private filterChangedSubject: Subject<void> = new Subject<void>();
  private noteChanged: Subject<InventoryItem> = new Subject<InventoryItem>();

  selectedUser: SelectedUser = null;
  player: Player = null;
  visibleFilterText = null;
  @ViewChild('filter') filter: ElementRef;
  filterText: string = null;
  options = [
    { name: 'Weapons', type: ItemType.Weapon },
    { name: 'Armor', type: ItemType.Armor },
    { name: 'Ghosts', type: ItemType.Ghost },
    { name: 'Vehicles', type: ItemType.Vehicle },
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
    this.filtering = true;
    this.filterChangedSubject.next();
  }

  resetFilters(): void {
    this.filter.nativeElement.value = "";
    this.visibleFilterText = null;
    this.filterText = null;
    for (const toggle of this.filters) {
      toggle.selectAll(true);
    }
    this.filterChanged();

  }

  copyToClipboard(i: InventoryItem) {
    let markup = "**" + i.name + "**\n\n";
    for (const socket of i.sockets) {
      markup += "\n\n* ";
      for (const plug of socket.plugs) {
        markup += plug.name;
        if (plug !== socket.plugs[socket.plugs.length - 1]) {
          markup += " / "
        }
      }
    }
    markup += "\n\n";
    if (i.masterwork != null) {
      markup += "\n\n* *Masterwork: " + i.masterwork.name + " " + i.masterwork.tier + "*";
    }
    if (i.mod != null) {
      markup += "\n\n* *Mod: " + i.mod.name + "*";
    }
    console.log(markup);
    this.clipboardService.copyFromContent(markup);
    this.notificationService.success("Copied " + i.name + " to clipboard");
  }


  constructor(storageService: StorageService, private bungieService: BungieService,
    public markService: MarkService,
    public gearService: GearService,
    private wishlistSerivce: WishlistService,
    private clipboardService: ClipboardService,
    private notificationService: NotificationService,
    public dialog: MatDialog) {
    super(storageService);
    this.loading = true;
    if (localStorage.getItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY) == "false") {
      this.highlightAllPerks = false;
    }
    const wishlistOverrideUrl = localStorage.getItem(GearComponent.WISHLIST_OVERRIDE_URL_KEY);
    if (wishlistOverrideUrl != null) {
      this.wishlistOverrideUrl = wishlistOverrideUrl;
    }
  }

  public updateHighlightAllPerks() {
    if (this.highlightAllPerks == false) {
      localStorage.setItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY, "false");
    }
    else {
      localStorage.removeItem(GearComponent.HIGHLIGHT_ALL_PERKS_KEY);
    }
  }



  public async updateWishlistOverrideUrl(newVal: string) {
    //just reload the page if this works, easier then worrying about it
    if (newVal == null) {
      localStorage.removeItem(GearComponent.WISHLIST_OVERRIDE_URL_KEY);
      location.reload();
      return;
    }
    const tempRolls = await this.wishlistSerivce.load(newVal);
    if (tempRolls.length > 0) {
      //validate URL
      localStorage.setItem(GearComponent.WISHLIST_OVERRIDE_URL_KEY, newVal);
      this.wishlistOverrideUrl = newVal;
      await this.loadWishlist();
      location.reload();
    }
  }

  public async syncLocks() {
    await this.load();
    await this.gearService.processGearLocks(this.player);
    this.filterChanged();
  }

  public async transfer(player: Player, itm: InventoryItem, target: Target) {
    try {
      await this.gearService.transfer(player, itm, target);
    }
    catch (e) {
      this.notificationService.fail(e);
    }
    this.filterChanged();
  }

  public async equip(player: Player, itm: InventoryItem) {
    await this.gearService.equip(player, itm);
    this.filterChanged();
  }

  itemNotesChanged(item: InventoryItem) {
    this.noteChanged.next(item);
  }

  mark(marking: string, item: InventoryItem) {
    if (marking === item.mark) marking = null;
    item.mark = marking;
    this.markService.updateItem(item);
    this.filterChanged();
  }

  showCopies(i: InventoryItem) {
    const copies = this.gearService.findCopies(i, this.player);
    this.openGearDialog(copies);
  }

  showItem(i: InventoryItem) {
    this.openGearDialog([i]);
  }

  sort(val: string) {
    if (val == this.sortBy) {
      this.sortDesc = !this.sortDesc;
    }
    else {
      this.sortBy = val;
      this.sortDesc = true;
    }
    this.filterChanged();
  }

  filterItem(i: InventoryItem): boolean {
    if (i.searchText.indexOf(this.filterText) >= 0) return true;
    if (i.notes != null && i.notes.indexOf(this.filterText) >= 0) return true;
    return false;
  }

  private appendFilterNote(key, val) {
    this.filterNotes.push(key + " <" + this.filterText + ">");
  }

  private wildcardFilter(gear: InventoryItem[]): InventoryItem[] {
    if (this.filterText != null && this.filterText.trim().length > 0) {
      this.filterNotes.push("wildcard = " + this.filterText);
      return gear.filter(this.filterItem, this);
    }
    else {
      return gear;
    }
  }

  checkFilterDirty() {
    if (this.filterText != null && this.filterText.trim().length > 0) return true;
    for (const toggle of this.filters) {
      if (!toggle.isAllSelected) return true;
    }
    return false;
  }

  private appendToggleFilterNote(t: GearToggleComponent) {
    if (t == null) return;
    const note = t.getNotes();
    if (note != null) {
      this.filterNotes.push(note);
    }
  }

  private appendToggleFilterNotes() {
    this.appendToggleFilterNote(this.markToggle);
    this.appendToggleFilterNote(this.weaponTypeToggle);
    this.appendToggleFilterNote(this.armorTypeToggle);
    this.appendToggleFilterNote(this.modTypeToggle);
    this.appendToggleFilterNote(this.consumableTypeToggle);
    this.appendToggleFilterNote(this.exchangeTypeToggle);
    this.appendToggleFilterNote(this.ownerToggle);
    this.appendToggleFilterNote(this.equippedToggle);
    this.appendToggleFilterNote(this.rarityToggle);
    this.appendToggleFilterNote(this.classTypeToggle);
  }

  private toggleFilterSingle(i: InventoryItem, report: any): boolean {

    if (!this.markToggle.isChosen(this.option.type, i.mark)) { 
      const key = "mark";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.weaponTypeToggle.isChosen(this.option.type, i.typeName)) { 
      const key = "weaponType";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.armorTypeToggle.isChosen(this.option.type, i.typeName)) { 
      const key = "armorType";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.modTypeToggle.isChosen(this.option.type, i.typeName)) { 
      const key = "modType";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.consumableTypeToggle.isChosen(this.option.type, i.typeName)) { 
      const key = "consumableType";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.exchangeTypeToggle.isChosen(this.option.type, i.typeName)) { 
      const key = "exchangeType";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.ownerToggle.isChosen(this.option.type, i.owner.id)) { 
      const key = "owner";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.equippedToggle.isChosen(this.option.type, ""+i.equipped)) { 
      const key = "equipped";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.rarityToggle.isChosen(this.option.type, i.tier)) { 
      const key = "rarity";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    if (!this.classTypeToggle.isChosen(this.option.type, i.classAllowed)) { 
      const key = "classType";
      if (report[key]==null){
        report[key] = 0;
      }
      report[key] = report[key] + 1;
      return false; 
    }
    return true;
  }

  private toggleFilter(gear: InventoryItem[]): InventoryItem[] {
    // hit it with a hammer, owner and rarity are fine
    this.markToggle.setCurrentItemType(this.option.type);
    this.weaponTypeToggle.setCurrentItemType(this.option.type);
    this.armorTypeToggle.setCurrentItemType(this.option.type);
    this.modTypeToggle.setCurrentItemType(this.option.type);
    this.consumableTypeToggle.setCurrentItemType(this.option.type);
    this.exchangeTypeToggle.setCurrentItemType(this.option.type);
    this.ownerToggle.setCurrentItemType(this.option.type);
    this.equippedToggle.setCurrentItemType(this.option.type);
    this.rarityToggle.setCurrentItemType(this.option.type);
    this.classTypeToggle.setCurrentItemType(this.option.type);


    this.appendToggleFilterNotes();
    const returnMe: InventoryItem[] = [];
    const report: any = {}
    for (const i of gear) {
      if (this.toggleFilterSingle(i, report)) {
        returnMe.push(i);
      }
    }
    
    // console.log("Filter report: ");
    // for (const key in report){
    //   console.log("    "+key+": "+report[key]);
    // }
    return returnMe;
  }

  filterGear() {
    // console.log("Filter gear: Previous length " + this.gearToShow.length)
    this.filterNotes = [];
    if (this.player == null) return;
    let tempGear = this.player.gear.filter(i => i.type == this.option.type);
    tempGear = this.wildcardFilter(tempGear);
    // console.log("After wildcard: " + tempGear.length);
    tempGear = this.toggleFilter(tempGear);
    // console.log("After toggle: " + tempGear.length);
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
        try {
          const aV = a[this.sortBy] != null ? a[this.sortBy] : "";
          const bV = b[this.sortBy] != null ? b[this.sortBy] : "";

          if (aV < bV) {
            return this.sortDesc ? 1 : -1;
          } else if (aV > bV) {
            return this.sortDesc ? -1 : 1;
          } else {
            return 0;
          }
        }
        catch (e) {
          console.log("Error sorting: " + e);
          return 0;
        }
      });
    }
    if (this.size > 0)
      this.gearToShow = tempGear.slice(0, this.size);
    else
      this.gearToShow = tempGear.slice(0);

    this.total = tempGear.length;
    console.log("Gear to show current length: " + this.gearToShow.length);
  }

  public async shardMode() {
    await this.load();
    await this.gearService.shardMode(this.player);
    this.filterChanged();
  }

  public async upgradeMode() {
    await this.load();
    await this.gearService.upgradeMode(this.player);
    this.filterChanged();
  }

  public async load(initialLoad?: boolean) {
    this.loading = true;

    if (initialLoad != true) {
      this.notificationService.info("Loading gear...");
    }
    try {
      if (this.selectedUser == null) {
        this.player = null;
      }
      else {
        this.player = await this.gearService.loadGear(this.selectedUser);
      }
      this.generateChoices();
      this.filterChanged();
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
    await this.wishlistSerivce.init(this.wishlistOverrideUrl);
    if (this.player != null)
      this.wishlistSerivce.processItems(this.player.gear);
    this.filterChanged();
  }


  ngAfterViewInit() {
    this.filters.push(this.markToggle);
    this.filters.push(this.weaponTypeToggle);
    this.filters.push(this.armorTypeToggle);
    this.filters.push(this.modTypeToggle);
    this.filters.push(this.consumableTypeToggle);
    this.filters.push(this.exchangeTypeToggle);
    this.filters.push(this.ownerToggle);
    this.filters.push(this.equippedToggle);
    this.filters.push(this.rarityToggle);
    this.filters.push(this.classTypeToggle);
  }

  public showArmorPerks(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    const dialogRef = this.dialog.open(ArmorPerksDialogComponent, dc);
  }

  public showUtilities(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.data = {
      parent: this,
    };
    const dialogRef = this.dialog.open(GearUtilitiesDialogComponent, dc);
  }

  public openGearDialog(items: InventoryItem[]): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    //dc.autoFocus = true;
    //dc.width = '500px';
    dc.data = {
      parent: this,
      items: items
    };
    const dialogRef = this.dialog.open(GearDetailsDialogComponent, dc);
  }



  public showWildcardHelp(): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;

    dc.data = {
    };
    const dialogRef = this.dialog.open(GearHelpDialogComponent, dc);
  }

  ngOnInit() {
    // selected user changed
    this.bungieService.selectedUserFeed.pipe(takeUntil(this.unsubscribe$)).subscribe((selectedUser: SelectedUser) => {
      this.selectedUser = selectedUser;
      this.loadMarks();
      this.load(true);
    });
    this.loadWishlist();

    this.filterChangedSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filtersDirty = this.checkFilterDirty();
        try {
          this.option = this.optionsgroup.value;
          this.filterGear();
        }
        catch (e) {
          console.log("Error filtering: " + e);
        }
        this.filtering = false;
      });


    this.noteChanged.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(100))
      .subscribe(itm => {
        this.markService.updateItem(itm);
      });

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


@Component({
  selector: 'anms-gear-details-dialog',
  templateUrl: './gear-details-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearDetailsDialogComponent {
  ItemType = ItemType;
  hideJunk = false;
  items: InventoryItem[];
  parent: GearComponent
  constructor(
    public dialogRef: MatDialogRef<GearDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.items = data.items;
    this.parent = data.parent;

  }
}

@Component({
  selector: 'anms-armor-perks-dialog',
  templateUrl: './armor-perks-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class ArmorPerksDialogComponent {
  parent: GearComponent
  tempWishlistOverrideUrl: string;
  WishlistService = WishlistService;
  constructor(
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
  }

  public getPerks(char: Character, gear: InventoryItem[]): InventoryPlug[]{
    const activePerks: InventoryPlug[] = [];
    for(const g of gear){
      if (g.type!=ItemType.Armor) continue;
      if (!g.equipped) continue;
      if (g.owner.id != char.id) continue;
      for (const s of g.sockets){
        for (const p of s.plugs){
          if (!p.active) continue;
          if (p.name.endsWith("Armor")) continue;
          if (p.name.endsWith("Mod")) continue;
          activePerks.push(p);
        }
      }
    }
    const perkSet = {};
    for (const p of activePerks){
      if (perkSet[p.name]==null){
        perkSet[p.name] = {
          perk: p,
          count: 0
        };
      }
      perkSet[p.name].count = perkSet[p.name].count+1;
    }
    const returnMe = [];
    for (const key in perkSet){
      returnMe.push(perkSet[key]);
    }
    returnMe.sort(function (a, b) {
      if (a.perk.name < b.perk.name)
        return -1;
      if (a.perk.name > b.perk.name)
        return 1;
      return 0;
    });
    return returnMe;
  }

}

@Component({
  selector: 'anms-gear-utilities-dialog',
  templateUrl: './gear-utilities-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearUtilitiesDialogComponent {
  parent: GearComponent
  tempWishlistOverrideUrl: string;
  WishlistService = WishlistService;
  constructor(
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
  }
}


@Component({
  selector: 'anms-gear-help-dialog',
  templateUrl: './gear-help-dialog.component.html',
  styleUrls: ['./gear.component.scss']
})
export class GearHelpDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<GearHelpDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }

}