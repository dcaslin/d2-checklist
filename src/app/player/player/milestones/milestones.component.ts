import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';

@Component({
  selector: 'anms-milestones',
  templateUrl: './milestones.component.html',
  styleUrls: ['./milestones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MilestonesComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef) {
      super(storageService, ref);
    }
    
  ngOnInit() {
  }

}
