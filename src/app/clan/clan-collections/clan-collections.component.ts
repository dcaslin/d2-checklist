import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-collections',
  templateUrl: './clan-collections.component.html',
  styleUrls: ['./clan-collections.component.scss']
})
export class ClanCollectionsComponent extends ChildComponent {

  constructor(storageService: StorageService, public state: ClanStateService, public iconService: IconService) {
    super(storageService);
  }

}
