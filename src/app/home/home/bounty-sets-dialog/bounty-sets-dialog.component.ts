import { ChangeDetectionStrategy, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { IconService } from '@app/service/icon.service';
import { BountySet, SaleItem, InventoryItem } from '@app/service/model';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
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
  refreshMe: Subject<void>;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<BountySetsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public input: BountySetInfo) {
    super(storageService);

    this.refreshMe = input.refreshMe;

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

  ngOnInit() {
  }

}


export interface BountySetInfo {
  modalBountySet: BehaviorSubject<BountySet>;
  playerLoading: BehaviorSubject<boolean>;
  vendorBountiesLoading: BehaviorSubject<boolean>;
  refreshMe: Subject<void>;
}