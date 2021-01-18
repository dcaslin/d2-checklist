import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { CharacterVendorData } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { VendorDeals, VendorService } from '@app/service/vendor.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { concatAll, map, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-testbed',
  templateUrl: './testbed.component.html',
  styleUrls: ['./testbed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TestbedComponent extends ChildComponent implements OnInit, OnDestroy {
  
  constructor(
    storageService: StorageService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService) {
    super(storageService);

  }

  refreshPlayer() {
    this.signedOnUserService.refreshPlayer$.next(true);
  }

  refreshVendors() {
    this.signedOnUserService.refreshVendors$.next(true);
  }

  ngOnInit(): void {
  }
}
