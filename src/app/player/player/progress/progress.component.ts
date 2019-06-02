import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';

@Component({
  selector: 'anms-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef) {
      super(storageService, ref);
    }

  ngOnInit() {
  }

}
