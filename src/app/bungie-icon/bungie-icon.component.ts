import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-bungie-icon',
  template: `
    <img class="bungie-icon" [ngClass]="iconClass" [src]="iconUrl">
  `
})
export class BungieIconComponent {

  @Input() set icon(path: string) { this.iconUrl = `//www.bungie.net${path}`; }
  @Input() iconClass: string = 'icon';

  public iconUrl: string;

}
