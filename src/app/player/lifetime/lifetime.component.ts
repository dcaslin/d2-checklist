import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { WeekService } from '@app/service/week.service';

@Component({
  selector: 'd2c-lifetime',
  templateUrl: './lifetime.component.html',
  styleUrls: ['./lifetime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifetimeComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    public state: PlayerStateService,
    public weekService: WeekService,
    public dialog: MatDialog) {
      super(storageService);
    }

  async ngOnInit() {
  }
}
