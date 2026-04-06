import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { NgIf, NgTemplateOutlet, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FriendStarComponent } from '../../shared/friend-star/friend-star.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatAnchor } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { AgoHumanizedPipe, MinsHumanizedPipe } from '../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-members',
    templateUrl: './clan-members.component.html',
    styleUrls: ['./clan-members.component.scss'],
    imports: [NgIf, RouterLink, NgTemplateOutlet, NgFor, FriendStarComponent, FaIconComponent, MatAnchor, MatTooltip, AgoHumanizedPipe, MinsHumanizedPipe, AsyncPipe, DecimalPipe]
})
export class ClanMembersComponent extends ChildComponent {
  constructor(
    public iconService: IconService, 
    public state: ClanStateService,
    ) {
    super();
  }

}
