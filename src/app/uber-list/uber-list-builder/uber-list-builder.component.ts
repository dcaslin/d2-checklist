import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { SignedOnUserService } from '@app/service/signed-on-user.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { ForSalePursuitDialogComponent } from '@app/shared/for-sale-pursuit-dialog/for-sale-pursuit-dialog.component';
import { MilestoneRow, PursuitRow, UberListStateService } from '../uber-list-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-uber-list-builder',
  templateUrl: './uber-list-builder.component.html',
  styleUrls: ['./uber-list-builder.component.scss']
})
export class UberListBuilderComponent extends ChildComponent implements OnInit {

  constructor(
    public state: UberListStateService,
    public signedOnUserService: SignedOnUserService,
    public iconService: IconService,
    private dialog: MatDialog,
    storageService: StorageService
  ) {
    super(storageService);
  }

  trackUberRow(index, item: (MilestoneRow|PursuitRow)): string {
    return item ? item.id : undefined;
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.state.refresh();
  }

  show(event, row: (MilestoneRow|PursuitRow)): void {
    event.preventDefault();
    const dc = new MatDialogConfig();
    dc.data = row.title;
    this.dialog.open(ForSalePursuitDialogComponent, dc);
  }
}
