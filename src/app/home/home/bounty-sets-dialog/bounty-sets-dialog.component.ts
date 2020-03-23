import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IconService } from '@app/service/icon.service';
import { BountySet, InventoryItem, SaleItem, TAG_WEIGHTS } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-bounty-sets-dialog',
  templateUrl: './bounty-sets-dialog.component.html',
  styleUrls: ['./bounty-sets-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BountySetsDialogComponent extends ChildComponent implements OnInit, OnDestroy {

  readonly bounties: BehaviorSubject<(SaleItem | InventoryItem)[]> = new BehaviorSubject(null);
  readonly name: BehaviorSubject<string> = new BehaviorSubject(null);
  readonly loading: BehaviorSubject<boolean> = new BehaviorSubject(false);

  readonly TAG_WEIGHTS: {[key: string]: number} = TAG_WEIGHTS;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<BountySetsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public input: BountySetInfo) {
    super(storageService);

    input.modalBountySet.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(
        data => {
          if (!data) {
            return;
          }
          this.name.next(data.tag);
          const sortedBounties = data.bounties.slice(0).sort((a, b) => {
            const vA = a as SaleItem;
            const vB = b as SaleItem;
            if (vA.vendor && !vB.vendor) {
              return 1;
            } else if (!vA.vendor && vB.vendor) {
              return -1;
            } else if (vA.vendor && vB.vendor) {
              if (vA.vendor.name > vB.vendor.name) {
                return 1;
              } else if (vA.vendor.name < vB.vendor.name) {
                return -1;
              }
            }
            if (a.name > b.name) {
              return 1;
            } else if (a.name < b.name) {
              return -1;
            }
            return 0;
          });
          this.bounties.next(sortedBounties);
        });


    combineLatest(input.playerLoading, input.vendorBountiesLoading).pipe(
      takeUntil(this.unsubscribe$))
      .subscribe(([x, y]) => {
        this.loading.next(x || y);
      });
  }

  selectVendorBounty(i: SaleItem) {
    // if (!i.vendor) {
    //   return;
    // }
    const x = i as any;
    const slh = this.input.shoppingListHashes.getValue();
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
  readonly modalBountySet: BehaviorSubject<BountySet>;
  readonly playerLoading: BehaviorSubject<boolean>;
  readonly vendorBountiesLoading: BehaviorSubject<boolean>;
  readonly refreshMe: Subject<void>;
  readonly shoppingList: BehaviorSubject<SaleItem[]>;
  readonly shoppingListHashes: BehaviorSubject<{ [key: string]: boolean }>;
}
