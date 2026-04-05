import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatAnchor } from '@angular/material/button';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-collections',
    templateUrl: './collections.component.html',
    styleUrls: ['./collections.component.scss'],
    standalone: true,
    imports: [MatTabNav, MatTabLink, RouterLink, RouterLinkActive, FaIconComponent, MatTabNavPanel, RouterOutlet, MatAnchor]
})
export class CollectionsComponent {
  constructor(public iconService: IconService) {
  }
}
