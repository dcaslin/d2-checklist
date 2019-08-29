import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { ClanStateService } from '../clan-state.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'd2c-clan-lifetime',
  templateUrl: './clan-lifetime.component.html',
  styleUrls: ['./clan-lifetime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanLifetimeComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: ClanStateService) {
    super(storageService);
  }

  ngOnInit() {
    this.state.allLoaded.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe((done: boolean) => {
        if (done){
          console.log("load lifetime");
          
          this.state.loadAggHistory();
        }
      });
  }

}
