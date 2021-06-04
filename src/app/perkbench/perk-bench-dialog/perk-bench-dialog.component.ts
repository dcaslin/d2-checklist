import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { GunRoll, GunRolls } from '@app/service/panda-godrolls.service';
import { ChildComponent } from '@app/shared/child.component';
import { MappedRoll, GunInfo } from '../perkbench.component';

  const NORMAL_MW = ['Handling','Range','Reload Speed', 'Stability'];
  const FUSION_MW = ['Charge Time', 'Handling','Range','Reload Speed', 'Stability'];
  const SWORD_MW = ['Impact'];
  const ROCKET_MW = ['Blast Radius', 'Handling','Reload Speed', 'Velocity']; //'Stability','Range',

@Component({
  selector: 'd2c-perk-bench-dialog',
  templateUrl: './perk-bench-dialog.component.html',
  styleUrls: ['./perk-bench-dialog.component.scss']
})
export class PerkBenchDialogComponent extends ChildComponent implements OnInit {
  mwOptions = NORMAL_MW;
  r: MappedRoll;
  
  pve: GunRoll;
  pvp: GunRoll;
  info: GunInfo;
  isController: boolean;
  maxPlugs = 0;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<PerkBenchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super(storageService);
    this.r = data.item;
    this.info = this.r.info;
    this.isController = data.isController;
    if (this.r.roll == null) {
      this.r.roll = {
        "name": this.info.desc.displayProperties.name.toLowerCase().trim(),
        "sheet": "perkbench",
        "pve": null,
        "pvp": null,
        "mnk": !this.isController,
        "controller": this.isController,
        "version": 0
      }
    }
    if (this.r.roll.pve == null) {
      this.r.roll.pve = {
        "masterwork": [],
        "greatPerks": [],
        "goodPerks": []
      };
    }
    if (this.r.roll.pvp == null) {
      this.r.roll.pvp = {
        "masterwork": [],
        "greatPerks": [],
        "goodPerks": []
      };
    }
    this.pve = this.r.roll.pve;
    this.pvp = this.r.roll.pvp;
    if (this.r.info.type=='Sword') {
      this.mwOptions = SWORD_MW;
    }
    else if (this.r.info.type=='Fusion Rifle') {
      this.mwOptions = FUSION_MW;
    }
    else if (this.r.info.type=='Rocket Launcher') {
      this.mwOptions = ROCKET_MW;
    } else {
      this.mwOptions = NORMAL_MW;
    }

    for (const s of this.r.info.sockets) {
      if (s.possiblePlugs.length > this.maxPlugs) {
        this.maxPlugs = s.possiblePlugs.length;
      }
    }
  }

  makeArray(n: number): any[] {
    return Array(n);
  }


  ngOnInit() {
  }

}
