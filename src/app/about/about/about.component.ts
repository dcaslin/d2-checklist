import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { ChildComponent } from '../../shared/child.component';
import { MatAnchor } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    standalone: true,
    imports: [MatAnchor, FaIconComponent, RouterLink]
})
export class AboutComponent extends ChildComponent {
  constructor(public iconService: IconService) {
    super();
  }

}
