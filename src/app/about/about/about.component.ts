import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { IconService } from '@app/service/icon.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent extends ChildComponent  implements OnInit {
  constructor(storageService: StorageService, public iconService: IconService) {
    super(storageService);
  }

  ngOnInit() {}

}
