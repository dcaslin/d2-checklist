import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA as MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DestinyClasses } from '@app/service/model';
import { DetailedPreferredStats, PreferredStatService } from '@app/service/preferred-stat.service';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { NgFor } from '@angular/common';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'd2c-target-armor-stats-dialog',
    templateUrl: './target-armor-stats-dialog.component.html',
    styleUrls: ['./target-armor-stats-dialog.component.scss'],
    imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatTabGroup, NgFor, MatTab, MatSlider, MatSliderThumb, FormsModule, MatCheckbox, MatDialogActions, MatButton]
})
export class TargetArmorStatsDialogComponent {
  preferred: DetailedPreferredStats;
  targetChoices!: string[];
  destinyClasses = DestinyClasses;

  constructor(
    public preferredStatService: PreferredStatService,
    public dialogRef: MatDialogRef<TargetArmorStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.preferred = this.preferredStatService.stats$.value;
    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      if (result === 'Save') {
        this.preferredStatService.update(this.preferred);
      } else if (result === 'Reset') {
        this.preferredStatService.reset();
      }
    });
  }

  closeReset() {
    this.dialogRef.close('Reset');
  }

  closeSave() {
    this.dialogRef.close('Save');
  }

  closeCancel() {
    this.dialogRef.close(false);
  }


  toggle(evt: MatSlideToggleChange, destinyClass: string, statName: string) {
    this.preferred.stats[destinyClass][statName] = evt.checked ? 100 : 0;
  }
}

