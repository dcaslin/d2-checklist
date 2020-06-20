import { Component, OnInit } from '@angular/core';
import { filter, takeUntil } from 'rxjs/operators';

import { BountyCatalogService } from '../services/bounty-catalog.service';
import { MilestoneCatalogService } from '../services/milestone-catalog.service';
import { Destroyable } from '../util/destroyable';

@Component({
  selector: 'd2c-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent extends Destroyable implements OnInit {

  constructor(
    private bountyService: BountyCatalogService,
    private milestoneService: MilestoneCatalogService
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

    this.milestoneService.milestoneCatalog.pipe(
      filter(x => !!x),
      takeUntil(this.destroy$)
    ).subscribe((milestones) => {
      console.log('Account milestones', milestones);
    })
  }
}
