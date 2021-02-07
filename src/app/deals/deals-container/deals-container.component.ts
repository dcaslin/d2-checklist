import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-deals-container',
  templateUrl: './deals-container.component.html',
  styleUrls: ['./deals-container.component.scss']
})
export class DealsContainerComponent extends ChildComponent implements OnInit {

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    public router: Router,
    private dialog: MatDialog,
    storageService: StorageService
  ) {
    super(storageService);
  }

  ngOnInit(): void {
    this.signedOnUserService.loadVendorsIfNotLoaded();
  }

}
