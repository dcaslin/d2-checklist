import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-chars',
  templateUrl: './chars.component.html',
  styleUrls: ['./chars.component.scss']
})
export class CharsComponent extends ChildComponent {

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
      super(storageService, );

    }

  

}
