
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { IconService } from '@app/service/icon.service';
import { ApiDisplayProperties, BungieNetUserInfo, PGCR, PGCREntry, PGCRTeam } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ParseService } from '@app/service/parse.service';
import { StreamingChildComponent } from '@app/shared/streaming-child.component';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { StorageService } from '../../service/storage.service';

@Component({
  selector: 'd2c-pgcr2',
  templateUrl: './pgcr2.component.html',
  styleUrls: ['./pgcr2.component.scss']
})
export class Pgcr2Component extends StreamingChildComponent implements OnInit, OnDestroy {
  public instanceId$: BehaviorSubject<string | null> = new BehaviorSubject(null);
  public game$: Observable<Game | null>;

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
    const info: EntryInfo = {
      bungieNetUserInfo: e.player.bungieNetUserInfo,
      characterId:  e.characterId,
      standing:  e.standing,
      score:  ParseService.getBasicValue(e.score)
    };

    const general: MedalOrStat[] = [];
    const medals: MedalOrStat[] = [];
    const weapons: WeaponInfo[] = [];
    let values: EntryValues|null = null;
    if (e.values) {
      const deaths = ParseService.getBasicValue(e.values.deaths);
      const kills = ParseService.getBasicValue(e.values.kills);
      values = {
        assists: ParseService.getBasicValue(e.values.assists),
        completed: ParseService.getBasicValue(e.values.completed), // 1 or 0
        deaths,
        kills,
        opponentsDefeated: ParseService.getBasicValue(e.values.opponentsDefeated),
        kd: ParseService.getBasicValue(e.values.killsDeathsRatio),
        kda: ParseService.getBasicValue(e.values.killsDeathsAssists),
        activityDurationSeconds: ParseService.getBasicValue(e.values.activityDurationSeconds),
        standing: ParseService.getBasicValue(e.values.standing),
        standingText: ParseService.getBasicDisplayValue(e.values.standing),
        fireteamId: ParseService.getBasicValue(e.values.fireteamId),
        team: ParseService.getBasicDisplayValue(e.values.team),
        startSeconds: ParseService.getBasicValue(e.values.startSeconds),
        timePlayedSeconds: ParseService.getBasicValue(e.values.timePlayedSeconds),
        completionReason: ParseService.getBasicValue(e.values.completionReason),
        completionReasonText: ParseService.getBasicDisplayValue(e.values.completionReason),
        teamScore: ParseService.getBasicValue(e.values.teamScore),
      };
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
              const tempName = desc.statName.replace('###historicalstats.StatName_', '').replace(/([a-z])([A-Z])/g, '$1 $2').replace('###', '');
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
          if (desc.group == 1) {
            general.push(extraEntry);
            console.log(`General ${statName}`);
          }
          if (desc.group == 2) {
            console.log(`weapons ${statName}`);
          }
          if (desc.group == 3) {
            medals.push(extraEntry);
            console.log(`medals ${statName}`);
          }
          // extra.push(extraEntry);
        }
      }
      if (e.extended.weapons != null) {
        for (const w of e.extended.weapons) {
          const desc: any = this.destinyCacheService.cache.InventoryItem[w.referenceId];

          const weaponInfo: WeaponInfo = {
            type: desc ? desc.itemTypeAndTierDisplayName : 'Classified',
            displayProperties: desc ? desc.displayProperties : null,
            kills:  ParseService.getBasicValue(w.values.uniqueWeaponKills),
            precPct:  ParseService.getBasicValue(w.values.uniqueWeaponKillsPrecisionKills),
          };
          weapons.push(weaponInfo);
        }
      }
    }
    return {
      info,
      values: values,
      general,
      medals,
      weapons
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
        const viewMode = modes?.indexOf(63) >= 0 ? ViewMode.GAMBIT :  modes?.indexOf(48) >= 0 ? ViewMode.RUMBLE : modes?.indexOf(5) >= 0 ? ViewMode.PVP : ViewMode.PVE;
        const entries: Entry[] = [];
        const teams: Team[] = [];
        for (const entry of resp.entries) {
          const parsedEntry = this.parsePGCREntry(entry);
          if (parsedEntry) {
            entries.push(parsedEntry);
          }
        }
        if (resp.teams) {
          let firstTeamNameDone = false;
          for (const t of resp.teams) {
            if (t.name !== 'Alpha' && t.name !== 'Bravo') {
              t.name = firstTeamNameDone ? 'Bravo' : 'Alpha';
              firstTeamNameDone = true;
            }
            const team: Team = {
              name: t.name,
              id: t.teamId,
              standing: ParseService.getBasicValue(t.standing),
              standingText: ParseService.getBasicDisplayValue(t.standing),
              score: ParseService.getBasicValue(t.score),
              entries: entries.filter((entry) => entry.values?.team === ('' + t.teamId))
            };
            console.log(team.entries.length);
            teams.push(team);
          }
        }        
        return {
          instanceId,
          activityHash: resp.activityDetails.referenceId,
          activityName: desc.displayProperties.name,
          activityLocation: desc.displayProperties.description,
          mode,
          period: resp?.period,
          pgcrImage: desc?.pgcrImage,
          isPrivate: resp.activityDetails.isPrivate,
          viewMode: viewMode,
          teams,
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



interface Game {
  instanceId: string;
  activityHash: string;
  activityName: string;
  activityLocation: string;
  mode: string;
  period: string;
  pgcrImage: string;
  isPrivate: boolean;
  viewMode: ViewMode;
  teams: Team[];
  entries: Entry[];
}

enum ViewMode {
  PVE = 'PVE',
  PVP = 'PVP',
  GAMBIT = 'GAMBIT',
  RUMBLE = 'RUMBLE'
}
interface Team {
  name: string;
  id: string;
  standing: number;
  standingText: string;
  score: number;
  entries: Entry[];
}

interface Entry {
  info: EntryInfo;
  values: EntryValues|null;
  medals: MedalOrStat[];
  general: MedalOrStat[];
  weapons: WeaponInfo[];
}

interface EntryInfo {
  bungieNetUserInfo: BungieNetUserInfo;
  characterId: string;
  standing: number;
  score: number;
}

interface EntryValues {
  assists: number;
  completed: number; // 1 or 0
  deaths: number;
  kills: number;
  opponentsDefeated: number;
  kd: number;
  kda: number;
  activityDurationSeconds: number;
  standing: number;
  standingText: string;
  fireteamId: number;
  team: string;
  startSeconds: number;
  timePlayedSeconds: number;
  completionReason: number;
  completionReasonText: string;
  teamScore: number;

}

interface MedalOrStat {
  value: number;
  statName: string;
  statDesc: string;
  statIcon: string;
}


interface WeaponInfo {
  type: string;
  displayProperties: ApiDisplayProperties | null;
  kills: number;
  precPct: number;
}
