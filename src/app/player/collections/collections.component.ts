import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';


@Component({
  selector: 'd2c-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionsComponent {
  constructor(public iconService: IconService) {
  }
}
