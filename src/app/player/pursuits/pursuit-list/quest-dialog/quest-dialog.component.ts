import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent } from '@angular/material/dialog';
import { Questline } from '@app/service/model';
import { ChildComponent } from '@app/shared/child.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgFor, NgIf } from '@angular/common';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-quest-dialog',
    templateUrl: './quest-dialog.component.html',
    styleUrls: ['./quest-dialog.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, NgFor, NgIf]
})
export class QuestDialogComponent extends ChildComponent {

  constructor(
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Questline) {
      super();
    }

  

}
