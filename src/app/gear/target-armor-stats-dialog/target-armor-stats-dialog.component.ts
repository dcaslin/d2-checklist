import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { MatLegacySlideToggleChange as MatSlideToggleChange } from '@angular/material/legacy-slide-toggle';
import { DestinyClasses } from '@app/service/model';
import { DetailedPreferredStats, PreferredStatService } from '@app/service/preferred-stat.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-target-armor-stats-dialog',
  templateUrl: './target-armor-stats-dialog.component.html',
  styleUrls: ['./target-armor-stats-dialog.component.scss']
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

