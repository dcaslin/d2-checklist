import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ClanSearchableTriumph } from '@app/clan/clan-state.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  selector: 'd2c-clan-triumph-item-dialog',
  templateUrl: './clan-triumph-item-dialog.component.html',
  styleUrls: ['./clan-triumph-item-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanTriumphItemDialogComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<ClanTriumphItemDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public triumph: ClanSearchableTriumph) {
      super(storageService);
    }

  ngOnInit() {
  }

}
