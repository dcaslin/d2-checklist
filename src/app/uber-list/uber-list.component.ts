import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { UberListStateService } from './uber-list-state.service';

@Component({
  selector: 'd2c-uber-list',
  templateUrl: './uber-list.component.html',
  styleUrls: ['./uber-list.component.scss']
})
export class UberListComponent extends ChildComponent implements OnInit {
  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    private dialog: MatDialog,
    storageService: StorageService
  ) {
    super(storageService);
  }

  ngOnInit(): void {
    this.state.init();
  }

  refresh(): void {
    this.state.refresh();
  }
}
