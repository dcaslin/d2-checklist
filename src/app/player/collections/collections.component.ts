import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss']
})
export class CollectionsComponent {
  constructor(public iconService: IconService) {
  }
}
