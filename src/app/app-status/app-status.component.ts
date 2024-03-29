import { Component } from '@angular/core';
import { BungieService } from '@app/service/bungie.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';

@Component({
  selector: 'd2c-app-status',
  templateUrl: './app-status.component.html',
  styleUrls: ['./app-status.component.scss']
})
export class AppStatusComponent {

  constructor(
    public bungieService: BungieService,
    public destinyCacheService: DestinyCacheService) { }

}
