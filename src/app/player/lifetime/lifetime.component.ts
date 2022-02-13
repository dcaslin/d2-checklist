import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-lifetime',
  templateUrl: './lifetime.component.html',
  styleUrls: ['./lifetime.component.scss']
})
export class LifetimeComponent extends ChildComponent {

  constructor(
    public iconService: IconService,
    storageService: StorageService,
    public state: PlayerStateService,
    public weekService: WeekService,
    public dialog: MatDialog) {
      super(storageService);
    }

}
