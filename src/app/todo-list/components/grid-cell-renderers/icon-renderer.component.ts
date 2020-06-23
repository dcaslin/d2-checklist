import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'icon-cell',
  template: `
    <d2c-bungie-icon *ngIf="params.value" [icon]="params.value"></d2c-bungie-icon>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
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
