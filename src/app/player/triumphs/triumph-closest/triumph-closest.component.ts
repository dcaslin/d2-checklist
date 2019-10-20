import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-triumph-closest',
  templateUrl: './triumph-closest.component.html',
  styleUrls: ['./triumph-closest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphClosestComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
  }
  ngOnInit() {
  }

}
