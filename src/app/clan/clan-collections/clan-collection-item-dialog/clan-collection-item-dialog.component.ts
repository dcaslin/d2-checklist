import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClanSearchableCollection, ClanStateService } from '@app/clan/clan-state.service';
import { IconService } from '@app/service/icon.service';
import { Sort } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-clan-collection-item-dialog',
  templateUrl: './clan-collection-item-dialog.component.html',
  styleUrls: ['./clan-collection-item-dialog.component.scss']
})
export class ClanCollectionItemDialogComponent extends ChildComponent {
  sort: Sort = {
    name: 'name',
    ascending: true
  };

  constructor(
    public iconService: IconService,
    public dialogRef: MatDialogRef<ClanCollectionItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public item: ClanSearchableCollection) {
    super();
    ClanStateService.sortCollectibles(this.item, this.sort);
  }

  

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortCollectibles(this.item, this.sort);
  }


}
