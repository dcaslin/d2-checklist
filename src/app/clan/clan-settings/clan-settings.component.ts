import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BungieGroupMember } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService } from '../clan-state.service';
import { ClanUserListDialogComponent } from './clan-user-list-dialog/clan-user-list-dialog.component';
import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NgFor, AsyncPipe } from '@angular/common';
import { MatOption } from '@angular/material/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-settings',
    templateUrl: './clan-settings.component.html',
    styleUrls: ['./clan-settings.component.scss'],
    standalone: true,
    imports: [MatButton, MatFormField, MatSelect, FormsModule, NgFor, MatOption, MatSelectTrigger, FaIconComponent, AsyncPipe]
})
export class ClanSettingsComponent extends ChildComponent {

  constructor(public state: ClanStateService,
    public dialog: MatDialog) {
    super();
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
