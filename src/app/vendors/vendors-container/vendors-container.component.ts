import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  selector: 'd2c-vendors-container',
  templateUrl: './vendors-container.component.html',
  styleUrls: ['./vendors-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorsContainerComponent extends ChildComponent implements OnInit, OnDestroy {

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    storageService: StorageService
  ) {
    super(storageService);
  }

  ngOnInit(): void {
  }

}
