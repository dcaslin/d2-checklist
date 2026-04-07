import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ChildComponent } from '@app/shared/child.component';
import { ClanStateService, ClanAggHistoryEntry } from '../clan-state.service';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ClanLifetimeDialogComponent } from './clan-lifetime-dialog/clan-lifetime-dialog.component';
import { ClanUserListDialogComponent } from '../clan-settings/clan-user-list-dialog/clan-user-list-dialog.component';
import { IconService } from '@app/service/icon.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIf, NgTemplateOutlet, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { TimingPipe } from '../../shared/pipe/timing.pipe';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-clan-lifetime',
    templateUrl: './clan-lifetime.component.html',
    styleUrls: ['./clan-lifetime.component.scss'],
    imports: [NgIf, MatProgressBar, MatProgressSpinner, MatTabGroup, MatTab, NgTemplateOutlet, NgFor, MatButton, MatTooltip, FaIconComponent, RouterLink, TimingPipe, AsyncPipe, DecimalPipe]
})
export class ClanLifetimeComponent extends ChildComponent implements OnInit {

  constructor(public iconService: IconService,
    public state: ClanStateService,
    public dialog: MatDialog) {
    super();
  }

  ngOnInit() {
    this.state.allLoaded.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged(),
      filter(x => x)
      )
      .subscribe((done: boolean) => {
          this.state.loadAggHistory();
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
