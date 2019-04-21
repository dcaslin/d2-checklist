import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'anms-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent extends ChildComponent  implements OnInit {
  constructor(storageService: StorageService,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
  }

  ngOnInit() {}

}
