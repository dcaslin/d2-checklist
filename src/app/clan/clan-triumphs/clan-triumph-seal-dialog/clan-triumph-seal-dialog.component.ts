import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClanSeal, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-triumph-seal-dialog',
  templateUrl: './clan-triumph-seal-dialog.component.html',
  styleUrls: ['./clan-triumph-seal-dialog.component.scss']
})
export class ClanTriumphSealDialogComponent extends ChildComponent {
  sort: Sort = {
    name: 'pct',
    ascending: false
  };

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortSeals(this.seal, this.sort);

  }

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<ClanTriumphSealDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public seal: ClanSeal) {
      super(storageService);
      ClanStateService.sortSeals(this.seal, this.sort);

    }

  

}
