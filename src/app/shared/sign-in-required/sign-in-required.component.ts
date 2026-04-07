import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@app/service/auth.service';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatButton } from '@angular/material/button';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-sign-in-required',
    templateUrl: './sign-in-required.component.html',
    styleUrls: ['./sign-in-required.component.scss'],
    imports: [NgIf, MatCard, MatCardHeader, MatCardAvatar, FaIconComponent, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatButton, AsyncPipe]
})
export class SignInRequiredComponent {

  constructor(
    public signedOnUserService: SignedOnUserService,
    private authService: AuthService,
    public iconService: IconService
  ) { }

  logon() {
    this.authService.getCurrentMemberId(true);
  }

}
