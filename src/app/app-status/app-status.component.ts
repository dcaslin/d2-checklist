import { Component } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { NgIf, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
    selector: 'd2c-app-status',
    templateUrl: './app-status.component.html',
    styleUrls: ['./app-status.component.scss'],
    imports: [NgIf, MatCard, MatCardContent, MatProgressBar, AsyncPipe, DecimalPipe]
})
export class AppStatusComponent {

  constructor(
    public bungieService: BungieService,
    public destinyCacheService: DestinyCacheService) { }

}
