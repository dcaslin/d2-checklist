import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { VendorLoadType } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, combineLatest } from 'rxjs';
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
  public charId$ = new BehaviorSubject<string|null>(null);
  public tab$ = new BehaviorSubject<string|null>(null);

  constructor(
    public signedOnUserService: SignedOnUserService,
    private route: ActivatedRoute,
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

  onCharIdSelect(charId: string) {
    console.log(`onCharIdSelect(${charId})`);
    this.charId$.next(charId);
    this.navigate();
  }

  onTabSelect(tab: string) {
    console.log(`onTabSelect(${tab})`);
    this.tab$.next(tab);
    this.navigate();

  }

  private navigate() {
    const charId = this.charId$.getValue();
    const tab = this.tab$.getValue();
    if (charId && tab) {
      this.router.navigate(['vendors', charId, tab]);
    } else if (charId) {
      this.router.navigate(['vendors', charId]);
    } else {
      this.router.navigate(['vendors']);
    }
  }

  ngOnInit(): void {
    this.signedOnUserService.refreshVendors$.next(VendorLoadType.LoadIfNotAlready);
    combineLatest([this.route.paramMap]).pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(([params]) => {
      const charId = params.get('characterId');
      const tab = params.get('tab');
      this.charId$.next(charId);
      this.tab$.next(tab);
    });

  }
}
