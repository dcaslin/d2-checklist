import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { Character, CharacterVendorData, ClassAllowed, InventoryItem, ItemType, Player, SelectedUser } from '@app/service/model';
import { PreferredStatService } from '@app/service/preferred-stat.service';
import { StorageService } from '@app/service/storage.service';
import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, fromEvent, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounty-shopping-list',
  templateUrl: './bounty-shopping-list.component.html',
  styleUrls: ['./bounty-shopping-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountyShoppingListComponent implements OnInit {
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  private vendorData$: BehaviorSubject<CharacterVendorData[]> = new BehaviorSubject([]);

  @Input() debugmode: boolean;
  @Input() currUser: SelectedUser;
  @Input() shoppingListHashes: { [key: string]: boolean };
  @Input() loading: boolean;


  @Output() toggleVendorBounty = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();

  private _player: Player;

  @Input()
  public set player(val: Player) {
    this._player = val;
    if (val && val.characters && val.characters.length > 0) {
      this.char$.next(val.characters[0]);
    }
  }

  @Input()
  public set vendorData(val: CharacterVendorData[]) {
    this.vendorData$.next(val);
  }

  public get vendorData() {
    return this.vendorData$.getValue();
  }


  public get player() {
    return this._player;
  }

  constructor(public iconService: IconService) { }

  ngOnInit(): void {
  }

}
