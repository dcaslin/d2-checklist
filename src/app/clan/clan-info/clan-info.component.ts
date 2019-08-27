import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { ClanStateService } from '../clan-state.service';

@Component({
  selector: 'd2c-clan-info',
  templateUrl: './clan-info.component.html',
  styleUrls: ['./clan-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanInfoComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
