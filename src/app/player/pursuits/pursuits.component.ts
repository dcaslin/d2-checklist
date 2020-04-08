import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import * as moment from 'moment';

@Component({
  selector: 'd2c-pursuits',
  templateUrl: './pursuits.component.html',
  styleUrls: ['./pursuits.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PursuitsComponent extends ChildComponent implements OnInit {
  public today =  moment(new Date());

  constructor(
    storageService: StorageService,
    public state: PlayerStateService,
    public dialog: MatDialog) {
    super(storageService);

  }


  ngOnInit() {
  }

}
