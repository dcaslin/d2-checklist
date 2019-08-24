import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
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
    public dialog: MatDialog) {
    super(storageService);

  }


  ngOnInit() {
  }

}
