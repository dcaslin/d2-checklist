import { Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';

@Component({
  selector: 'd2c-triumph-mot',
  templateUrl: './triumph-mot.component.html',
  styleUrls: ['./triumph-mot.component.scss']
})
export class TriumphMotComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: PlayerStateService) {
    super(storageService);
  }

  ngOnInit() {
  }

}
