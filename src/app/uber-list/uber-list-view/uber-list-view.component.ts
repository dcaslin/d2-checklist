import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { combineLatest } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { UberListStateService } from '../uber-list-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-uber-list-view',
  templateUrl: './uber-list-view.component.html',
  styleUrls: ['./uber-list-view.component.scss']
})
export class UberListViewComponent extends ChildComponent implements OnInit {

  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    private dialog: MatDialog,
    storageService: StorageService) {
    super(storageService);
  }

  ngOnInit(): void {
  };

}
