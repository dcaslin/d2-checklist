import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../../player-state.service';

@Component({
  selector: 'd2c-collection-badges',
  templateUrl: './collection-badges.component.html',
  styleUrls: ['./collection-badges.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollectionBadgesComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: PlayerStateService,
    private route: ActivatedRoute,
    private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  ngOnInit() {
  }

}
