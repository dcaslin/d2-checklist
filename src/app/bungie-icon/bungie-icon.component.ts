import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'd2c-bungie-icon',
  template: `
    <span [ngClass]="iconClass" [style.background-image]="iconUrl"></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BungieIconComponent {

  @Input() set icon(path: string) { this.iconUrl = `url(//www.bungie.net${path})`; }
  @Input() iconClass: string = 'icon';

  public iconUrl: string;

}
