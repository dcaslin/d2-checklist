import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ClanStateService } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  selector: 'd2c-clan-seals',
  templateUrl: './clan-seals.component.html',
  styleUrls: ['./clan-seals.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanSealsComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService, public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

  details(event: MouseEvent){
    event.stopPropagation();
  }

}
