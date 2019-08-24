
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../service/bungie.service';
import { BungieGroupMember, ClanInfo, Const, MileStoneName, Platform, Player } from '../service/model';
import { StorageService } from '../service/storage.service';
import { ChildComponent } from '../shared/child.component';
import { ClanStateService } from './clan-state.service';


@Component({
  selector: 'd2c-clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanComponent extends ChildComponent implements OnInit, OnDestroy {
  constructor(
    public state: ClanStateService,
    storageService: StorageService,
    private route: ActivatedRoute) {
    super(storageService);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.state.load(params['id']);
    });
  }
}
