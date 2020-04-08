import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';
import { ClanStateService, ClanAggHistoryEntry } from '../clan-state.service';
import { takeUntil } from 'rxjs/operators';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ClanLifetimeDialogComponent } from './clan-lifetime-dialog/clan-lifetime-dialog.component';
import { ClanUserListDialogComponent } from '../clan-settings/clan-user-list-dialog/clan-user-list-dialog.component';
import { IconService } from '@app/service/icon.service';

@Component({
  selector: 'd2c-clan-lifetime',
  templateUrl: './clan-lifetime.component.html',
  styleUrls: ['./clan-lifetime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanLifetimeComponent extends ChildComponent implements OnInit {

  constructor(storageService: StorageService,
    public iconService: IconService,
    public state: ClanStateService,
    public dialog: MatDialog) {
    super(storageService);
  }

  ngOnInit() {
    this.state.allLoaded.pipe(
      takeUntil(this.unsubscribe$))
      .subscribe((done: boolean) => {
        if (done) {
          this.state.loadAggHistory();
        }
      });
  }



  public openDialog(entry: ClanAggHistoryEntry): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = entry;
    dc.minWidth = '50vw';
    this.dialog.open(ClanLifetimeDialogComponent, dc);
  }
  
  openIncompleteDialog(entry: ClanAggHistoryEntry) {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    dc.data = entry.notDone;
    this.dialog.open(ClanUserListDialogComponent, dc);
  }

}
