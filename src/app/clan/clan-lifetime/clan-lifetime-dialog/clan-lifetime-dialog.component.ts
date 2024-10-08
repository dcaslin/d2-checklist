import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClanAggHistoryEntry, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-lifetime-dialog',
  templateUrl: './clan-lifetime-dialog.component.html',
  styleUrls: ['./clan-lifetime-dialog.component.scss']
})
export class ClanLifetimeDialogComponent extends ChildComponent {
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

  public toInt(s: string): number {
    return +s;
  }

  constructor(
    storageService: StorageService,
    public iconService: IconService, 
    public dialogRef: MatDialogRef<ClanLifetimeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public entry: ClanAggHistoryEntry) {
      super(storageService);
      ClanStateService.sortAggHistory(this.entry, this.sort);
    }

}
