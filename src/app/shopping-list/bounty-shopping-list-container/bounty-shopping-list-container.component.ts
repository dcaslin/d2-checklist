import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BountySetInfo, BountySetsDialogComponent } from '@app/home/bounty-sets-dialog/bounty-sets-dialog.component';
import { IconService } from '@app/service/icon.service';
import { BountySet } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-bounty-shopping-list-container',
  templateUrl: './bounty-shopping-list-container.component.html',
  styleUrls: ['./bounty-shopping-list-container.component.scss']
})
export class BountyShoppingListContainerComponent extends ChildComponent implements OnInit, OnDestroy {
  readonly shoppingListHashes$: BehaviorSubject<{ [key: string]: boolean }> = new BehaviorSubject({});
  readonly modalBountySet$: BehaviorSubject<BountySet> = new BehaviorSubject(null);

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    public router: Router,
    private dialog: MatDialog,
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
    this.signedOnUserService.loadVendorsIfNotLoaded();
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

  public onShowModalBountySet(bs: BountySet) {
    // store this in an observable so if it's refreshed we can track it in the modal we're showing
    this.modalBountySet$.next(bs);
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    const d: BountySetInfo = {
      modalBountySet$: this.modalBountySet$
    };
    dc.data = d;
    dc.width = '80%';
    const ref = this.dialog.open(BountySetsDialogComponent, dc);
    ref.afterClosed().subscribe(result => {
      this.modalBountySet$.next(null);
    });
  }

  onClearShoppingList() {
    this.storageService.clearHashList('shoppinglist');
  }
}
