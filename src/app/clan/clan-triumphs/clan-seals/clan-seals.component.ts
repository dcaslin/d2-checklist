import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ClanSeal, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ClanTriumphSealDialogComponent } from '../clan-triumph-seal-dialog/clan-triumph-seal-dialog.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-seals',
  templateUrl: './clan-seals.component.html',
  styleUrls: ['./clan-seals.component.scss']
})
export class ClanSealsComponent extends ChildComponent {
  openEntryId: string|null = null;

  constructor(storageService: StorageService,
    public state: ClanStateService,
    public iconService: IconService,
    public dialog: MatDialog) {
    super(storageService);
  }

  

  public opened(hash: string) {
    this.openEntryId = hash;
  }

  public openSealDialog(triumph: ClanSeal, event: MouseEvent): void {
    event.stopPropagation();
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = triumph;
    this.dialog.open(ClanTriumphSealDialogComponent, dc);
  }

}
