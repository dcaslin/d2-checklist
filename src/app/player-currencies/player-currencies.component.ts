import { Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { CurrencyType } from '@app/service/model';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { DamageType } from 'bungie-api-ts/destiny2';
import { NgIf, NgFor, NgTemplateOutlet, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatAnchor } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'd2c-player-currencies',
    templateUrl: './player-currencies.component.html',
    styleUrls: ['./player-currencies.component.scss'],
    standalone: true,
    imports: [NgIf, NgFor, MatTooltip, MatAnchor, MatMenuTrigger, FaIconComponent, MatMenu, NgTemplateOutlet, MatMenuItem, AsyncPipe, DecimalPipe]
})
export class PlayerCurrenciesComponent {
  CurrencyType = CurrencyType;

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService
    ) { }

}
