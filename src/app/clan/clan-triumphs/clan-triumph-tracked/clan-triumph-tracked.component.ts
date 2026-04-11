import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ClanStateService } from '@app/clan/clan-state.service';
import { ChildComponent } from '@app/shared/child.component';
import { NgIf, NgFor } from '@angular/common';
import { ClanTriumphItemComponent } from '../clan-triumph-item/clan-triumph-item.component';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-triumph-tracked',
    templateUrl: './clan-triumph-tracked.component.html',
    styleUrls: ['./clan-triumph-tracked.component.scss'],
    imports: [NgIf, NgFor, ClanTriumphItemComponent]
})
export class ClanTriumphTrackedComponent extends ChildComponent {

  constructor(public state: ClanStateService) {
    super();
  }

  

}
