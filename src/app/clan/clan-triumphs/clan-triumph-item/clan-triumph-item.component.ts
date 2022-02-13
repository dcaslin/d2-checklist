import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanTriumphItemDialogComponent } from '../clan-triumph-item-dialog/clan-triumph-item-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-triumph-item',
  templateUrl: './clan-triumph-item.component.html',
  styleUrls: ['./clan-triumph-item.component.scss']
})
export class ClanTriumphItemComponent extends ChildComponent {

  @Input()
  triumph: ClanSearchableTriumph;


  constructor(storageService: StorageService, public state: ClanStateService,
    public iconService: IconService,
    public dialog: MatDialog) {
    super(storageService);
  }

  

  public openTriumphDialog(triumph: ClanSearchableTriumph): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = triumph;
    this.dialog.open(ClanTriumphItemDialogComponent, dc);
  }

}
