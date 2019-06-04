import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { Player } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'anms-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent extends ChildComponent implements OnInit {
  @Input() player: Player;


  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef) {
      super(storageService, ref);
    }

  ngOnInit() {
  }

}
