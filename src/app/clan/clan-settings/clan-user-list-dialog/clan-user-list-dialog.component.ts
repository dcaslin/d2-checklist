import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { BungieGroupMember } from '@app/service/model';
import { ClanUserList } from '@app/clan/clan-state.service';
import * as moment from 'moment';

@Component({
  selector: 'd2c-clan-user-list-dialog',
  templateUrl: './clan-user-list-dialog.component.html',
  styleUrls: ['./clan-user-list-dialog.component.scss']
})
export class ClanUserListDialogComponent extends ChildComponent implements OnInit {
  public today =  moment(new Date());
  public title: string;
  public desc: string;
  public users: BungieGroupMember[];

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<ClanUserListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClanUserList) {
      super(storageService);
      this.title = data.title;
      this.desc = data.desc;
      this.users = data.users;

    }

  ngOnInit() {
  }

}
