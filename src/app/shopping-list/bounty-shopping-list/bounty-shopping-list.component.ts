import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { BountySet, Character, CharacterVendorData, InventoryItem, Player, SelectedUser, TAG_WEIGHTS } from '@app/service/model';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounty-shopping-list',
  templateUrl: './bounty-shopping-list.component.html',
  styleUrls: ['./bounty-shopping-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountyShoppingListComponent implements OnInit, OnDestroy {
  unsubscribe$: Subject<void> = new Subject<void>();
  public char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public charBountySets$ = new BehaviorSubject<BountySet[]>([]);
  public vendorBountySets$ = new BehaviorSubject<BountySet[]>([]);
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

  constructor(
    public iconService: IconService,
    private destinyCacheService: DestinyCacheService,

  ) {
    combineLatest([this.char$, this.vendorData$]).pipe(
      takeUntil(this.unsubscribe$),
      filter(([char, vendorData]) => char != null && vendorData != null),
      distinctUntilChanged()
    ).subscribe(([char, vendorData]) => {
      console.log(`update ${char.characterId} ${vendorData.length}`);
      const selected = vendorData.find(x => x?.char.id == char.id);
      // TODO hideCompletePursuits
      const c = this.groupCharBounties(this.player, char, false);
      this.charBountySets$.next(c);
      if (selected) {
        const v = this.groupVendorBounties(selected.data);
        this.vendorBountySets$.next(v);
      }
    });
  }

  ngOnInit(): void {
  }

  public groupCharBounties(player: Player, char: Character, hideCompletePursuits: boolean): BountySet[] {
    if (!player) {
      return [];
    }
    const bounties = [];
    for (const i of player.bounties) {
      if (i.owner.getValue().id === char.id) {
        if (!hideCompletePursuits || (hideCompletePursuits && i.aggProgress < 100)) {
          bounties.push(i);
        }
      }
    }
    return this.groupBounties('held', bounties);
  }

  private groupVendorBounties(saleItems: InventoryItem[]): BountySet[] {
    const available = saleItems.filter(x => x.vendorItemInfo.status != 'Already completed');
    return this.groupBounties('sale', available);
  }

  private groupBounties(type: string, bounties: InventoryItem[]): BountySet[] {
    const tags = this.destinyCacheService.cache.PursuitTags!;
    const tagSet: { [key: string]: (InventoryItem)[] } = {};
    const used = {};
    for (const s of bounties) {
      if (!tags[s.hash]) {
        continue;
      }
      // don't double count bounties, werner-99 has an issue with this
      if (used[s.hash]) {
        continue;
      }
      // ignore expired bounties
      if ((s as InventoryItem).expired) {
        continue;
      }
      used[s.hash] = true;
      const itemTags = tags[s.hash];
      s.tags = itemTags.slice(0);
      for (const t of itemTags) {
        if (!tagSet[t]) {
          tagSet[t] = [];
        }
        tagSet[t].push(s);
      }
    }
    const returnMe: BountySet[] = [];
    for (const key of Object.keys(tagSet)) {
      let score = tagSet[key].length;
      if (TAG_WEIGHTS[key]) {
        score *= TAG_WEIGHTS[key];
      }
      returnMe.push({
        type: type,
        tag: key,
        bounties: tagSet[key],
        score: score
      });
    }
    returnMe.sort((a, b) => {
      if (a.score > b.score) {
        return -1;
      } else if (a.score < b.score) {
        return 1;
      }
      if (a.tag < b.tag) {
        return -1;
      }
      if (b.tag < a.tag) {
        return 1;
      }
      return 0;
    });
    return returnMe;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
