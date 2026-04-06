import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-collection-badges',
    templateUrl: './collection-badges.component.html',
    styleUrls: ['./collection-badges.component.scss'],
    imports: [NgIf, MatCheckbox, FormsModule, NgFor, RouterLink, FaIconComponent, AsyncPipe]
})
export class CollectionBadgesComponent extends ChildComponent {

  constructor(public iconService: IconService,
    public state: PlayerStateService) {
    super();
  }

  

}
