import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { UberListStateService } from '../uber-list-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-uber-list-parent',
  templateUrl: './uber-list-parent.component.html',
  styleUrls: ['./uber-list-parent.component.scss']
})
export class UberListParentComponent implements OnInit {

  constructor(
    private state: UberListStateService,
    public iconService: IconService,
    public signedOnUserService: SignedOnUserService) { }

  ngOnInit(): void {
    this.state.init();
  }

}
