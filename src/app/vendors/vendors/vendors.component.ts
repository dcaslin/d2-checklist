import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { Character, CharacterVendorData, InventoryItem, ItemType, Player, SelectedUser } from '@app/service/model';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'd2c-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorsComponent implements OnInit {
  @ViewChild('filter', {static: true}) filter: ElementRef;


  public options: VendorChoice[] = [
    {text: 'Bounties', icon: this.iconService.farGift, types: [ItemType.Bounty] },
    {text: 'Weapons', icon: this.iconService.farAxeBattle, types: [ItemType.Weapon]},
    {text: 'Armor', icon: this.iconService.farHelmetBattle, types: [ItemType.Armor]},
    {text: 'Mods', icon: this.iconService.farCog, types: [ItemType.GearMod]},
    {text: 'Exchange', icon: this.iconService.farBalanceScale, types: [ItemType.ExchangeMaterial, ItemType.CurrencyExchange] },
    {text: 'Cosmetics', icon: this.iconService.farPalette, types: [ItemType.Ship, ItemType.Vehicle, ItemType.Emote, ItemType.Ghost] }];

  public filterText$: BehaviorSubject<string> = new BehaviorSubject(null);
  public hideCompleted$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public option$: BehaviorSubject<VendorChoice> = new BehaviorSubject(this.options[0]);

  private _player: Player;

  @Input()
  public set player(val: Player) {
    this._player = val;
    if (val && val.characters && val.characters.length > 0) {
      this.char$.next(val.characters[0]);
    }
  }

  public get player() {
    return this._player;
  }

  @Input() currUser: SelectedUser;
  @Input() vendorData: CharacterVendorData[];
  @Input() shoppingListHashes: { [key: string]: boolean };
  @Input() loading: boolean;


  constructor(
    public iconService: IconService) { }

  ngOnInit(): void {
    fromEvent(this.filter.nativeElement, 'keyup').pipe(
      debounceTime(150),
      distinctUntilChanged(), )
      .subscribe(() => {
        const val: string = this.filter.nativeElement.value;
        if (val == null || val.trim().length === 0) {
          this.filterText$.next(null);
        } else {
          this.filterText$.next(val.toLowerCase());
        }
      });
  }

  public updateData() {

  }

  public getData(): InventoryItem[] {
    console.log('Get data');
    if (!this.char || !this.vendorData || !this.option) {
      return [];
    }
    const selected = this.vendorData.find(x => x.char = this.char);
    if (!selected) {
      return [];
    }

    return selected.data.filter((item: InventoryItem) => {
      if (!this.option.types.includes(item.type)) {
        return false;
      }
      return true;
    });
  }

}

interface VendorChoice {
  text: string;
  icon: IconDefinition;
  types: ItemType[];
  vendorHashes?: string[];
}
