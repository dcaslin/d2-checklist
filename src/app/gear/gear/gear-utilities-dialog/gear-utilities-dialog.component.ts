import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, FormsModule } from '@angular/forms';
import { ErrorStateMatcher, MatOption } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatSelectChange, MatSelect } from '@angular/material/select';
import { IconService } from '@app/service/icon.service';
import { DimSyncChoice, MarkService } from '@app/service/mark.service';
import { GearComponent } from '../gear.component';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatButton, MatAnchor } from '@angular/material/button';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { RouterLink } from '@angular/router';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';

interface DimSyncOption {
  text: string;
  description: string;
  value: DimSyncChoice;
}

export class InstantMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid);
  }
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-gear-utilities-dialog',
    templateUrl: './gear-utilities-dialog.component.html',
    styleUrls: ['./gear-utilities-dialog.component.scss'],
    standalone: true,
    imports: [CdkScrollable, MatDialogContent, NgIf, MatProgressSpinner, MatTabGroup, MatTab, FormsModule, MatFormField, MatSelect, NgFor, MatOption, MatError, MatButton, FaIconComponent, MatAnchor, RouterLink, MatRadioGroup, MatRadioButton, AsyncPipe, DatePipe]
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
  ];
  public dimSyncChoice: DimSyncChoice = null;
  public dimSyncOption = this.dimSyncChoices[0];
  public matcher = new InstantMatcher();

  constructor(
    public markService: MarkService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<GearUtilitiesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.dimSyncChoice = this.markService.currentMarks$.getValue()?.dimSyncChoice!;
    this.dimSyncOption = this.getOptionFromValue();
    this.parent = data.parent;
    this.data = data;
  }

  private getOptionFromValue(): DimSyncOption {
    return this.dimSyncChoices.find(x => x.value == this.dimSyncChoice)!;
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
}
