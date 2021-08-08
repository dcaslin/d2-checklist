import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InventoryItem } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '../child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-for-sale-pursuit-dialog',
  templateUrl: './for-sale-pursuit-dialog.component.html',
  styleUrls: ['./for-sale-pursuit-dialog.component.scss']
})
export class ForSalePursuitDialogComponent extends ChildComponent implements OnInit {

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<ForSalePursuitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InventoryItem) {
      super(storageService);
    }

  ngOnInit() {
  }

}