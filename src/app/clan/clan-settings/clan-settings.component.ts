import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BungieGroupMember } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { ClanUserListDialogComponent } from './clan-user-list-dialog/clan-user-list-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-settings',
  templateUrl: './clan-settings.component.html',
  styleUrls: ['./clan-settings.component.scss']
})
export class ClanSettingsComponent extends ChildComponent {

  constructor(storageService: StorageService,
    public state: ClanStateService,
    public dialog: MatDialog) {
    super(storageService);
  }


  openUserDialog(title: string, desc: string, users: BungieGroupMember[]) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = {
      title,
      desc,
      users
    };
    this.dialog.open(ClanUserListDialogComponent, dc);
  }

}
