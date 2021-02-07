import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import * as moment from 'moment';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-chars',
  templateUrl: './chars.component.html',
  styleUrls: ['./chars.component.scss']
})
export class CharsComponent extends ChildComponent implements OnInit {
  public today =  moment(new Date());

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public state: PlayerStateService) {
      super(storageService, );

    }

  ngOnInit() {
  }

}
