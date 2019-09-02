
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BungieNetUserInfo, PGCR } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-pgcr-history',
  templateUrl: './pgcr.component.html',
  styleUrls: ['./pgcr.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class PGCRComponent extends ChildComponent implements OnInit, OnDestroy {

  instanceId: string;
  // array for cheap asyn unwraps
  public pgcr: BehaviorSubject<PGCR[]> = new BehaviorSubject([]);

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  private async load() {
    this.pgcr.next([]);
    this.loading.next(true);
    try {
      const x = await this.bungieService.getPGCR(this.instanceId);
      this.pgcr.next([x]);
    }
    finally {
      this.loading.next(false);
    }
  }
  
  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.instanceId = params['instanceId'];
      this.load();
    });
  }
}
