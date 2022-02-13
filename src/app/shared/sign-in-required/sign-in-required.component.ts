import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@app/service/auth.service';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-sign-in-required',
  templateUrl: './sign-in-required.component.html',
  styleUrls: ['./sign-in-required.component.scss']
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
