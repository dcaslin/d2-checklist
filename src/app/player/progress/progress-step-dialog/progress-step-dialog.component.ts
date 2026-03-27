import { Component, Inject, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-progress-step-dialog',
  templateUrl: './progress-step-dialog.component.html',
  styleUrls: ['./progress-step-dialog.component.scss']
})
export class ProgressStepDialogComponent implements AfterViewInit {

  constructor(
    public dialogRef: MatDialogRef<ProgressStepDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }


  ngAfterViewInit() {
    const el = document.getElementById('stepRow' + this.data.level);
    if (el != null) {
      el.scrollIntoView(false);
    } else {
      console.log('Could not scroll into view');
    }
  }

}
