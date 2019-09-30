import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ClanSeal, ClanStateService, ClanAggHistoryEntry } from '@app/clan/clan-state.service';
import { Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  selector: 'd2c-clan-lifetime-dialog',
  templateUrl: './clan-lifetime-dialog.component.html',
  styleUrls: ['./clan-lifetime-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanLifetimeDialogComponent extends ChildComponent implements OnInit {
  sort: Sort = {
    name: 'name',
    ascending: true
  };

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortAggHistory(this.entry, this.sort);

  }

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<ClanLifetimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public entry: ClanAggHistoryEntry) {
      super(storageService);
      ClanStateService.sortAggHistory(this.entry, this.sort);
    }

  ngOnInit() {
  }

}
