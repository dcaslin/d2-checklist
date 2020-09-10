import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';
import { IconService } from '@app/service/icon.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'd2c-triumph-tracked',
  templateUrl: './triumph-tracked.component.html',
  styleUrls: ['./triumph-tracked.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TriumphTrackedComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
  }
  ngOnInit() {
  }

  navigate(triumphHash: string) {
    this.router.navigate(['..', 'tree', triumphHash], { relativeTo: this.route});
  }


}
