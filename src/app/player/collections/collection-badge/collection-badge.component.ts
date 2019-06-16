import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { takeUntil } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { Badge } from '@app/service/model';

@Component({
  selector: 'd2c-collection-badge',
  templateUrl: './collection-badge.component.html',
  styleUrls: ['./collection-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionBadgeComponent extends ChildComponent implements OnInit {
  public _badge: BehaviorSubject<Badge> = new BehaviorSubject<Badge>(null);

  constructor(storageService: StorageService,
    public state: PlayerStateService,
    private route: ActivatedRoute,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const selectedBadge = params['node'];
      if (this.state.currPlayer() == null) {
        return;
      }
      const badges = this.state.currPlayer().badges;
      for (const b of badges) {
        if (b.hash == selectedBadge) {
          this._badge.next(b);
          window.scrollTo(0, 0);
          setTimeout(() => {
            const el = document.getElementById('badge-name');
            if (el != null) {
              el.scrollIntoView();
            } else {
              console.log('Badge name not found, cannot scroll to it');
            }
          }, 100);
          return;
        }
      }

    });
  }

}
