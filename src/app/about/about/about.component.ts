import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '../../shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent extends ChildComponent {
  constructor(public iconService: IconService) {
    super();
  }

}
