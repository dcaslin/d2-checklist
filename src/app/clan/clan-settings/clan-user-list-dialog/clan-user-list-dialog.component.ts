import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { ClanUserList } from '@app/clan/clan-state.service';
import { BungieGroupMember } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgFor } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AgoHumanizedPipe } from '../../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-user-list-dialog',
    templateUrl: './clan-user-list-dialog.component.html',
    styleUrls: ['./clan-user-list-dialog.component.scss'],
    standalone: true,
    imports: [CdkScrollable, MatDialogContent, NgFor, RouterLink, AgoHumanizedPipe]
})
export class ClanUserListDialogComponent extends ChildComponent {
  public title: string;
  public desc: string;
  public users: BungieGroupMember[];

  constructor(
    public dialogRef: MatDialogRef<ClanUserListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClanUserList) {
      super();
      this.title = data.title;
      this.desc = data.desc;
      this.users = data.users;

    }

  

}
