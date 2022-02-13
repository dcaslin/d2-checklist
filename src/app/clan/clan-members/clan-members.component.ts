import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-members',
  templateUrl: './clan-members.component.html',
  styleUrls: ['./clan-members.component.scss']
})
export class ClanMembersComponent extends ChildComponent {
  constructor(
    public iconService: IconService, 
    public state: ClanStateService,
    storageService: StorageService) {
    super(storageService);
  }

}
