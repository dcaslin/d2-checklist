import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Progression } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';

@Component({
  selector: 'd2c-lifetime',
  templateUrl: './lifetime.component.html',
  styleUrls: ['./lifetime.component.scss']
})
export class LifetimeComponent extends ChildComponent implements OnInit {
  constructor(
    storageService: StorageService,
    public state: PlayerStateService,
    public dialog: MatDialog) {
      super(storageService);
    }

  ngOnInit() {
  }
}
