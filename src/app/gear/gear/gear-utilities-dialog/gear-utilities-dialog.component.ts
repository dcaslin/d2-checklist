import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { GearComponent } from '../gear.component';
import { MarkService } from '@app/service/mark.service';
import { faGameConsoleHandheld } from '@fortawesome/pro-light-svg-icons';


@Component({
  selector: 'd2c-gear-utilities-dialog',
  templateUrl: './gear-utilities-dialog.component.html',
  styleUrls: ['../gear.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GearUtilitiesDialogComponent {
  parent: GearComponent;
  constructor(
    private markService: MarkService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
  }

  async importTagsFromFile(fileInputEvent: any) {
    const files = fileInputEvent.target.files;
    if (files == null || files.length == 0) {
      return;
    }
    const file = files[0];
    const success = await this.markService.restoreMarksFromFile(file);
    if (success) {
      this.parent.load(true);
    }
  }

  exportTagsToFile() {
    this.markService.downloadMarks();
  }

  importTagsFromDIM() {
    window.alert('Coming soon');
  }

  exportTagsToDIM() {
    window.alert('Coming soon');
  }
}
