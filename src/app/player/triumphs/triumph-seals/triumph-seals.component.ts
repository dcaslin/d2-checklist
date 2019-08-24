import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';

@Component({
  selector: 'd2c-triumph-seals',
  templateUrl: './triumph-seals.component.html',
  styleUrls: ['./triumph-seals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphSealsComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: PlayerStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
