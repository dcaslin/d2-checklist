import { Component, Inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PreferredStats, PreferredStatService } from '@app/service/preferred-stat.service';
import { GearComponent } from '../gear/gear.component';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DestinyClasses } from '@app/service/model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'd2c-target-armor-stats-dialog',
  templateUrl: './target-armor-stats-dialog.component.html',
  styleUrls: ['./target-armor-stats-dialog.component.scss']
})
export class TargetArmorStatsDialogComponent implements OnInit {
  parent: GearComponent;
  preferred: PreferredStats;
  targetChoices: string[];
  destinyClasses = DestinyClasses;

  constructor(
    public preferredStatService: PreferredStatService,
    public dialogRef: MatDialogRef<TargetArmorStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    this.preferred = this.preferredStatService.stats.value;
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


  ngOnInit() { }

  toggle(evt: MatSlideToggleChange, destinyClass: string, statName: string) {
    this.preferred.stats[destinyClass][statName] = evt.checked;
  }
}

