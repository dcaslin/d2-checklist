import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSeal, ClanStateService, ClanBadge } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanCollectionBadgeDialogComponent } from '../clan-collection-badge-dialog/clan-collection-badge-dialog.component';

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

  public openBadgeDialog(badge: ClanBadge): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = badge;
    this.dialog.open(ClanCollectionBadgeDialogComponent, dc);
  }

}
