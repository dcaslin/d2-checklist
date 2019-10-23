import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GearComponent } from '../gear/gear.component';
import { TargetPerkService, TargetPerks } from '@app/service/target-perk.service';
import { Choice } from '../gear/gear-toggle.component';

@Component({
  selector: 'd2c-target-armor-perks-dialog',
  templateUrl: './target-armor-perks-dialog.component.html',
  styleUrls: ['./target-armor-perks-dialog.component.scss']
})
export class TargetArmorPerksDialogComponent implements OnInit {
  parent: GearComponent;
  target: TargetPerks;
  targetChoices: Choice[];

  constructor(
    public targetPerkService: TargetPerkService,
    public dialogRef: MatDialogRef<TargetArmorPerksDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parent = data.parent;
    const choices = this.parent.weaponTypeChoices.slice(0);
    choices.push(new Choice('Super', 'Super', true));
    choices.push(new Choice('Melee', 'Melee', true));
    choices.push(new Choice('Grenade', 'Grenade', true));
    choices.push(new Choice('Ability', 'Ability', true));
    this.targetChoices = choices;
    this.target = this.targetPerkService.perks.value;
    dialogRef.afterClosed().subscribe(result => {
      this.targetPerkService.update(this.target);
    });
  }

  ngOnInit() {

  }

}
