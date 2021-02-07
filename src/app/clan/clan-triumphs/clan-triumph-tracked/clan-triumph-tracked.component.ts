import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ClanStateService } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-triumph-tracked',
  templateUrl: './clan-triumph-tracked.component.html',
  styleUrls: ['./clan-triumph-tracked.component.scss']
})
export class ClanTriumphTrackedComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService, public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
