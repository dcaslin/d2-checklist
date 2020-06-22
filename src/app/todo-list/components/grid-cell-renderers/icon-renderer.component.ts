import { Component } from '@angular/core';

import { ICellRendererAngularComp } from '@ag-grid-community/angular';

@Component({
  selector: 'icon-cell',
  template: `
    <d2c-bungie-icon [icon]="params.value"></d2c-bungie-icon>
  `,
})
export class IconRenderer implements ICellRendererAngularComp {
  public params: any;

  agInit(params: any): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }
}
