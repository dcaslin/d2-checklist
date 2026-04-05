import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanBadge, ClanStateService } from '@app/clan/clan-state.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanCollectionBadgeDialogComponent } from '../clan-collection-badge-dialog/clan-collection-badge-dialog.component';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-badges',
    templateUrl: './clan-badges.component.html',
    styleUrls: ['./clan-badges.component.scss'],
    standalone: true,
    imports: [NgIf, NgFor, MatButton, AsyncPipe]
})
export class ClanBadgesComponent extends ChildComponent {

  constructor(public state: ClanStateService,
    public dialog: MatDialog) {
    super();
  }

  public openBadgeDialog(badge: ClanBadge): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = badge;
    this.dialog.open(ClanCollectionBadgeDialogComponent, dc);
  }

}
