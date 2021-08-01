import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DestinyCacheService } from '@app/service/destiny-cache.service';
import { ApiDisplayProperties } from '@app/service/model';
import { NotificationService } from '@app/service/notification.service';
import { ParseService } from '@app/service/parse.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BungieService } from './bungie.service';
import { StreamingService } from './streaming.service';


function sortEntries(a: Entry, b: Entry): number {
  const scoreComp = b.info.score - a.info.score;
  if (scoreComp !== 0) {
    return scoreComp;
  }
  return b.values.kills - a.values.kills;
}

@Injectable({
  providedIn: 'root'
})
export class PgcrService extends StreamingService {

  constructor(
    httpClient: HttpClient,
    bungieService: BungieService,
    notificationService: NotificationService,
    private destinyCacheService: DestinyCacheService) {
    super(httpClient, bungieService, notificationService);
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
        const mode = ParseService.lookupMode(resp.activityDetails.mode);
        const modes = resp.activityDetails.modes;
        const viewMode = modes?.indexOf(63) >= 0 ? ViewMode.GAMBIT : modes?.indexOf(48) >= 0 ? ViewMode.RUMBLE : modes?.indexOf(5) >= 0 ? ViewMode.PVP : ViewMode.PVE;
        let entries: Entry[] = [];
        const teams: Team[] = [];
        for (const entry of resp.entries) {
          const parsedEntry = this.parsePGCREntry(entry);
          if (parsedEntry) {
            entries.push(parsedEntry);
          }
        }
        entries = PgcrService.groupAndSortEntries(entries);
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
            teams.push(team);
          }
        }
        // sort teams by standing
        teams.sort( (a, b) => {
          return a.standing - b.standing;
        });
        const maxDuration = entries.map(e => e?.values?.activityDurationSeconds > 0 ? e.values.activityDurationSeconds : 0).reduce((a, b) => Math.max(a, b), 0);
        const minCompletionValue = entries.map(e => e?.values?.completionReason > 0 ? e.values.completionReason : 0).reduce((a, b) => Math.min(a, b), 1000);

        let pveTeamScore: number | null = null;
        let pveTotalTeamScore: number | null = null;
        let pveSuccess = null;
        if (viewMode == ViewMode.PVE) {
          if (minCompletionValue === 0) {
            pveSuccess = true;
          } else if (minCompletionValue < 255) {
            pveSuccess = false;
          }
          pveTeamScore = entries.map(e => e?.values?.teamScore > 0 ? e.values.teamScore : 0).reduce((a, b) => Math.max(a, b), 0);
          pveTotalTeamScore = entries.map(e => e?.info?.score > 0 ? e.info.score : 0).reduce((a, b) => a + b, 0);
        }
        const longestEntry = entries.find(e => e.values?.activityDurationSeconds == maxDuration);
        return {
          instanceId,
          activityHash: resp.activityDetails.referenceId,
          activityName: desc.displayProperties.name,
          activityLocation: desc.displayProperties.description,
          activityDurationSeconds: longestEntry ? longestEntry.values.activityDurationSeconds : 0,
          activityDurationSecondsText: longestEntry ? longestEntry.values.activityDurationSecondsText : '',
          pveSuccess,
          pveTeamScore,
          pveTotalTeamScore,
          timeLostPoints: pveTeamScore != null && pveTotalTeamScore != null ? pveTotalTeamScore - pveTeamScore : null,
          mode,
          period: resp?.period,
          pgcrImage: desc?.pgcrImage,
          isPrivate: resp.activityDetails.isPrivate,
          viewMode: viewMode,
          allScoresZero: entries.every(e => !(e.info?.score)),
          teams,
          entries: PgcrService.groupAndSortEntries(entries)
        };
      })
    );
    return remoteReq;
  }

  private parsePGCREntry(e: any): Entry {
    const info: EntryInfo = {
      player: e.player,
      characterId: e.characterId,
      standing: e.standing,
      score: ParseService.getBasicValue(e.score),
      medalsEarned: 0
    };

    const general: MedalOrStat[] = [];
    const medals: MedalOrStat[] = [];
    const weapons: WeaponInfo[] = [];
    let values: EntryValues | null = null;
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
        activityDurationSecondsText: ParseService.getBasicDisplayValue(e.values.activityDurationSeconds),
        standing: ParseService.getBasicValue(e.values.standing),
        standingText: ParseService.getBasicDisplayValue(e.values.standing),
        fireteamId: ParseService.getBasicValue(e.values.fireteamId),
        team: ParseService.getBasicDisplayValue(e.values.team),
        startSeconds: ParseService.getBasicValue(e.values.startSeconds),
        timePlayedSeconds: ParseService.getBasicValue(e.values.timePlayedSeconds),
        timePlayedSecondsText: ParseService.getBasicDisplayValue(e.values.timePlayedSeconds),
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
              statName = tempName.charAt(0).toUpperCase() + tempName.slice(1);
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
          }
          if (desc.group == 2) {
            // push to general anyway
            general.push(extraEntry);
          }
          if (desc.group == 3) {
            if ('Medals Earned' === statName) {
              // ignore, we already have this
            } else {
              medals.push(extraEntry);
              info.medalsEarned += basicVal;
            }
          }
        }
      }
      if (e.extended.weapons != null) {
        for (const w of e.extended.weapons) {
          const desc: any = this.destinyCacheService.cache.InventoryItem[w.referenceId];
          const weaponInfo: WeaponInfo = {
            type: desc ? desc.itemTypeAndTierDisplayName : 'Classified',
            displayProperties: desc ? desc.displayProperties : null,
            kills: ParseService.getBasicValue(w.values.uniqueWeaponKills),
            precPct: ParseService.getBasicValue(w.values.uniqueWeaponKillsPrecisionKills),
          };
          weapons.push(weaponInfo);
        }
      }
    }

    // sort medals by value
    medals.sort((a, b) => b.value - a.value);
    // sort general by value
    general.sort((a, b) => b.value - a.value);
    // sort weapons by kills
    weapons.sort((a, b) => b.kills - a.kills);
    return {
      info,
      values: values,
      general,
      medals,
      weapons
    };
  }


  private static groupAndSortEntries(entries: Entry[]): Entry[] {

    // sort by score/kills first
    entries.sort(sortEntries);
    const grouped: { [key: string]: Entry[] } = {};
    for (const e of entries) {
      const group = e.values.fireteamId;
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(e);
    }
    const groups: Entry[][] = [];
    for (const g of Object.keys(grouped)) {
      if (grouped[g].length > 1) {
        const first = false;
        for (let cntr = 0; cntr < grouped[g].length; cntr++) {
          const entry = grouped[g][cntr];
          entry.fireTeamStatus = cntr == 0 ? 'first' : cntr == (grouped[g].length - 1) ? 'last' : 'middle';
          entry.fireTeamSize = grouped[g].length;
        }
      }
      groups.push(grouped[g]);
    }
    groups.sort((a, b) => {
      return sortEntries(a[0], b[0]);
    });
    const finalEntries: Entry[] = [];
    for (const g of groups) {
      for (const e of g) {
        finalEntries.push(e);
      }
    }
    return finalEntries;
  }

}



