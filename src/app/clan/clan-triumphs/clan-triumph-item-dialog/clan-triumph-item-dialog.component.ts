import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClanSearchableTriumph, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-triumph-item-dialog',
  templateUrl: './clan-triumph-item-dialog.component.html',
  styleUrls: ['./clan-triumph-item-dialog.component.scss']
})
export class ClanTriumphItemDialogComponent extends ChildComponent {
  sort: Sort = {
    name: 'pct',
    ascending: false
  };


  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<ClanTriumphItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public triumph: ClanSearchableTriumph) {
    super(storageService);

  }


  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortTriumphs(this.triumph, this.sort);
  }


  

}
