import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IconService } from '@app/service/icon.service';
import { Bonus, BoostInfo, BUCKETS_ALL_POWER, Character, Const } from '@app/service/model';
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
export class PlBucketDialogComponent extends ChildComponent {
  public character$: BehaviorSubject<Character> = new BehaviorSubject<Character>(null);
  private characterId: string;
  public BUCKETS_ALL_POWER = BUCKETS_ALL_POWER;
  public boosts: BoostInfo[];
  public minBest = 0;
  public maxBest = 0;

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
    let dropValue = basePl + bonus.bonus;

    // if we're at 1298 and the reported bonus +5 that will take us to 1303
    // but it should really be 1300
    // so recalc as if we're at 1300
    if (basePl < Const.SEASON_HARD_CAP && dropValue > Const.SEASON_HARD_CAP) {
      const specialBonus = PlBucketDialogComponent.getBonus(Const.SEASON_HARD_CAP, boost);
      return Const.SEASON_HARD_CAP + specialBonus.bonus;
    }
    if (dropValue>Const.SEASON_PINNACLE_CAP) {
      dropValue = Const.SEASON_PINNACLE_CAP;
    }
    return dropValue;


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
        for (const bucketHash of BUCKETS_ALL_POWER) {
          const best = char.bestPlGear[bucketHash];
          if (!best) {
            continue;
          }
          if (!this.maxBest || (best.power > this.maxBest)) {
            this.maxBest = best.power;
          }
          if (!this.minBest || (best.power < this.minBest)) {
            this.minBest = best.power;
          }
        }
        if (this.minBest === this.maxBest) {
          this.minBest = 0;
        }
      }
    });

  }

}
