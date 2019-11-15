
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { PGCR, Player } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-pgcr-history',
  templateUrl: './pgcr.component.html',
  styleUrls: ['./pgcr.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PGCRComponent extends ChildComponent implements OnInit, OnDestroy {

  instanceId: string;
  // array for cheap asyn unwraps
  public pgcr: BehaviorSubject<PGCR> = new BehaviorSubject(null);
  public avgGlory: BehaviorSubject<number> = new BehaviorSubject(null);
  public players: BehaviorSubject<{ [key: string]: Player }> = new BehaviorSubject({});
  private playerCntr=0; // we need this b/c a single player could rejoin and break out dictionary

  constructor(storageService: StorageService, private bungieService: BungieService,
    public iconService: IconService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  private setAggGlory() {
    console.log('Set agg glory');
    const x = this.pgcr.getValue();
    const ps = this.players.getValue();
    let totalGlory = 0;

    if (x) {
      
      for (const team of x.teams) {
        team.totalGlory = 0;
        team.size = 0;
      }
      for (const entry of x.entries) {
        if (ps[entry.user.membershipId]) {
          if (ps[entry.user.membershipId].glory) {
            totalGlory += ps[entry.user.membershipId].glory.currentProgress;
            for (const team of x.teams) {
              if (team.name == entry.team) {
                team.totalGlory += ps[entry.user.membershipId].glory.currentProgress;
                team.size++;
              }
            }
          }
        }
      }
      for (const team of x.teams) {
        team.avgGlory = team.totalGlory / team.size;
        console.log(team.avgGlory);
      }
    }
    const avg = totalGlory / x.entries.length;
    this.pgcr.next(x);
    this.avgGlory.next(avg);
  }

  private async load() {
    this.pgcr.next(null);
    this.players.next({});
    this.avgGlory.next(null);
    this.playerCntr = 0;
    this.loading.next(true);
    try {
      const x = await this.bungieService.getPGCR(this.instanceId);
      this.pgcr.next(x);
      if (x && x.entries) {
        for (const entry of x.entries) {
          this.bungieService.getChars(entry.user.membershipType, entry.user.membershipId, ['Profiles', 'Characters', 'CharacterProgressions'], false).then(p => {
            this.playerCntr++;
            const ps = this.players.getValue();
            ps[entry.user.membershipId] = p;

            // are we done?
            if (this.playerCntr >= x.entries.length) {
              this.setAggGlory();
            }
            this.players.next(ps);
          });
        }
      }
    }
    finally {
      this.loading.next(false);
    }
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.instanceId = params['instanceId'];
      this.load();
    });
  }
}
