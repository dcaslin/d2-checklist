import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-triumphs',
    templateUrl: './clan-triumphs.component.html',
    styleUrls: ['./clan-triumphs.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLink, RouterLinkActive, FaIconComponent, MatTabNavPanel, NgIf, RouterOutlet, AsyncPipe]
})
export class ClanTriumphsComponent extends ChildComponent {

  constructor(public state: ClanStateService, public iconService: IconService) {
    super();
  }

  

}
