import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { StorageService } from '@app/service/storage.service';
import * as moment from 'moment';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-members',
  templateUrl: './clan-members.component.html',
  styleUrls: ['./clan-members.component.scss']
})
export class ClanMembersComponent extends ChildComponent implements OnInit {
  public today =  moment(new Date());
  constructor(
    public iconService: IconService, 
    public state: ClanStateService,
    storageService: StorageService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
