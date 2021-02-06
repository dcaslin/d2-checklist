import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { BountySet, InventoryItem, TAG_WEIGHTS } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounty-sets-dialog',
  templateUrl: './bounty-sets-dialog.component.html',
  styleUrls: ['./bounty-sets-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountySetsDialogComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly shoppingListHashes$: BehaviorSubject<{ [key: string]: boolean }> = new BehaviorSubject({});
  readonly bounties$: BehaviorSubject<(InventoryItem)[]> = new BehaviorSubject([]);
  readonly name$: BehaviorSubject<string> = new BehaviorSubject(null);

  readonly TAG_WEIGHTS: {[key: string]: number} = TAG_WEIGHTS;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public signedOnUserService: SignedOnUserService,
    public dialogRef: MatDialogRef<BountySetsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public input: BountySetInfo) {
    super(storageService);
    this.storageService.settingFeed.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        x => {
          let sl = x.shoppinglist as { [key: string]: boolean };
          sl = sl ? sl : {};
          this.shoppingListHashes$.next(sl);
        });

    input.modalBountySet$.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        data => {
          if (!data) {
            return;
          }
          this.name$.next(data.tag);
          const sortedBounties = data.bounties.slice(0).sort((vA, vB) => {
            if (vA.vendorItemInfo && !vB.vendorItemInfo) {
              return 1;
            } else if (!vA.vendorItemInfo && vB.vendorItemInfo) {
              return -1;
            } else if (vA.vendorItemInfo && vB.vendorItemInfo) {
              if (vA.vendorItemInfo.vendor.name > vB.vendorItemInfo.vendor.name) {
                return 1;
              } else if (vA.vendorItemInfo.vendor.name < vB.vendorItemInfo.vendor.name) {
                return -1;
              }
            }
            if (vA.name > vB.name) {
              return 1;
            } else if (vA.name < vB.name) {
              return -1;
            }
            return 0;
          });
          this.bounties$.next(sortedBounties);
        });


    combineLatest([this.signedOnUserService.playerLoading$, this.signedOnUserService.vendorsLoading$]).pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(([x, y]) => {
        this.loading.next(x || y);
      });
  }

  selectVendorBounty(i: InventoryItem) {    
    const slh = this.shoppingListHashes$.getValue();
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

  ngOnInit() {
  }

}


export interface BountySetInfo {
  readonly modalBountySet$: BehaviorSubject<BountySet>;
}
