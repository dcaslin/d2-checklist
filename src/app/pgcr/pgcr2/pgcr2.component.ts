
import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconService } from '@app/service/icon.service';
import { PGCR, PGCREntry, PGCRTeam, Player, Const, Platform, PGCRWeaponData, PGCRExtraData } from '@app/service/model';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';
import { concat, from, Observable, of } from 'rxjs';
import { catchError, concatAll, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { StreamingChildComponent } from '@app/shared/streaming-child.component';
import { NotificationService } from '@app/service/notification.service';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { ParseService } from '@app/service/parse.service';
import { ɵPLATFORM_SERVER_ID } from '@angular/common';

@Component({
  selector: 'd2c-pgcr2',
  templateUrl: './pgcr2.component.html',
  styleUrls: ['./pgcr2.component.scss']
})
export class Pgcr2Component extends StreamingChildComponent implements OnInit, OnDestroy {
  public instanceId$: BehaviorSubject<string | null> = new BehaviorSubject(null);
  public game$: Observable<Game | null>;
  public pgcr$: BehaviorSubject<PGCR | null> = new BehaviorSubject(null);
  public teams$: BehaviorSubject<Team[]> = new BehaviorSubject([]);

  constructor(
    storageService: StorageService,
    httpClient: HttpClient,
    bungieService: BungieService,
    notificationService: NotificationService,
    public iconService: IconService,
    private destinyCacheService: DestinyCacheService,
    private route: ActivatedRoute) {
    super(storageService, httpClient, bungieService, notificationService);
    this.game$ = of(null);
  }

  private parsePGCREntry(e: any): Entry {

    const general: MedalOrStat[] = [];
    const medals: MedalOrStat[] = [];
    if (e.values) {
      // TODO
    }

    if (e.extended != null) {
      if (e.extended.values != null) {
        for (const key of Object.keys(e.extended.values)) {
          const desc: any = this.destinyCacheService.cache.HistoricalStats[key];
          if (!desc) {
            continue;
          }
          const val = e.extended.values[key];
          const basicVal = ParseService.getBasicValue(val);
          let statName = null;
          let statDesc = null;
          let statIcon = null;
          if (desc) {
            // desc.group 3 is medals, group 2 weapons, group 1 general
            statName = desc.statName;
            if (desc.statName && desc.statName.startsWith('###historicalstats.StatName_')) {
              const tempName = desc.statName.replace('###historicalstats.StatName_', '').replace(/([a-z])([A-Z])/g, '$1 $2').replace('###','');
              statName =  tempName.charAt(0).toUpperCase() + tempName.slice(1);
            }
            statDesc = desc.statDescription;
            statIcon = desc.iconImage;
          }
          const extraEntry: MedalOrStat = {
            value: basicVal,
            statDesc,
            statIcon,
            statName
          };
          if (desc.group==1) {
            general.push(extraEntry);
            console.log(`General ${statName}`);
          }
          if (desc.group==2) {
            console.log(`weapons ${statName}`);
          }
          if (desc.group==3) {
            medals.push(extraEntry);
            console.log(`medals ${statName}`);
          }
          // extra.push(extraEntry);
        }
      }
      if (e.extended.weapons != null) {
        // TODO
      }
    }
    return {
      general,
      medals
    };
  }

  public loadPGCR(instanceId: string): Observable<Game> {
    const url = 'https://stats.bungie.net/Platform/Destiny2/Stats/PostGameCarnageReport/' + instanceId + '/';
    const remoteReq = this.streamReq('loadVendors', url).pipe(
      map((resp) => {
        if (!resp?.activityDetails?.referenceId) {
          return null;
        }
        const desc: any = this.destinyCacheService.cache.Activity[resp.activityDetails.referenceId];
        if (!desc) {
          return null;
        }
        console.dir(desc);
        const mode = ParseService.lookupMode(resp.activityDetails.mode);
        const modes = desc.activityModeTypes;
        const viewMode = modes.indexOf(63) >= 0 ? ViewMode.GAMBIT : modes.indexOf(5) >= 0 ? ViewMode.PVP : ViewMode.PVE;
        const entries: Entry[] = [];
        for (const entry of resp.entries) {
          const parsedEntry = this.parsePGCREntry(entry);
          if (parsedEntry) {
            entries.push(parsedEntry);
          }
        }
        return {
          activityName: desc.displayProperties.name,
          activityLocation: desc.displayProperties.description,
          mode,
          period: resp?.period,
          pgcrImage: desc?.pgcrImage,
          isPrivate: resp.activityDetails.isPrivate,
          viewMode: viewMode,
          entries: entries
        };
      })
    );
    return remoteReq;
  }

  private async load(instanceId: string): Promise<void> {
    this.instanceId$.next(instanceId);
    this.game$ = this.loadPGCR(instanceId);
    // const x = await this.bungieService.getPGCR(instanceId);
    // const teams: Team[] = [];
    // if (x) {
    //   for (const team of x.teams) {
    //     teams.push({
    //       team,
    //       entries: []
    //     });
    //   }
    // }
    // teams.sort((a, b) => a.team.name.localeCompare(b.team.name));
    // let firstTeamNameDone = false;
    // for (const team of teams) {
    //   if (team.team.name !== 'Alpha' && team.team.name !== 'Bravo') {
    //     team.team.name = firstTeamNameDone ? 'Bravo' : 'Alpha';
    //   }
    //   firstTeamNameDone = true;
    //   for (const entry of x.entries) {
    //     if (entry.team == team.team.id) {
    //       team.entries.push(entry);
    //     }
    //   }
    // }
    // this.pgcr$.next(x);
    // this.teams$.next(teams);
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const instanceId = params['instanceId'];
      this.load(instanceId);
    });
  }

}

interface Team {
  team: PGCRTeam;
  entries: PGCREntry[];
}

interface Game {
  activityName: string;
  activityLocation: string;
  mode: string;
  period: string;
  pgcrImage: string;
  isPrivate: boolean;
  viewMode: ViewMode;
  entries: Entry[];
}

enum ViewMode {
  PVE = 'PVE',
  PVP = 'PVP',
  GAMBIT = 'GAMBIT'
}


export interface MedalOrStat {
  value: number;
  statName: string;
  statDesc: string;
  statIcon: string;
}

export class Entry {
  medals: MedalOrStat[];
  general: MedalOrStat[];
}
