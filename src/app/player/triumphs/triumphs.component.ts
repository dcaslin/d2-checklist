import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumphs',
  templateUrl: './triumphs.component.html',
  styleUrls: ['./triumphs.component.scss']
})
export class TriumphsComponent extends ChildComponent {

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    private route: ActivatedRoute,
    public state: PlayerStateService) {
    super(storageService);
  }


}

