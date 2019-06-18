import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { Const, Player, InventoryItem } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { PlayerStateService } from '../player-state.service';

@Component({
  selector: 'd2c-pursuits',
  templateUrl: './pursuits.component.html',
  styleUrls: ['./pursuits.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PursuitsComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    public state: PlayerStateService,
    private ref: ChangeDetectorRef,
    public dialog: MatDialog) {
    super(storageService, ref);

  }


  ngOnInit() {
  }

}
