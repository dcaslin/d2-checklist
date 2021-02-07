import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { PlayerStateService } from '../player-state.service';
import { IconService } from '@app/service/icon.service';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-triumphs',
  templateUrl: './triumphs.component.html',
  styleUrls: ['./triumphs.component.scss']
})
export class TriumphsComponent extends ChildComponent implements OnInit {

  contentVaultOnly: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    private route: ActivatedRoute,
    public state: PlayerStateService) {
    super(storageService);
  }

  ngOnInit() {
    this.route.data.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      const cvo = data.contentVaultOnly;
      this.contentVaultOnly.next(cvo === true);
    });
  }



}

