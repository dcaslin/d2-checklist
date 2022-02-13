import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumph-closest',
  templateUrl: './triumph-closest.component.html',
  styleUrls: ['./triumph-closest.component.scss']
})
export class TriumphClosestComponent extends ChildComponent {
  maxResults: number[] = [10, 25, 50];
  selectedMaxResults = 10;

  constructor(storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    public iconService: IconService,
    public state: PlayerStateService) {
    super(storageService);
  }

  navigate(triumphHash: string) {
    this.router.navigate(['..', 'tree', triumphHash], { relativeTo: this.route});
  }

  

}
