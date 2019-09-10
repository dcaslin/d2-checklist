import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';

@Component({
  selector: 'd2c-clan-collections',
  templateUrl: './clan-collections.component.html',
  styleUrls: ['./clan-collections.component.scss']
})
export class ClanCollectionsComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService, public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
