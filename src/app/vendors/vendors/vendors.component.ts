import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { Character, CharacterVendorData, ClassAllowed, InventoryItem, ItemType, Player, SelectedUser } from '@app/service/model';
import { PreferredStatService } from '@app/service/preferred-stat.service';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { BehaviorSubject, combineLatest, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-vendors',
  templateUrl: './vendors.component.html',
  styleUrls: ['./vendors.component.scss']
})
export class VendorsComponent implements OnInit, OnDestroy {
  @ViewChild('filter', { static: true }) filter: ElementRef;


  public options: VendorChoice[] = [
    { text: 'Bounties', icon: this.iconService.farGift, types: [ItemType.Bounty] },
    { text: 'Weapons', icon: this.iconService.farAxeBattle, types: [ItemType.Weapon] },
    { text: 'Armor', icon: this.iconService.farHelmetBattle, types: [ItemType.Armor] },
    { text: 'Mods', icon: this.iconService.farCog, types: [ItemType.GearMod] },
    { text: 'Exchange', icon: this.iconService.farBalanceScale, types: [ItemType.ExchangeMaterial, ItemType.CurrencyExchange] },
    { text: 'Cosmetics', icon: this.iconService.farPalette, types: [ItemType.Ship, ItemType.Vehicle, ItemType.Emote, ItemType.Ghost, ItemType.Shader] }];


  public visibleFilterText: string = null;
  public filterText$: BehaviorSubject<string> = new BehaviorSubject(null);
  public hideCompleted$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public option$: BehaviorSubject<VendorChoice> = new BehaviorSubject(this.options[0]);
  public data$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);
  private vendorData$: BehaviorSubject<CharacterVendorData[]> = new BehaviorSubject([]);
  private unsubscribe$: Subject<void> = new Subject<void>();

  ItemType = ItemType;
  ClassAllowed = ClassAllowed;

  private _player: Player;


  @Input() debugmode: boolean;
  @Input() currUser: SelectedUser;
  @Input() loading: boolean;
  @Input() vendorsLoading: boolean;

  @Output() toggleVendorBounty = new EventEmitter<string>();
  @Output() charIdSelect = new EventEmitter<string>();
  @Output() tabSelect = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();


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

  @Input()
  public set charId(val: string) {
    if (this.player == null) {
      return;
    }
    if (!val) {
      return;
    }
    for (const c of this.player.characters) {
      if (c.characterId == val) {
        if (this.char$.getValue()?.characterId != val) {
          this.char$.next(c);
        }
      }
    }
  }

  // TODO add paging for render performance?

  @Input()
  public set tab(val: string) {

    console.log(`setTab(${val})`);
    if (!val) {
      return;
    }
    for (const o of this.options) {
      if (o.text.toUpperCase() === val.toUpperCase()) {
        this.option$.next(o);
        break;
      }
    }
  }

  @Input()
  public set vendorData(val: CharacterVendorData[]) {
    this.vendorData$.next(val);
  }

  public get vendorData() {
    return this.vendorData$.getValue();
  }

  constructor(
    public preferredStatService: PreferredStatService,
    public iconService: IconService) {
  }

  ngOnInit(): void {
    fromEvent(this.filter.nativeElement, 'keyup').pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(150),
      distinctUntilChanged())
      .subscribe(() => {
        const val: string = this.filter.nativeElement.value;
        if (val == null || val.trim().length === 0) {
          this.filterText$.next(null);
        } else {
          this.filterText$.next(val.toLowerCase());
        }
      });
    combineLatest([this.char$, this.option$, this.filterText$, this.hideCompleted$, this.vendorData$]).pipe(
      takeUntil(this.unsubscribe$),
      // debounceTime(150),
      distinctUntilChanged()
    ).subscribe(([char, option, filterText, hideCompleted, vendorData]) => {
      const data = VendorsComponent.filterData(char, option, filterText, hideCompleted, vendorData);
      console.log('Done filtering');
      this.data$.next(data);
    });
  }

  private static filterData(char: Character, option: VendorChoice, filterText: string,
    hideCompleted: boolean, vendorData: CharacterVendorData[]): InventoryItem[] {
    console.log('Filter data');
    // return [];
    if (!char || !vendorData || !option) {
      return [];
    }
    const selected = vendorData.find(x => x?.char.id == char.id);
    if (!selected) {
      return [];
    }

    return selected.data.filter((item: InventoryItem) => {
      if (!option.types.includes(item.type)) {
        return false;
      }
      if (filterText && filterText.length > 0) {
        if (item.vendorItemInfo.searchText.indexOf(filterText) < 0) {
          return false;
        }
      }
      if (hideCompleted && item.vendorItemInfo.status === 'Already completed') {
        return false;
      }
      return true;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


}

interface VendorChoice {
  text: string;
  icon: IconDefinition;
  types: ItemType[];
  vendorHashes?: string[];
}
