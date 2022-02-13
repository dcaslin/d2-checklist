import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumph-seasons',
  templateUrl: './triumph-seasons.component.html',
  styleUrls: ['./triumph-seasons.component.scss']
})
export class TriumphSeasonsComponent extends ChildComponent {
  public seasonIndex = 0;

  constructor(storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
    const maxEntries = this.state.currPlayer()?.seasonChallengeEntries.length;
    if (maxEntries) {
      const week = WeekService.getSeasonWeek();
      if (week < maxEntries) {
        this.seasonIndex = week;
      } else {
        this.seasonIndex = maxEntries - 1;
      }
    }
  }

  

  navigate(membershipType: number, membershipId: number, triumphHash: string) {
    this.router.navigate(['/', membershipType, membershipId, 'triumphs', 'tree', triumphHash], { relativeTo: this.route });
  }

}
