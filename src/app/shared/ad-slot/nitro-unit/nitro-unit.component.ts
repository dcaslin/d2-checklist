import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { environment as env, environment } from '@env/environment';

@Component({
  selector: 'd2c-nitro-unit',
  templateUrl: './nitro-unit.component.html',
  styleUrls: ['./nitro-unit.component.scss']
})
export class NitroUnitComponent implements OnInit, AfterViewInit {
  @Input() title: string;
  @Input() unitId: string;
  @Input() width: number;
  @Input() height: number;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // Do stuff
    window['nitroAds'].createAd(this.unitId, {
      'refreshLimit': 10,
      'refreshTime': 90,
      'demo': !environment.production,
      'renderVisibleOnly': false,
      'refreshVisibleOnly': true,
      'sizes': [
        [
          this.width,
          this.height
        ]
      ],
      'report': {
        'enabled': true,
        'wording': 'Report Ad',
        'position': 'top-right'
      }
    });
  }

}
