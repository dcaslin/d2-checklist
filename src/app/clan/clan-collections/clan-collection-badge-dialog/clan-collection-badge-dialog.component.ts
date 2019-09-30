import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ClanBadge, ClanStateService } from '@app/clan/clan-state.service';

import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Sort } from '@app/service/model';

@Component({
  selector: 'd2c-clan-collection-badge-dialog',
  templateUrl: './clan-collection-badge-dialog.component.html',
  styleUrls: ['./clan-collection-badge-dialog.component.scss']
})
export class ClanCollectionBadgeDialogComponent  extends ChildComponent implements OnInit {
  sort: Sort = {
    name: 'pct',
    ascending: false
  };

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<ClanCollectionBadgeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public badge: ClanBadge) {
    super(storageService);
    ClanStateService.sortBadges(this.badge, this.sort);
  }

  ngOnInit() {
  }

  sortData(field: string) {
    if (field === this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort.ascending = true;
      this.sort.name = field;
    }
    ClanStateService.sortBadges(this.badge, this.sort);
  }


}
