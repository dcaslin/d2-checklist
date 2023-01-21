import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-signed-on-loading-icon',
  templateUrl: './signed-on-loading-icon.component.html',
  styleUrls: ['./signed-on-loading-icon.component.scss']
})
export class SignedOnLoadingIconComponent {

  @Input() showVendorState = true;

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService) { }

  

}
