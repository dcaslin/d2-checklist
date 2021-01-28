import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { VendorLoadType } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-vendors-container',
  templateUrl: './vendors-container.component.html',
  styleUrls: ['./vendors-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorsContainerComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly shoppingListHashes$: BehaviorSubject<{ [key: string]: boolean }> = new BehaviorSubject({});
  public VendorLoadType = VendorLoadType;
  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
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


  selectVendorBounty(hash: string) {
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

  ngOnInit(): void {
    this.signedOnUserService.refreshVendors$.next(VendorLoadType.LoadIfNotAlready);
  }
}
