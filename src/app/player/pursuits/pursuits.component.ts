import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { SignInRequiredComponent } from '../../shared/sign-in-required/sign-in-required.component';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-pursuits',
    templateUrl: './pursuits.component.html',
    styleUrls: ['./pursuits.component.scss'],
    imports: [NgIf, SignInRequiredComponent, MatTabNav, MatTabLink, RouterLink, RouterLinkActive, FaIconComponent, MatTabNavPanel, RouterOutlet, AsyncPipe]
})
export class PursuitsComponent extends ChildComponent {

  constructor(
    public state: PlayerStateService,
    public dialog: MatDialog, 
    public iconService: IconService) {
    super();

  }


  

}
