import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounty-shopping-list-container',
  templateUrl: './bounty-shopping-list-container.component.html',
  styleUrls: ['./bounty-shopping-list-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountyShoppingListContainerComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly shoppingListHashes$: BehaviorSubject<{ [key: string]: boolean }> = new BehaviorSubject({});
  public charId$ = new BehaviorSubject<string|null>(null);

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    public router: Router,
    storageService: StorageService
  ) {
    super(storageService);
    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          let sl = x.shoppinglist as { [key: string]: boolean };
          sl = sl ? sl : {};
          this.shoppingListHashes$.next(sl);
        });
  }


  ngOnInit(): void {
  }

  onToggleVendorBounty(hash: string) {
    const slh = this.shoppingListHashes$.getValue();
    let newVal = true;
    if (slh && slh[hash] === true) {
      newVal = false;
    }
    if (!newVal) {
      this.storageService.untrackHashList('shoppinglist', hash);
    } else {
      this.storageService.trackHashList('shoppinglist', hash);
    }
  }

}
