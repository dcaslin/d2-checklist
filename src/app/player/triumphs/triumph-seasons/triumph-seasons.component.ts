import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { WeekService } from '@app/service/week.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { TriumphNameComponent } from '../../../shared/triumph-name/triumph-name.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TriumphObjectivesComponent } from '../triumph-objectives/triumph-objectives.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-triumph-seasons',
    templateUrl: './triumph-seasons.component.html',
    styleUrls: ['./triumph-seasons.component.scss'],
    imports: [NgIf, MatCheckbox, FormsModule, MatFormField, MatLabel, MatSelect, NgFor, MatOption, TriumphNameComponent, MatProgressBar, TriumphObjectivesComponent, AsyncPipe]
})
export class TriumphSeasonsComponent extends ChildComponent {
  public seasonIndex = 0;

  constructor(private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super();
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
