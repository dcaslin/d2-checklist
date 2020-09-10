import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-triumph-seals',
  templateUrl: './triumph-seals.component.html',
  styleUrls: ['./triumph-seals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphSealsComponent extends ChildComponent implements OnInit {
  openEntryId: string|null = null;

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
  }

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  ngOnInit() {
  }

}
