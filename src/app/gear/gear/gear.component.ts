import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { Router, ActivatedRoute } from '@angular/router';
import { fromEvent as observableFromEvent, Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Player, InventoryItem, SelectedUser, ItemType, DamageType, ClassAllowed, Character, Target, Vault } from '@app/service/model';
import { BungieService } from '@app/service/bungie.service';
import { MarkService, Marks } from '@app/service/mark.service';
import { BucketService, Bucket } from '@app/service/bucket.service';

// DONE equip gear
// DONE transfer gear
// TODO count dupes and show in window
// TODO lock unlock gear
// TODO compare all like items in modal
// TODO stats modal
// TODO auto process locking items
// TODO sort (light, masterwork tier, mod, quantity)
// TODO filter UI
// TODO is random roll
// weap & armor global: tags, owner, rarity, 20/50/100/All rows
// weap: type,
// armor: type, class

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


  gear: InventoryItem[] = [];
  gearToShow: InventoryItem[] = [];
  total: number = 0;

  ItemType = ItemType;
  DamageType = DamageType;

  constructor(storageService: StorageService, private bungieService: BungieService,
    public markService: MarkService, private bucketService: BucketService,
    private route: ActivatedRoute, private router: Router) {
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


  filterGear() {
    let tempGear = this.gear.filter(i => i.type == this.option.type);
    if (this.filterText != null && this.filterText.trim().length > 0) {
      tempGear = tempGear.filter(i => i.searchText.indexOf(this.filterText) >= 0);
    }
    this.total = tempGear.length;
    this.gearToShow = tempGear.slice(0, 20);
  }


  public canEquip(itm: InventoryItem){
    if (!itm.canEquip) return false;
    if (itm.equipped == true) return false;
    if (itm.classAllowed === ClassAllowed.Any) return true;
    //vault and shared can't equip
    if (!(itm.owner instanceof Character)) return false;
    if (ClassAllowed[itm.classAllowed] === (itm.owner as Character).className)
      return true;
    return false;
  }


  public async transfer(itm: InventoryItem, target: Target):Promise<boolean> {

    try {
      this.loading = true;

      //equip something else from our bucket, if we can
      if (itm.equipped){
        let equipMe: InventoryItem = this.bucketService.getBucket(itm.owner, itm.inventoryBucket).otherItem(itm);
        if (equipMe==null){
          throw new Error("Nothing to equip to replace "+itm.name);
        }
        const equipSuccess = this.equip(equipMe);
        if (!equipSuccess){
          return false;
        }
      }
      //if the target is the vault, we just need to put it there
      let success;
      if (target instanceof Vault){
        success = await this.bungieService.transfer(this.selectedUser.userInfo.membershipType, 
          itm.owner, itm, true);
        if (success){
          itm.options.push(itm.owner);
          itm.owner = this.player.vault;
          itm.options.splice(itm.options.indexOf(itm.owner), 1);
        }
      }
      //if it's in the vault, we just need to pull it out to our char
      else if (itm.owner instanceof Vault){
        success = await this.bungieService.transfer(this.selectedUser.userInfo.membershipType, 
          target, itm, false);
        if (success){
          itm.options.push(itm.owner);
          itm.owner = target;
          itm.options.splice(itm.options.indexOf(itm.owner), 1);
        }
      }
      //otherwise we need to put it in vault, then pull it again
      else{
        success = await this.bungieService.transfer(this.selectedUser.userInfo.membershipType, itm.owner, itm, true);
        if (success){
          itm.options.push(itm.owner);
          itm.owner = this.player.vault;
          itm.options.splice(itm.options.indexOf(itm.owner), 1);
        }
        success = await this.bungieService.transfer(this.selectedUser.userInfo.membershipType, target, itm, false);
        if (success){
          itm.options.push(itm.owner);
          itm.owner = target;
          itm.options.splice(itm.options.indexOf(itm.owner), 1);
        }
      }
    }
    finally{ 
      itm.canReallyEquip = this.canEquip(itm);
      this.loading = false;
    }
  }


  public async equip(itm: InventoryItem): Promise<boolean> {
    try {
      this.loading = true;
      const success = await this.bungieService.equip(this.selectedUser.userInfo.membershipType, itm);
      if (success === true) {
        const bucket: Bucket = this.bucketService.getBucket(itm.owner, itm.inventoryBucket);
        const oldEquipped = bucket.equipped;
        oldEquipped.equipped = false;
        itm.equipped = true;
        bucket.equipped = itm;
        itm.equipped = true;

        itm.canReallyEquip = this.canEquip(itm);
        oldEquipped.canReallyEquip = this.canEquip(oldEquipped);
        return true;
      }
      return false;
    }
    finally{ 
      this.loading = false;
    }
  }

  public async load() {
    this.loading = true;
    try {
      if (this.selectedUser == null) {
        this.player = null;
        this.gear = [];
        this.filterGear();
        return;
      }
      this.player = await this.bungieService.getChars(this.selectedUser.userInfo.membershipType,
        this.selectedUser.userInfo.membershipId, ['Profiles', 'Characters',
          'CharacterEquipment', 'CharacterInventories', 'ItemObjectives',
          'ItemInstances', 'ItemPerks', 'ItemStats', 'ItemSockets', 'ItemPlugStates',
          'ItemTalentGrids', 'ItemCommonData', 'ProfileInventories'], false, true);
      this.gear = this.player.gear;
      for (const g of this.gear){
        g.canReallyEquip = this.canEquip(g);
      }
      this.bucketService.init(this.player.characters, this.player.vault, this.player.shared, this.player.gear);
      this.markService.processItems(this.gear);
      this.filterGear();
    }
    finally {
      this.loading = false;
    }
  }

  async loadMarks() {
    this.marks = await this.markService.loadPlayer(this.selectedUser.userInfo.membershipType,
      this.selectedUser.userInfo.membershipId);
    this.markService.processItems(this.gear);

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