export interface Game {
  instanceId: string;
  activityHash: string;
  activityName: string;
  activityLocation: string;
  activityDurationSeconds: number;
  activityDurationSecondsText: string;
  pveSuccess: boolean | null;
  pveTeamScore: number | null;
  pveTotalTeamScore: number | null;
  timeLostPoints: number | null;
  mode: string;
  period: string;
  pgcrImage: string;
  isPrivate: boolean;
  viewMode: ViewMode;
  allScoresZero: boolean;
  teams: Team[];
  entries: Entry[];
}

export enum ViewMode {
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

export interface Entry {
  info: EntryInfo;
  values: EntryValues | null;
  medals: MedalOrStat[];
  general: MedalOrStat[];
  weapons: WeaponInfo[];
  fireTeamStatus?: 'first' | 'last' | 'middle';
  fireTeamSize?: number;
}

interface EntryInfo {
  player: PGCRPlayer;
  characterId: string;
  standing: number;
  score: number;
  medalsEarned: number;
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
  activityDurationSecondsText: string;
  standing: number;
  standingText: string;
  fireteamId: number;
  team: string;
  startSeconds: number;
  timePlayedSeconds: number;
  timePlayedSecondsText: string;
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

interface PGCRPlayer {
  destinyUserInfo: DestinyUserInfo;
  characterClass: string;
  classHash: number;
  raceHash: number;
  genderHash: number;
  characterLevel: number;
  lightLevel: number;
  emblemHash: number;
}

export interface DestinyUserInfo {
  iconPath: string;
  crossSaveOverride: number;
  applicableMembershipTypes: number[];
  isPublic: boolean;
  membershipType: number;
  membershipId: string;
  displayName: string;
}
