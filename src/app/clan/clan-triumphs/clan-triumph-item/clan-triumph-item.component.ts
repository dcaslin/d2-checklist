import { ChangeDetectionStrategy, Component, OnInit, Input } from '@angular/core';
import { ClanStateService, ClanSearchableTriumph } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { MatDialogConfig, MatDialog } from '@angular/material';
import { ClanTriumphItemDialogComponent } from '../clan-triumph-item-dialog/clan-triumph-item-dialog.component';

@Component({
  selector: 'd2c-clan-triumph-item',
  templateUrl: './clan-triumph-item.component.html',
  styleUrls: ['./clan-triumph-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanTriumphItemComponent extends ChildComponent implements OnInit {

  @Input()
  triumph: ClanSearchableTriumph;


  constructor(storageService: StorageService, public state: ClanStateService,
    public dialog: MatDialog) {
    super(storageService);
  }

  ngOnInit() {
  }

  public openTriumphDialog(triumph: ClanSearchableTriumph): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = triumph;
    const dialogRef = this.dialog.open(ClanTriumphItemDialogComponent, dc);
  }

}
