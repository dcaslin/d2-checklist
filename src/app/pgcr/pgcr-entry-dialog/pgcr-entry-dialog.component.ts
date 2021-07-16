import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { Entry } from '../pgcr2/pgcr2.component';

@Component({
  selector: 'd2c-pgcr-entry-dialog',
  templateUrl: './pgcr-entry-dialog.component.html',
  styleUrls: ['./pgcr-entry-dialog.component.scss']
})
export class PgcrEntryDialogComponent extends ChildComponent implements OnInit {
  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<PgcrEntryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public entry: Entry) {
      super(storageService);
    }

  ngOnInit() {
  }
}
