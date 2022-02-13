import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSearchableCollection, ClanStateService } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanCollectionItemDialogComponent } from '../clan-collection-item-dialog/clan-collection-item-dialog.component';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-collection-item',
  templateUrl: './clan-collection-item.component.html',
  styleUrls: ['./clan-collection-item.component.scss']
})
export class ClanCollectionItemComponent extends ChildComponent {

  @Input()
  item: ClanSearchableCollection;


  constructor(storageService: StorageService, public state: ClanStateService,
    public dialog: MatDialog) {
    super(storageService);
  }

  public openDialog(item: ClanSearchableCollection): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = item;
    this.dialog.open(ClanCollectionItemDialogComponent, dc);
  }

}
