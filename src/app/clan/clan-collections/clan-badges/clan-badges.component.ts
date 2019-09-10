import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ClanSeal, ClanStateService } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  selector: 'd2c-clan-badges',
  templateUrl: './clan-badges.component.html',
  styleUrls: ['./clan-badges.component.scss']
})
export class ClanBadgesComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public state: ClanStateService,
    public dialog: MatDialog) {
    super(storageService);
  }

  ngOnInit() {
  }
}