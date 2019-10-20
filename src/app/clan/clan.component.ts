
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { StorageService } from '../service/storage.service';
import { ChildComponent } from '../shared/child.component';
import { ClanStateService } from './clan-state.service';
import { IconService } from '@app/service/icon.service';


@Component({
  selector: 'd2c-clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanComponent extends ChildComponent implements OnInit, OnDestroy {
  constructor(
    public iconService: IconService,
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
