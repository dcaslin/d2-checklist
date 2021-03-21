import { Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

@Component({
  selector: 'd2c-player-currencies',
  templateUrl: './player-currencies.component.html',
  styleUrls: ['./player-currencies.component.scss']
})
export class PlayerCurrenciesComponent implements OnInit {

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService
    ) { }

  ngOnInit(): void {
  }

}
