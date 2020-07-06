import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'd2c-bungie-icon',
  template: `
    <img class="bungie-icon" [ngClass]="iconClass" [src]="iconUrl">
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BungieIconComponent {

  @Input() set icon(path: string) { this.iconUrl = `//www.bungie.net${path}`; }
  @Input() iconClass: string = 'icon';

  public iconUrl: string;

}
