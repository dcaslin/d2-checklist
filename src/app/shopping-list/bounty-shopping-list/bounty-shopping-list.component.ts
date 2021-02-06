import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { BountySet, Character, CharacterVendorData, InventoryItem, Player, SelectedUser, TAG_WEIGHTS } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounty-shopping-list',
  templateUrl: './bounty-shopping-list.component.html',
  styleUrls: ['./bounty-shopping-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountyShoppingListComponent implements OnInit, OnDestroy, OnChanges {
  private readonly unsubscribe$: Subject<void> = new Subject<void>();
  public readonly char$: BehaviorSubject<Character> = new BehaviorSubject(null);
  public readonly charBountySets$ = new BehaviorSubject<BountySet[]>([]);
  public readonly vendorBountySets$ = new BehaviorSubject<BountySet[]>([]);
  private readonly vendorData$: BehaviorSubject<CharacterVendorData[]> = new BehaviorSubject([]);
  public readonly shoppingListChanged$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  private readonly modalBountySet$: BehaviorSubject<BountySet> = new BehaviorSubject(null);

  public readonly shoppingList$: BehaviorSubject<InventoryItem[]> = new BehaviorSubject([]);

  public readonly BOUNTY_CUTOFF = 4;

  public readonly showAllPlayerBounties$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public readonly showAllVendorBounties$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  @Input() debugmode: boolean;
  @Input() currUser: SelectedUser;
  @Input() shoppingListHashes: { [key: string]: boolean };
  @Input() loading: boolean;
  @Input() vendorsLoading: boolean;
  @Input() currentModalBountySet: BountySet;

  @Output() toggleVendorBounty = new EventEmitter<string>();
  @Output() clearShoppingList = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() showModalBountySet = new EventEmitter<BountySet>();


  @Input() player: Player;
  @Input() vendorData: CharacterVendorData[];

  constructor(
    public iconService: IconService,
    private destinyCacheService: DestinyCacheService,
    private signedOnUserService: SignedOnUserService

  ) {
    combineLatest([this.char$, this.vendorData$]).pipe(
      takeUntil(this.unsubscribe$),
      filter(([char, vendorData]) => char != null && vendorData != null),
      distinctUntilChanged()
    ).subscribe(([char, vendorData]) => {
      const selected = vendorData.find(x => x?.char.id == char.id);
      // TODO hideCompletePursuits
      const c = this.groupCharBounties(this.player, char, false);
      this.charBountySets$.next(c);
      if (selected) {
        const v = this.groupVendorBounties(selected.data);
        this.vendorBountySets$.next(v);
      }
    });
    combineLatest([this.vendorBountySets$, this.shoppingListChanged$]).pipe(
      takeUntil(this.unsubscribe$),
      filter(([vendorBountySets]) => vendorBountySets != null),
      distinctUntilChanged()
    ).subscribe(([vendorBountySets]) => {
      const shoppingList = BountyShoppingListComponent.buildShoppingList(this.shoppingListHashes, vendorBountySets);
      this.shoppingList$.next(shoppingList);
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('shoppingListHashes' in changes) {
      this.shoppingListChanged$.next(true);
    }
    if ('player' in changes) {
      const val = changes.player.currentValue;
      if (val && val.characters && val.characters.length > 0) {
        this.char$.next(val.characters[0]);
      }
    }
    if ('vendorData' in changes) {
      const val = changes.vendorData.currentValue;
      this.vendorData$.next(val);
    }
  }


  private groupCharBounties(player: Player, char: Character, hideCompletePursuits: boolean): BountySet[] {
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

  private static buildShoppingList(tracked: { [key: string]: boolean }, bountySets: BountySet[]): InventoryItem[] {
    if (!tracked) {
      return [];
    }
    if (bountySets.length == 0 || bountySets == null) {
      return [];
    }
    const used = {};
    const returnMe: InventoryItem[] = [];
    for (const bountySet of bountySets) {
      for (const bounty of bountySet.bounties) {
        if (tracked[bounty.hash] && !used[bounty.hash]) {
          returnMe.push(bounty as InventoryItem);
          used[bounty.hash] = true;
        }
      }
    }
    returnMe.sort((a, b) => {
      if (a.vendorItemInfo.vendor.name > b.vendorItemInfo.vendor.name) {
        return 1;
      }
      if (a.vendorItemInfo.vendor.name < b.vendorItemInfo.vendor.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
    });
    return returnMe;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
