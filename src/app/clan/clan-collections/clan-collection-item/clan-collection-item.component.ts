import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSearchableCollection, ClanStateService } from '@app/clan/clan-state.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanCollectionItemDialogComponent } from '../clan-collection-item-dialog/clan-collection-item-dialog.component';
import { NgIf } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';


@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-collection-item',
    templateUrl: './clan-collection-item.component.html',
    styleUrls: ['./clan-collection-item.component.scss'],
    standalone: true,
    imports: [NgIf, MatButton, MatProgressBar]
})
export class ClanCollectionItemComponent extends ChildComponent {

  @Input()
  item!: ClanSearchableCollection;


  constructor(public state: ClanStateService,
    public dialog: MatDialog) {
    super();
  }

  public openDialog(item: ClanSearchableCollection): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = item;
    this.dialog.open(ClanCollectionItemDialogComponent, dc);
  }

}
