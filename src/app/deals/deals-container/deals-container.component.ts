import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { ChildComponent } from '@app/shared/child.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { DealsComponent } from '../deals/deals.component';
import { SignInRequiredComponent } from '../../shared/sign-in-required/sign-in-required.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-deals-container',
    templateUrl: './deals-container.component.html',
    styleUrls: ['./deals-container.component.scss'],
    imports: [NgIf, DealsComponent, SignInRequiredComponent, FaIconComponent, AsyncPipe]
})
export class DealsContainerComponent extends ChildComponent implements OnInit {

  constructor(
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    public router: Router,
    private dialog: MatDialog,
    
  ) {
    super();
  }

  ngOnInit(): void {
    this.signedOnUserService.loadVendorsIfNotLoaded();
  }

}
