import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-more',
    templateUrl: './more.component.html',
    styleUrls: ['./more.component.scss'],
    imports: [MatTabNav, MatTabLink, RouterLink, RouterLinkActive, FaIconComponent, MatTabNavPanel, RouterOutlet]
})
export class MoreComponent {

  constructor(public iconService: IconService) { }

  

}
