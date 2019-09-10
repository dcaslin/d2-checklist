import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Badge, Player } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerStateService } from '../../player-state.service';

@Component({
  selector: 'd2c-collection-badge',
  templateUrl: './collection-badge.component.html',
  styleUrls: ['./collection-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionBadgeComponent extends ChildComponent implements OnInit {
  private selectedBadge: string = null;
  public _badge: BehaviorSubject<Badge> = new BehaviorSubject<Badge>(null);

  constructor(storageService: StorageService,
    public state: PlayerStateService,
    private route: ActivatedRoute) {
    super(storageService);
  }

  private load(player: Player, selectedBadgeHash: string) {
    if (player == null) {
      return;
    }
    if (selectedBadgeHash == null) {
      return;
    }
    const badges = player.badges;
      for (const b of badges) {
        if (b.hash == selectedBadgeHash) {
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
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.selectedBadge = params['node'];
      this.load(this.state.currPlayer(), this.selectedBadge);
    });
    this.state.player.pipe(takeUntil(this.unsubscribe$)).subscribe((p: Player) => {
      this.load(p, this.selectedBadge);
    });
  }
}
