import { Component } from '@angular/core';

import { ICellRendererAngularComp } from '@ag-grid-community/angular';

@Component({
  selector: 'icon-cell',
  template: `
    <span class="icon" [style.background-image]="iconUrl"></span>
  `,
  styles: [
    `.icon {
      display: inline-block;
      width: 48px;
      height: 48px;
      background-size: cover;
    }`
  ]
})
export class IconRenderer implements ICellRendererAngularComp {
  public params: any;
  public iconUrl: string;

  agInit(params: any): void {
    this.params = params;
    this.setIconUrl(params);
  }

  refresh(): boolean {
    return false;
  }

  private setIconUrl(params) {
    this.iconUrl = `url(//www.bungie.net${params.value})`
  }
}
