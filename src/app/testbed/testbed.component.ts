import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

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

  ngOnInit(): void {
  }
}
