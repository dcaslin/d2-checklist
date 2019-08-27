import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { ClanStateService } from '../clan-state.service';

@Component({
  selector: 'd2c-clan-settings',
  templateUrl: './clan-settings.component.html',
  styleUrls: ['./clan-settings.component.scss']
})
export class ClanSettingsComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
