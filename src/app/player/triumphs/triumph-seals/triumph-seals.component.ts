import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumph-seals',
  templateUrl: './triumph-seals.component.html',
  styleUrls: ['./triumph-seals.component.scss']
})
export class TriumphSealsComponent extends ChildComponent {
  openEntryId: string|null = null;

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
  }

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  

}
