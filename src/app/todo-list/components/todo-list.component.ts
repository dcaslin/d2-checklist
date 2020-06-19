import { Component, OnInit } from '@angular/core';
import { MilestoneStatus, NameQuantity } from '@app/service/model';
import { filter, takeUntil } from 'rxjs/operators';

import { BountyCatalogService } from '../services/bounty-catalog.service';
import { Destroyable } from '../util/destroyable';

@Component({
  selector: 'd2c-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent extends Destroyable implements OnInit {

  constructor(
    private bountyService: BountyCatalogService,
  ) {
    super()
  }

  ngOnInit(): void {
    this.bountyService.bountyCatalog.pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    ).subscribe((bounties) => {
      console.log('Account bounties with possesion/completion statuses', bounties);
    })
  }
}
