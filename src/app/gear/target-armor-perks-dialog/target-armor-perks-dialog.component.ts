import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GearComponent } from '../gear/gear.component';
import { TargetPerkService, TargetPerks } from '@app/service/target-perk.service';

@Component({
  selector: 'anms-target-armor-perks-dialog',
  templateUrl: './target-armor-perks-dialog.component.html',
  styleUrls: ['./target-armor-perks-dialog.component.scss']
})
export class TargetArmorPerksDialogComponent implements OnInit {
  parent: GearComponent;
  target: TargetPerks;

  constructor(
    private targetPerkService: TargetPerkService,
    public dialogRef: MatDialogRef<TargetArmorPerksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    this.target = this.targetPerkService.perks.value;
    dialogRef.afterClosed().subscribe(result => {
      this.targetPerkService.update(this.target);
    });
  }

  ngOnInit() {

  }

}
