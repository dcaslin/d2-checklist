import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Questline } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-quest-dialog',
  templateUrl: './quest-dialog.component.html',
  styleUrls: ['./quest-dialog.component.scss']
})
export class QuestDialogComponent extends ChildComponent {

  constructor(
    storageService: StorageService,
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Questline) {
      super(storageService);
    }

  

}
