import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Player } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  selector: 'anms-chars',
  templateUrl: './chars.component.html',
  styleUrls: ['./chars.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharsComponent extends ChildComponent implements OnInit {
  @Input() player: Player;

  constructor(
    storageService: StorageService,
    private ref: ChangeDetectorRef,
    private router: Router) {
      super(storageService, ref);

    }

  ngOnInit() {
  }

}
