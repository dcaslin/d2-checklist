import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { GearComponent } from '../gear.component';
import { MarkService } from '@app/service/mark.service';
import { faGameConsoleHandheld } from '@fortawesome/pro-light-svg-icons';
import { DimSyncService } from '@app/service/dim-sync.service';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gear-utilities-dialog',
  templateUrl: './gear-utilities-dialog.component.html',
  styleUrls: ['../gear.component.scss']
})
export class GearUtilitiesDialogComponent {
  parent: GearComponent;
  constructor(
    private markService: MarkService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    private dimSyncService: DimSyncService,
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

  async importTagsFromDIM() {
    window.alert('Coming soon');
    const tags = await this.dimSyncService.getDimTags();
    console.dir(tags);

  }

  async exportTagsToDIM() {
    
    window.alert('Coming soon');
    // await this.dimSyncService.setDimTags(['6917529202015898222'], [{
    //   id: '6917529119282334710',
    //   tag: 'keep',
    //   notes: 'This was generated from the API'
    // }]);

  }
}
