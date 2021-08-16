import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { StorageService } from '@app/service/storage.service';
import { GunRoll, GunRolls } from '@app/service/panda-godrolls.service';
import { ChildComponent } from '@app/shared/child.component';
import { MappedRoll, GunInfo, PerkbenchComponent } from '../perkbench.component';
import { BehaviorSubject } from 'rxjs';

const NORMAL_MW = ['Handling', 'Range', 'Reload Speed', 'Stability'];
const FUSION_MW = ['Charge Time', 'Handling', 'Range', 'Reload Speed', 'Stability'];
const SWORD_MW = ['Impact'];
const ROCKET_MW = ['Blast Radius', 'Handling', 'Reload Speed', 'Velocity']; // 'Stability','Range',


export enum ClickMode {
  GodRollPvP = 'God PvP',
  GoodRollPvP = 'Good PvP',
  GodRollPvE = 'God PvE',
  GoodRollPvE = 'Good PvE'
}

function buildEmptyRoll(): GunRoll {
  return {
    masterwork: [],
    greatPerks: [],
    goodPerks: []
  };
}

function removeStringFromList(list: string[], target: string) {
  const i = list.indexOf(target);
  if (i >= 0) {
    list.splice(i, 1);
  }
}

function buildEmptyGunRolls(name: string, mnk: boolean, controller: boolean): GunRolls {
  return {
    name,
    sheet: 'perkbench',
    pve: buildEmptyRoll(),
    pvp: buildEmptyRoll(),
    mnk,
    controller
  };
}


@Component({
  selector: 'd2c-perk-bench-dialog',
  templateUrl: './perk-bench-dialog.component.html',
  styleUrls: ['./perk-bench-dialog.component.scss']
})
export class PerkBenchDialogComponent extends ChildComponent implements OnInit {
  clickModeEnum = ClickMode;
  clickMode = ClickMode.GodRollPvE;

  parent: PerkbenchComponent;
  mwOptions = NORMAL_MW;
  r: MappedRoll;

  pve$: BehaviorSubject<GunRoll> = new BehaviorSubject(null);
  pvp$: BehaviorSubject<GunRoll> = new BehaviorSubject(null);
  info: GunInfo;
  maxPlugs = 0;

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public dialogRef: MatDialogRef<PerkBenchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    super(storageService);
    this.r = data.item;
    const name = data.name;
    this.parent = data.parent;
    this.info = this.r.info;
    if (this.r.roll == null) {
      this.r.roll = {
        controller: buildEmptyGunRolls(name, false, true),
        mnk: buildEmptyGunRolls(name, true, false)
      };
    }
    if (this.r.roll.controller == null) {
      this.r.roll.controller = buildEmptyGunRolls(name, false, true);
    }
    if (this.r.roll.mnk == null) {
      this.r.roll.mnk = buildEmptyGunRolls(name, true, false);
    }
    if (this.r.roll.controller.pve == null) {
      this.r.roll.controller.pve = buildEmptyRoll();
    }
    if (this.r.roll.controller.pvp == null) {
      this.r.roll.controller.pvp = buildEmptyRoll();
    }
    if (this.r.roll.mnk.pve == null) {
      this.r.roll.mnk.pve = buildEmptyRoll();
    }
    if (this.r.roll.mnk.pvp == null) {
      this.r.roll.mnk.pvp = buildEmptyRoll();
    }
    if (this.r.info.type == 'Sword') {
      this.mwOptions = SWORD_MW;
    } else if (this.r.info.type == 'Fusion Rifle') {
      this.mwOptions = FUSION_MW;
    } else if (this.r.info.type == 'Rocket Launcher') {
      this.mwOptions = ROCKET_MW;
    } else {
      this.mwOptions = NORMAL_MW;
    }

    for (const s of this.r.info.sockets) {
      if (s.possiblePlugs.length > this.maxPlugs) {
        this.maxPlugs = s.possiblePlugs.length;
      }
    }
    this.updatePlatform();

  }

  updatePlatform() {
    if (this.parent.isController) {
      this.pve$.next(this.r.roll.controller.pve);
      this.pvp$.next(this.r.roll.controller.pvp);
    } else {
      this.pve$.next(this.r.roll.mnk.pve);
      this.pvp$.next(this.r.roll.mnk.pvp);
    }
  }

  makeArray(n: number): any[] {
    return Array(n);
  }


  ngOnInit() {
  }


  onMwCheckChange(checked: boolean, mw: string, mws: string[]) {
    mw = mw.toLowerCase();
    if (checked) {
      mws.push(mw);
    } else {
      removeStringFromList(mws, mw);
    }
  }

  togglePerk(perk: string) {
    let addToMe: string[] = null;
    let removeFromMe: string[] = null;
    if (this.clickMode === ClickMode.GodRollPvE) {
      const perks = this.pve$.getValue();
      addToMe = perks.greatPerks;
      removeFromMe = perks.goodPerks;
    } else if (this.clickMode === ClickMode.GoodRollPvE) {
      const perks = this.pve$.getValue();
      removeFromMe = perks.greatPerks;
      addToMe = perks.goodPerks;
    } else if (this.clickMode === ClickMode.GodRollPvP) {
      const perks = this.pvp$.getValue();
      addToMe = perks.greatPerks;
      removeFromMe = perks.goodPerks;
    } else if (this.clickMode === ClickMode.GoodRollPvP) {
      const perks = this.pvp$.getValue();
      removeFromMe = perks.greatPerks;
      addToMe = perks.goodPerks;
    }
    // this is an uncheck
    if (addToMe.includes(perk)) {
      removeStringFromList(addToMe, perk);
    } else {
      removeStringFromList(removeFromMe, perk);
      addToMe.push(perk);
    }
  }

  clearRoll() {
    if (this.parent.isController) {
      this.r.roll.controller = buildEmptyGunRolls(this.data.name, false, true);
    } else {
      this.r.roll.mnk = buildEmptyGunRolls(this.data.name, false, true);
    }
    this.updatePlatform();
  }

}
