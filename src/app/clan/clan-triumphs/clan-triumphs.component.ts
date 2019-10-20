import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-clan-triumphs',
  templateUrl: './clan-triumphs.component.html',
  styleUrls: ['./clan-triumphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanTriumphsComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService, public state: ClanStateService, public iconService: IconService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
