
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { Character, ClassAllowed, ItemType, Player, SaleItem, SelectedUser } from '@app/service/model';
import { ParseService } from '@app/service/parse.service';
import { PreferredStatService } from '@app/service/preferred-stat.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { VendorService } from '@app/service/vendor.service';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, fromEvent as observableFromEvent, of as observableOf } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResourcesComponent extends ChildComponent implements OnInit, OnDestroy {
  public today =  moment(new Date());
  readonly shoppingListHashes: BehaviorSubject<{ [key: string]: boolean }> = new BehaviorSubject({});

  @ViewChild('filter', {static: true}) filter: ElementRef;
  selectedUser: SelectedUser = null;
  player: Player = null;
  char: Character = null;

  public vendorData: BehaviorSubject<SaleItem[]> = new BehaviorSubject([]);
  public filterText$: BehaviorSubject<string> = new BehaviorSubject(null);
  public hideCompleted$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  options = ['Bounties', 'Weapons', 'Armor', 'Mods', 'Exchange', 'Cosmetics'];
  option = this.options[0];

  ItemType = ItemType;
  ClassAllowed = ClassAllowed;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private signedOnUserService: SignedOnUserService,
    private vendorService: VendorService,
    public parseService: ParseService,
    public preferredStatService: PreferredStatService,
    public iconService: IconService,
    private route: ActivatedRoute, public router: Router) {
    super(storageService);

    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          let sl = x.shoppinglist as { [key: string]: boolean };
          sl = sl ? sl : {};
          this.shoppingListHashes.next(sl);
        });

    this.loading.next(true);
  }

  public navigateStuff(val: string) {
    this.router.navigate(['vendors', this.char.characterId, val]);
  }

  public includeItem(itm: SaleItem, filterText: string, hideCompleted?: boolean): boolean {
    if (hideCompleted && itm.status === 'Already completed') {
      return false;
    }
    if (filterText == null) { return true; }
    return itm.searchText.indexOf(filterText) >= 0;
  }
  selectVendorBounty(i: SaleItem) {
    const x = i as any;
    const slh = this.shoppingListHashes.getValue();
    let newVal = true;
    if (slh && slh[i.hash] === true) {
      newVal = false;
    }
    if (!newVal) {
      this.storageService.untrackHashList('shoppinglist', i.hash);
    } else {
      this.storageService.trackHashList('shoppinglist', i.hash);
    }
  }

  public async setChar(c: Character, alreadyLoading: boolean) {
    if (c == null) {
      this.char = null;
      this.vendorData.next([]);
      if (!alreadyLoading) {
        this.loading.next(false);
      }
      return;
    }
    if (!alreadyLoading) {
      this.loading.next(true);
    }
    try {
      if (this.char != null && this.char.characterId === c.characterId && this.vendorData.value.length > 0) {
        // we're already here, nothing to load
      } else {
        this.char = c;
        // Testing out new service approach
        // this.vendorService.loadVendors(c).subscribe((x) => {
        //   console.log("loaded vendor");
        //   console.dir(x);
        // });
        const data = await this.bungieService.loadVendors(c);
        this.preferredStatService.processSaleItems(data);
        this.parseService.applyTags(data);
        this.vendorData.next(data);
      }
    }
    finally {
      if (!alreadyLoading) {
        this.loading.next(false);
      }
    }
  }

  private async load(d: LoadInfo) {
    this.loading.next(true);
    try {
      if (d == null || d.user == null) {
        this.player = null;
        this.setChar(null, false);
        this.option = this.options[0];
        return;
      }
      this.selectedUser = d.user;
      if (d.tab != null) {
        let found = false;
        for (const o of this.options) {
          if (d.tab.toUpperCase() === o.toUpperCase()) {
            this.option = o;
            found = true;
            break;
          }
        }
        // bad option route
        if (!found) {
          this.router.navigate(['vendors', d.characterId]);
          return;
        }
      }
      this.selectedUser = d.user;
      if (this.player != null && this.player.profile.userInfo.membershipId === this.selectedUser.userInfo.membershipId) {

      } else {
        this.player = await this.bungieService.getChars(this.selectedUser.userInfo.membershipType,
          this.selectedUser.userInfo.membershipId, ['Profiles', 'Characters']);
      }
      if (d.characterId != null) {
        let found = false;
        for (const c of this.player.characters) {
          if (d.characterId.toUpperCase() === c.characterId) {
            await this.setChar(c, true);
            found = true;
            break;
          }
        }
        // bad character route
        if (!found) {
          this.router.navigate(['vendors']);
          return;
        }
      } else {
        this.router.navigate(['vendors', this.player.characters[0].characterId]);
        return;
        // await this.setChar(this.player.characters[0], true);
      }



    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() {

    observableFromEvent(this.filter.nativeElement, 'keyup').pipe(
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

    combineLatest([this.signedOnUserService.signedOnUser$, this.route.paramMap, this.route.url]).pipe(
      switchMap(([selectedUser, params, url]) => {
        return observableOf({
          user: selectedUser,
          characterId: params.get('characterId'),
          tab: params.get('tab')
        });
      }
      ),
      catchError(() => {
        return observableOf(null);
      }),
      takeUntil(this.unsubscribe$)
    )
      .subscribe((d: LoadInfo) => {
        if (this.char != null && d.characterId == this.char.characterId && this.selectedUser == d.user) {
          this.option = d.tab;
        } else {
          this.load(d);
        }
      });
  }
}

interface LoadInfo {
  user: SelectedUser;
  characterId: string;
  tab: string;
}
