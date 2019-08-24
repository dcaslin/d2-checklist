import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';

@Component({
  selector: 'd2c-clan-triumphs',
  templateUrl: './clan-triumphs.component.html',
  styleUrls: ['./clan-triumphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanTriumphsComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService, public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
