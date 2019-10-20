import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-collection-badges',
  templateUrl: './collection-badges.component.html',
  styleUrls: ['./collection-badges.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionBadgesComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
