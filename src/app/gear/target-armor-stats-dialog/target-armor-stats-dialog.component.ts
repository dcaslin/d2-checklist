import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GearComponent } from '../gear/gear.component';
import { TargetPerkService, TargetPerks } from '@app/service/target-perk.service';
import { Choice } from '../gear/gear-toggle.component';
import { PreferredStats, PreferredStatService } from '@app/service/preferred-stat.service';

@Component({
  selector: 'd2c-target-armor-stats-dialog',
  templateUrl: './target-armor-stats-dialog.component.html',
  styleUrls: ['./target-armor-stats-dialog.component.scss']
})
export class TargetArmorStatsDialogComponent implements OnInit {
  parent: GearComponent;
  preferred: PreferredStats;
  targetChoices: string[];

  constructor(
    public preferredStatService: PreferredStatService,
    public dialogRef: MatDialogRef<TargetArmorStatsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    this.preferred = this.preferredStatService.stats.value;
    dialogRef.afterClosed().subscribe(result => {
      this.preferredStatService.update(this.preferred);
    });
  }

  ngOnInit() { }
}

