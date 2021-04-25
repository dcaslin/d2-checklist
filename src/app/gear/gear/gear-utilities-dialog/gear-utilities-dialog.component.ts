import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { IconService } from '@app/service/icon.service';
import { DimSyncChoice, MarkService } from '@app/service/mark.service';
import { GearComponent } from '../gear.component';

interface DimSyncOption {
  text: string;
  description: string;
  value: DimSyncChoice;
}

export class InstantMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return control && control.invalid;
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-gear-utilities-dialog',
  templateUrl: './gear-utilities-dialog.component.html',
  styleUrls: ['./gear-utilities-dialog.component.scss']
})
export class GearUtilitiesDialogComponent {
  parent: GearComponent;

  public dimSyncChoices: DimSyncOption[] = [
    {
      text: 'No choice',
      description: 'Please select a choice',
      value: null
    },
    {
      text: 'Enabled',
      description: 'Sync tags and notes with DIM. In the event of a conflict, assume D2Checklist is right.',
      value: 'enabled'
    },
    {
      text: 'Disabled',
      description: 'Do not send data to DIM-sync',
      value: 'disabled'
    }
    // {
    //   text: 'Enabled - DIM preferred',
    //   description: 'Sync tags and notes with DIM. In the event of a conflict, assume DIM is right',
    //   value: 'dim-first'
    // }
  ];
  public dimSyncChoice: DimSyncChoice = null;
  public dimSyncOption = this.dimSyncChoices[0];
  public matcher = new InstantMatcher();

  constructor(
    public markService: MarkService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.dimSyncChoice = this.markService.currentMarks$.getValue().dimSyncChoice;
    this.dimSyncOption = this.getOptionFromValue();
    this.parent = data.parent;
  }

  private getOptionFromValue(): DimSyncOption {
    return this.dimSyncChoices.find(x => x.value == this.dimSyncChoice);
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

  async dimSyncChosen(event: MatSelectChange) {
    this.dimSyncOption = this.getOptionFromValue();
    if (this.dimSyncChoice == 'enabled') {
      // if they're switching to enable DIM sync, auto download a backup of their tags
      // this.exportTagsToFile();
      const success = await this.markService.doInitialDimSync();
      console.log(`Initial sync success: ${success}`);
      // refresh marks
      if (success) {
        this.parent.load(true);
      }
    } else {
      // turn it off
      await this.markService.disableDimSync(this.dimSyncChoice);
    }
  }

  exportTagsToFile() {
    this.markService.downloadMarks();
  }

  // async importTagsFromDIM(includeDelete?: boolean) {
  //   const success = await this.markService.importTagsFromDim(includeDelete === true);
  //   if (success) {
  //     this.parent.load(true);
  //   }
  // }

  // async exportTagsToDIM(includeDelete?: boolean) {
  //   await this.markService.exportTagsToDim(includeDelete === true);
  // }

}
