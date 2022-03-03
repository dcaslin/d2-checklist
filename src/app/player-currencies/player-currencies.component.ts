import { Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { CurrencyType } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { DamageType } from 'bungie-api-ts/destiny2';

@Component({
  selector: 'd2c-player-currencies',
  templateUrl: './player-currencies.component.html',
  styleUrls: ['./player-currencies.component.scss']
})
export class PlayerCurrenciesComponent {
  CurrencyType = CurrencyType;

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService
    ) { }

}
