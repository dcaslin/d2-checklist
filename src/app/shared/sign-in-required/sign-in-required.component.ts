import { Component, OnInit } from '@angular/core';
import { AuthService } from '@app/service/auth.service';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

@Component({
  selector: 'd2c-sign-in-required',
  templateUrl: './sign-in-required.component.html',
  styleUrls: ['./sign-in-required.component.scss']
})
export class SignInRequiredComponent implements OnInit {

  constructor(
    public signedOnUserService: SignedOnUserService,
    private authService: AuthService,
    public iconService: IconService
  ) { }

  ngOnInit() {
  }

  logon() {
    this.authService.getCurrentMemberId(true);
  }

}
