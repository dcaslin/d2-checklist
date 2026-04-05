import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TriumphNameComponent } from '../../../shared/triumph-name/triumph-name.component';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TriumphObjectivesComponent } from '../triumph-objectives/triumph-objectives.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-triumph-tracked',
    templateUrl: './triumph-tracked.component.html',
    styleUrls: ['./triumph-tracked.component.scss'],
    standalone: true,
    imports: [NgIf, MatCheckbox, FormsModule, NgFor, TriumphNameComponent, MatProgressBar, TriumphObjectivesComponent, AsyncPipe]
})
export class TriumphTrackedComponent extends ChildComponent {

  constructor(private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super();
  }
  

  navigate(triumphHash: string) {
    this.router.navigate(['..', 'tree', triumphHash], { relativeTo: this.route});
  }


}
