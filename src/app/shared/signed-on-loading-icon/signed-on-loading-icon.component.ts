import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { FaStackComponent, FaIconComponent, FaStackItemSizeDirective } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-signed-on-loading-icon',
    templateUrl: './signed-on-loading-icon.component.html',
    styleUrls: ['./signed-on-loading-icon.component.scss'],
    standalone: true,
    imports: [NgIf, FaStackComponent, FaIconComponent, FaStackItemSizeDirective, AsyncPipe]
})
export class SignedOnLoadingIconComponent {

  @Input() showVendorState = true;

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService) { }

  

}
