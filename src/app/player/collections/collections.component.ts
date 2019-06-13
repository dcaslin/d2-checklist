import { ChangeDetectionStrategy, Component } from '@angular/core';


@Component({
  selector: 'd2c-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsComponent {
  constructor() {
  }
}
