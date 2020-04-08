import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'd2c-quest-dialog',
  templateUrl: './quest-dialog.component.html',
  styleUrls: ['./quest-dialog.component.scss']
})
export class QuestDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit() {
  }

}
