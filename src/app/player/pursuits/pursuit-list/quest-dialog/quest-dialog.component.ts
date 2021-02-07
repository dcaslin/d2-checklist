import { Component, OnInit, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChildComponent } from '@app/shared/child.component';
import { StorageService } from '@app/service/storage.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-quest-dialog',
  templateUrl: './quest-dialog.component.html',
  styleUrls: ['./quest-dialog.component.scss']
})
export class QuestDialogComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { 
      super(storageService);
    }

  ngOnInit() {
  }

}
