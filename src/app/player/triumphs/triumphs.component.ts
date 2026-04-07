import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-triumphs',
    templateUrl: './triumphs.component.html',
    styleUrls: ['./triumphs.component.scss'],
    imports: [NgIf, MatTabNav, MatTabLink, RouterLink, RouterLinkActive, FaIconComponent, MatTabNavPanel, RouterOutlet, AsyncPipe]
})
export class TriumphsComponent extends ChildComponent {

  constructor(
    public iconService: IconService,
    private route: ActivatedRoute,
    public state: PlayerStateService) {
    super();
  }


}

