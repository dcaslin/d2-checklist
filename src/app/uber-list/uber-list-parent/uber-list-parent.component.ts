import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { UberListStateService } from '../uber-list-state.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SignInRequiredComponent } from '../../shared/sign-in-required/sign-in-required.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-uber-list-parent',
    templateUrl: './uber-list-parent.component.html',
    styleUrls: ['./uber-list-parent.component.scss'],
    imports: [NgIf, MatTabNav, MatTabLink, RouterLink, RouterLinkActive, FaIconComponent, MatTabNavPanel, RouterOutlet, SignInRequiredComponent, MatProgressSpinner, AsyncPipe]
})
export class UberListParentComponent implements OnInit {

  constructor(
    private state: UberListStateService,
    public iconService: IconService,
    public signedOnUserService: SignedOnUserService) { }

  ngOnInit(): void {
    this.state.init();
  }

}
