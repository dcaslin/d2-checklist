import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BountySetsDialogComponent } from '@app/home/bounty-sets-dialog/bounty-sets-dialog.component';
import { IconService } from '@app/service/icon.service';
import { Character, BUCKETS_ALL_POWER, BoostInfo, Const, Bonus } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import { ChildComponent } from '@app/shared/child.component';
import { sortByField } from '@app/shared/utilities';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PlayerStateService } from '../player-state.service';

@Component({
  selector: 'd2c-pl-bucket-dialog',
  templateUrl: './pl-bucket-dialog.component.html',
  styleUrls: ['./pl-bucket-dialog.component.scss']
})
export class PlBucketDialogComponent extends ChildComponent implements OnInit {
  public character$: BehaviorSubject<Character> = new BehaviorSubject<Character>(null);
  private characterId: string;
  public BUCKETS_ALL_POWER = BUCKETS_ALL_POWER;
  public boosts: BoostInfo[];

  private static getBonus(basePl: number, boost: BoostInfo): Bonus {
    if (basePl >= Const.SEASON_HARD_CAP) {
      return boost.afterHardCap;
    }
    return boost.upToHardCap;
  }

  public static isEqualBonus(basePl: number, boost: BoostInfo) {
    const bonus = PlBucketDialogComponent.getBonus(basePl, boost);
    if (bonus == null) {
      return true;
    } else if (bonus.min == null) {
      return true;
    } else if (bonus.min == bonus.max) {
      return true;
    }
    return false;
  }

  public getSingleDropValue(basePl: number, boost: BoostInfo) {

    const bonus = PlBucketDialogComponent.getBonus(basePl, boost);
    if (bonus == null) {
      return Const.SEASON_HARD_CAP;
    }
    return basePl + bonus.bonus;

  }

  constructor(
    storageService: StorageService,
    public iconService: IconService,
    public playerStateService: PlayerStateService,
    public dialogRef: MatDialogRef<PlBucketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    super(storageService);
    this.characterId = data.characterId;
    const boosts: BoostInfo[] = [];
    for (const key of Object.keys(Const.BOOST_DROP_TABLE)) {
      const row = Const.BOOST_DROP_TABLE[key];
      if (!row.hideFromTable) {
        boosts.push(row);
      }
    }
    boosts.sort(sortByField('sortVal', true, parseInt));
    this.boosts = boosts;
    this.playerStateService.player.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe(player => {
      if (player && player.characters && player.characters.length > 0) {
        const char = player.characters.find(c => c.characterId === this.characterId);
        this.character$.next(char);
      }
    });

  }

  ngOnInit(): void {
  }

}
