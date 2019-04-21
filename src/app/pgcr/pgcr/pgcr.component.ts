
import {takeUntil} from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { BungieService } from '../../service/bungie.service';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import { BungieNetUserInfo, BungieMember, PGCR } from '@app/service/model';

@Component({
  selector: 'anms-pgcr-history',
  templateUrl: './pgcr.component.html',
  styleUrls: ['./pgcr.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PGCRComponent extends ChildComponent implements OnInit, OnDestroy {

  instanceId: string;
  // array for cheap asyn unwraps
  public pgcr: BehaviorSubject<PGCR[]> = new BehaviorSubject([]);

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
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


  public async navigateBnetMember(target: BungieNetUserInfo) {
    const bnetName = await this.bungieService.getFullBNetName(target.membershipId);
    if (bnetName!=null) this.router.navigate(['/', 4, bnetName]);
    return;
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.instanceId = params['instanceId'];
      this.load();
    });
  }
}
