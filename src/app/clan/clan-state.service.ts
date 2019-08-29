import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { StorageService } from '@app/service/storage.service';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { BungieGroupMember, ClanInfo, Const, Platform, Player, Seal, TriumphRecordNode, AggHistoryEntry } from '../service/model';

export interface Sort {
  name: string;
  ascending: boolean;
}

interface ClanAggregate {
  complete: number;
  total: number;
}

interface PlayerTriumph {
  member: BungieGroupMember;
  data: TriumphRecordNode;
}

interface PlayerSeal {
  member: BungieGroupMember;
  data: Seal;
}

interface PlayerAggHistoryEntry {
  member: BungieGroupMember;
  data: AggHistoryEntry;
}

export interface ClanAggHistoryEntry extends ClanAggregate {
  data: AggHistoryEntry;

  // all
  activityCompletions: PlayerAggHistoryEntry[];
  activitySecondsPlayed: PlayerAggHistoryEntry[];
  kd?: PlayerAggHistoryEntry[];

  // nf only
  activityBestSingleGameScore: PlayerAggHistoryEntry[]; // this is a personal score, NOT team score, useless
  fastestCompletionMsForActivity: PlayerAggHistoryEntry[];
  highScore: PlayerAggHistoryEntry[];

  all: PlayerAggHistoryEntry[];
  done: PlayerAggHistoryEntry[];
  notDone: PlayerAggHistoryEntry[];
}

export interface ClanSeal extends ClanAggregate {
  data: Seal;
  children: ClanSearchableTriumph[];
  all: PlayerSeal[];
  done: PlayerSeal[];
  notDone: PlayerSeal[];
}

export interface ClanSearchableTriumph extends ClanAggregate {
  data: TriumphRecordNode;
  all: PlayerTriumph[];
  done: PlayerTriumph[];
  notDone: PlayerTriumph[];
}

@Injectable({
  providedIn: 'root'
})
export class ClanStateService {


  public loading: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public notFound: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public inactiveMembers: BungieGroupMember[] = [];
  public defunctMembers: BungieGroupMember[] = [];

  public id: string;
  public sortedMembers: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);
  public seals: BehaviorSubject<ClanSeal[]> = new BehaviorSubject([]);
  public searchableTriumphs: BehaviorSubject<ClanSearchableTriumph[]> = new BehaviorSubject([]);
  public trackedTriumphs: BehaviorSubject<ClanSearchableTriumph[]> = new BehaviorSubject([]);
  public aggHistory: BehaviorSubject<ClanAggHistoryEntry[]> = new BehaviorSubject([]);

  public info: BehaviorSubject<ClanInfo> = new BehaviorSubject(null);
  public allLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public profilesLoaded: BehaviorSubject<number> = new BehaviorSubject(0.01);
  public aggHistoryLoaded: BehaviorSubject<number> = new BehaviorSubject(0);
  public aggHistoryAllLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public modelPlayer: BehaviorSubject<Player> = new BehaviorSubject(null);

  public dTrackedTriumphIds = {};
  public inactivityMonthThreshold = 6;
  public inactivityMonthOptions = [1, 3, 6, 12, 48];

  platforms: Platform[];
  selectedPlatform: Platform;
  members: BungieGroupMember[] = [];
  sort: Sort = {
    name: 'date',
    ascending: false
  };

  private static setLeader(pushMe: ClanAggHistoryEntry, x: PlayerAggHistoryEntry, field: string, requiresCompletion?: boolean, compare?: string) {
    if (x.data[field] != null) {
      if (requiresCompletion && x.data.activityCompletions == 0) {
        return;
      }
      if (pushMe[field].length === 0) {
        pushMe[field] = [x];
      } else if ('reverse' == compare && (x.data[field] < pushMe[field][0].data[field])) {
        pushMe[field] = [x];
      } else if (x.data[field] > pushMe[field][0].data[field]) {
        pushMe[field] = [x];
      } else if (x.data[field] == pushMe[field][0].data[field]) {
        pushMe[field].push(x);
      }
    }
  }

  public static cookAggHistory(pushMe: ClanAggHistoryEntry, sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    pushMe.all.sort((a, b) => {
      // if (sort.name === 'pct') {
      //   if (a.data.percent < b.data.percent) {

      //     return modifier * -1;
      //   } else if (a.data.percent > b.data.percent) {
      //     return modifier * 1;
      //   }
      // }
      const aN = a.member.destinyUserInfo.displayName;
      const bN = b.member.destinyUserInfo.displayName;
      if (aN < bN) {
        return modifier * -1;
      } else if (aN > bN) {
        return modifier * 1;
      }
      return 0;
    });
    pushMe.done = [];
    pushMe.notDone = [];
    for (const x of pushMe.all) {
      if (x.data.activityCompletions > 0) {
        pushMe.done.push(x);
      } else {
        pushMe.notDone.push(x);
      }
      ClanStateService.setLeader(pushMe, x, 'kd');
      ClanStateService.setLeader(pushMe, x, 'activityBestSingleGameScore', true);
      ClanStateService.setLeader(pushMe, x, 'activityCompletions', true);
      ClanStateService.setLeader(pushMe, x, 'activitySecondsPlayed');
      ClanStateService.setLeader(pushMe, x, 'fastestCompletionMsForActivity', true, 'reverse');
      ClanStateService.setLeader(pushMe, x, 'highScore', true);

    }
  }

  public static sortSeals(pushMe: ClanSeal, sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    pushMe.all.sort((a, b) => {
      if (sort.name === 'pct') {
        if (a.data.percent < b.data.percent) {

          return modifier * -1;
        } else if (a.data.percent > b.data.percent) {
          return modifier * 1;
        }
      }
      const aN = a.member.destinyUserInfo.displayName;
      const bN = b.member.destinyUserInfo.displayName;
      if (aN < bN) {
        return modifier * -1;
      } else if (aN > bN) {
        return modifier * 1;
      }
      return 0;
    });
    pushMe.done = [];
    pushMe.notDone = [];
    for (const x of pushMe.all) {
      if (x.data.complete) {
        pushMe.done.push(x);
      } else {
        pushMe.notDone.push(x);
      }
    }
  }

  public static sortTriumphs(pushMe: ClanSearchableTriumph, sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    pushMe.all.sort((a, b) => {
      if (sort.name === 'pct') {
        if (a.data.percent < b.data.percent) {
          return modifier * -1;
        } else if (a.data.percent > b.data.percent) {
          return modifier * 1;
        }
      }
      const aN = a.member.destinyUserInfo.displayName;
      const bN = b.member.destinyUserInfo.displayName;
      if (aN < bN) {
        return modifier * -1;
      } else if (aN > bN) {
        return modifier * 1;
      }
      return 0;
    });
    pushMe.done = [];
    pushMe.notDone = [];
    for (const x of pushMe.all) {
      if (x.data.complete) {
        pushMe.done.push(x);
      } else {
        pushMe.notDone.push(x);
      }
    }
  }

  private handleTriumphs(): void {
    const clanSealsDict: any = {};

    const clanSearchableTriumphsDict: any = {};
    for (const m of this.sortedMembers.getValue()) {
      if (!m.player) {
        continue;
      }
      if (m.player.seals) {
        for (const s of m.player.seals) {
          let seal: ClanSeal = clanSealsDict[s.hash];
          if (seal == null) {
            seal = {
              data: s,
              complete: 0,
              total: 0,
              done: [],
              all: [],
              notDone: [],
              children: []
            };
            clanSealsDict[s.hash] = seal;
          }
          const playerSeal: PlayerSeal = {
            member: m,
            data: s
          };
          seal.all.push(playerSeal);
          if (s.complete) {
            seal.complete++;
          }
          seal.total++;
        }
      }

      if (m.player.searchableTriumphs) {
        for (const s of m.player.searchableTriumphs) {
          let triumph = clanSearchableTriumphsDict[s.hash];
          if (triumph == null) {
            triumph = {
              data: s,
              complete: 0,
              total: 0,
              all: [],
              done: [],
              notDone: []
            };
            clanSearchableTriumphsDict[s.hash] = triumph;
          }
          const playerTriumph: PlayerTriumph = {
            member: m,
            data: s
          };
          triumph.all.push(playerTriumph);
          if (s.complete) {

            clanSearchableTriumphsDict[s.hash].complete++;
          }
          clanSearchableTriumphsDict[s.hash].total++;
        }
      }
    }
    const clanSeals: ClanSeal[] = [];
    const clanSearchableTriumphs: ClanSearchableTriumph[] = [];
    for (const key of Object.keys(clanSearchableTriumphsDict)) {
      const pushMe: ClanSearchableTriumph = clanSearchableTriumphsDict[key];
      ClanStateService.sortTriumphs(pushMe, { name: 'pct', ascending: false });
      clanSearchableTriumphs.push(pushMe);
    }
    for (const key of Object.keys(clanSealsDict)) {
      // stock children
      const seal: ClanSeal = clanSealsDict[key];
      for (const child of seal.data.children) {
        const triumph = clanSearchableTriumphsDict[child.hash];
        if (!triumph) {
          throw new Error(child.hash + ' not found');
        }
        seal.children.push(triumph);
      }
      ClanStateService.sortSeals(seal, { name: 'pct', ascending: false });

      clanSeals.push(seal);
    }
    this.seals.next(clanSeals);
    this.searchableTriumphs.next(clanSearchableTriumphs);
    this.applyTrackedTriumphs();
  }


  constructor(
    private router: Router,
    private storageService: StorageService,
    private bungieService: BungieService) {
    this.platforms = Const.PLATFORMS_ARRAY.slice(0);
    this.platforms.unshift(Const.ALL_PLATFORM);
    this.selectedPlatform = Const.ALL_PLATFORM;

    this.storageService.settingFeed.pipe().subscribe(
      x => {
        if (x.clanplatform != null && x.clanplatform != this.selectedPlatform.type) {
          for (const p of this.platforms) {
            if (p.type == x.clanplatform) {
              this.selectedPlatform = p;
              this.sortData();
            }
          }
        }
        if (x.claninactivitymonththreshold != null && this.inactivityMonthThreshold != x.claninactivitymonththreshold) {
          this.inactivityMonthThreshold = x.claninactivitymonththreshold;
          this.inactivityThresholdChange();
        }
        if (x.trackedtriumphs != null) {
          this.dTrackedTriumphIds = x.trackedtriumphs;
        } else {
          this.dTrackedTriumphIds = {};
        }
        this.applyTrackedTriumphs();

      });
  }

  public trackTriumph(n: TriumphRecordNode) {
    this.storageService.trackHashList('trackedtriumphs', n.hash);
  }

  public untrackTriumph(n: TriumphRecordNode) {
    this.storageService.untrackHashList('trackedtriumphs', n.hash);
  }

  private applyTrackedTriumphs() {
    const triumphs = this.searchableTriumphs.getValue();
    const tempTriumphs: ClanSearchableTriumph[] = [];
    if (Object.keys(this.dTrackedTriumphIds).length > 0) {
      for (const t of triumphs) {
        if (this.dTrackedTriumphIds[t.data.hash] == true) {
          tempTriumphs.push(t);
        }
      }
    }
    this.trackedTriumphs.next(tempTriumphs);
  }



  public async navigateBnetMember(target: BungieGroupMember) {
    const bnetName = await this.bungieService.getFullBNetName(target.bungieNetUserInfo.membershipId);
    if (bnetName != null) { this.router.navigate(['/', 4, bnetName]); }
    return;
  }

  private async loadClanInfo() {
    try {
      const i = await this.bungieService.getClanInfo(this.id);
      this.info.next(i);
    } catch {
      this.notFound.next(true);
    }
  }

  public async load(id: string, force?: boolean) {
    if (id == null || (!force && id == this.id)) {
      return;
    }
    this.id = id;
    this.allLoaded.next(false);
    this.aggHistoryAllLoaded.next(false);
    this.aggHistory.next([]);
    this.notFound.next(false);
    this.loading.next(true);
    this.members = [];

    this.defunctMembers = [];
    this.inactiveMembers = [];
    this.modelPlayer.next(null);
    this.profilesLoaded.next(0.01);
    this.aggHistoryLoaded.next(0);
    try {
      // async load clan progressions etc
      this.loadClanInfo();
      // load the clan members
      const allMembers = await this.bungieService.getClanMembers(this.id);
      const functMembers = allMembers.filter(x => {
        if (x.destinyUserInfo.crossSaveOverride == 0 || (x.destinyUserInfo.crossSaveOverride == x.destinyUserInfo.membershipType)) {
          return true;
        } else {
          this.defunctMembers.push(x);
        }
      });
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - this.inactivityMonthThreshold);
      const cutoffUnix = cutoff.getTime() / 1000;
      const members = functMembers.filter(x => {
        if (x.lastOnlineStatusChange > cutoffUnix) {
          return true;
        } else {

          this.inactiveMembers.push(x);
        }
      });
      this.members = members;
      this.sortedMembers.next(this.members.slice(0));
      this.loading.next(false);
      for (const t of this.members) {
        if (this.modelPlayer.getValue() == null) {
          await this.loadSpecificPlayer(t, false);
        } else {
          this.loadSpecificPlayer(t, false);
        }
      }
    } catch (x) {
      this.loading.next(false);
    }
  }

  private downloadCsv(filename: string, csv: string) {
    const anch: HTMLAnchorElement = document.createElement('a');
    anch.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    anch.setAttribute('download', filename);
    anch.setAttribute('visibility', 'hidden');
    document.body.appendChild(anch);
    anch.click();
  }


  public downloadCsvReport() {
    const sDate = new Date().toISOString().slice(0, 10);
    let sCsv = 'member,platform,chars,lastPlayed days ago,Triumph Score,Glory,Infamy,Valor,Weekly XP,max LL,';
    this.modelPlayer.getValue().milestoneList.forEach(m => {
      let tempName = m.name;
      tempName = m.name.replace(',', '_');
      sCsv += tempName + ',';
      sCsv += tempName + '%,';
    });
    sCsv += '\n';

    this.members.forEach(member => {
      if (member.destinyUserInfo == null) { return; }
      if (member.player == null) { return; }

      sCsv += member.destinyUserInfo.displayName + ',';
      sCsv += member.destinyUserInfo.platformName + ',';
      if (member.player.characters != null) {
        sCsv += member.player.characters.length + ',';
      } else {
        sCsv += '0,';
      }

      const today = moment();
      const lastPlayed = moment(member.player.profile.dateLastPlayed);
      const diff = today.diff(lastPlayed, 'days');
      sCsv += diff + ',';
      sCsv += member.player.triumphScore + ',';
      if (member.player.glory) {
        sCsv += member.player.glory.currentProgress + ',';
      } else {
        sCsv += '-,';
      }
      if (member.player.infamy) {
        sCsv += member.player.infamy.currentProgress + ',';
      } else {
        sCsv += '-,';
      }
      if (member.player.valor) {
        sCsv += member.player.valor.currentProgress + ',';
      } else {
        sCsv += '-,';
      }
      sCsv += member.player.getWeeklyXp() + ',';
      sCsv += member.player.maxLL + ',';

      if (member.player.characters != null) {
        this.modelPlayer.getValue().milestoneList.forEach(mileStoneName => {
          let total = 0;
          let pctTotal = 0;
          let possible = 0;
          member.player.characters.forEach(char => {
            // handle privacy settings
            if (char.milestones == null) {
              return;
            }
            if (char.milestones[mileStoneName.key] != null) {
              if (char.milestones[mileStoneName.key].pct != null) {
                pctTotal += char.milestones[mileStoneName.key].pct;
                possible++;
              }
              if (char.milestones[mileStoneName.key].complete === true) {
                total++;
              }
            } else if (char.milestones[mileStoneName.key] == null && !mileStoneName.neverDisappears
              && char.baseCharacterLevel >= char.maxLevel) {
              total++;
              pctTotal++;
              possible++;
            }
          });
          sCsv += total + ',';
          if (possible === 0) { possible = 1; }
          sCsv += pctTotal / possible + ',';
        });
      }
      sCsv += '\n';

    });

    this.downloadCsv('clan-progress-' + sDate + '.csv', sCsv);
  }

  // member, date, xp, triumph, valor, infamy, glory, ll
  public toggleSort(name: string) {
    if (this.sort != null && name == this.sort.name) {
      this.sort.ascending = !this.sort.ascending;
    } else {
      this.sort = {
        name,
        ascending: true
      };
    }
    this.sortData();
  }

  public inactivityThresholdChange() {
    this.storageService.setItem('claninactivitymonththreshold', this.inactivityMonthThreshold);
    this.load(this.id, true);
  }


  public selectedPlatformChange() {
    this.storageService.setItem('clanplatform', this.selectedPlatform.type);
    this.load(this.id, true);
  }


  public sortData(): void {
    let temp = this.members.slice(0);
    if (this.selectedPlatform != Const.ALL_PLATFORM) {
      temp = temp.filter(member => {
        return member.destinyUserInfo.membershipType == this.selectedPlatform.type;
      });
    }
    temp.sort(ClanStateService.generateComparator(this.sort));
    this.sortedMembers.next(temp);

    if (this.allLoaded.getValue()) {
      this.handleTriumphs();
    }
  }


  private static generateComparator(sort: Sort) {
    return function (a: BungieGroupMember, b: BungieGroupMember): number {
      if (sort.name === 'member') {
        return ClanStateService.compareName(a, b, sort.ascending);
      } else if (sort.name === 'date') {
        return ClanStateService.compareDate(a, b, sort.ascending);
      } else if (sort.name === 'xp') {
        return ClanStateService.compareXp(a, b, sort.ascending);
      } else if (sort.name === 'triumph') {
        return ClanStateService.compareTriumph(a, b, sort.ascending);
      } else if (sort.name === 'glory') {
        return ClanStateService.compareGlory(a, b, sort.ascending);
      } else if (sort.name === 'valor') {
        return ClanStateService.compareValor(a, b, sort.ascending);
      } else if (sort.name === 'infamy') {
        return ClanStateService.compareInfamy(a, b, sort.ascending);
      } else if (sort.name === 'll') {
        return ClanStateService.compareLLs(a, b, sort.ascending);
      }
    };
  }

  private static compareName(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    const bs: string = b.destinyUserInfo.displayName;
    const as: string = a.destinyUserInfo.displayName;
    const reverseMe = reverse ? -1 : 1;
    return reverseMe * as.localeCompare(bs);
  }

  private static simpleCompare(a: number, b: number, reverse?: boolean) {
    const reverseMe = reverse ? -1 : 1;
    if (a < b) { return reverseMe * 1; }
    if (a > b) { return reverseMe * -1; }
    return 0;
  }


  // private static compareDate(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
  //   return ClanStateService.simpleCompare(-1 * a.lastOnlineStatusChange, -1 * b.lastOnlineStatusChange, reverse);
  // }

  private static compareDate(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aD = 0;
    let bD = 0;
    if (a.player != null) {
      aD = Date.parse(a.player.profile.dateLastPlayed);
    } else {
      aD = a.lastOnlineStatusChange * 1000;
    }
    if (b.player != null) {
      bD = Date.parse(b.player.profile.dateLastPlayed);
    } else {
      bD = b.lastOnlineStatusChange * 1000;
    }
    return ClanStateService.simpleCompare(aD, bD, reverse);
  }

  private static compareXp(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null) { aX = a.player.getWeeklyXp(); }
    if (b.player != null) { bX = b.player.getWeeklyXp(); }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareTriumph(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null) { aX = a.player.triumphScore; }
    if (b.player != null) { bX = b.player.triumphScore; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareGlory(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null && a.player.glory != null) { aX = a.player.glory.currentProgress; }
    if (b.player != null && b.player.glory != null) { bX = b.player.glory.currentProgress; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareValor(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null && a.player.valor != null) { aX = a.player.valor.currentProgress; }
    if (b.player != null && b.player.valor != null) { bX = b.player.valor.currentProgress; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareInfamy(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null && a.player.infamy != null) { aX = a.player.infamy.currentProgress; }
    if (b.player != null && b.player.infamy != null) { bX = b.player.infamy.currentProgress; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareLLs(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aPts = -1;
    if (a.player != null && a.player.maxLL != null) {
      aPts = a.player.maxLL;
    }
    let bPts = -1;
    if (b.player != null && b.player.maxLL != null) {
      bPts = b.player.maxLL;
    }
    return ClanStateService.simpleCompare(aPts, bPts, reverse);
  }


  //TODO show state of sweep
  //sort agghistoryentreis by name
  //dialog
  //graph
  private async sweepAggHistory(type: string) {
    const loadAggDenom = this.sortedMembers.getValue().length;
    let loadAggNum = 0;
    for (const m of this.sortedMembers.getValue()) {
      try {
        if (!m.player) {
          continue;
        }
        const fresh = await this.bungieService.applyAggHistoryForPlayer(m.player, type);
        if (type == 'nf') {
          await this.bungieService.updateNfScores(m.player);
        }
        this.handleAggHistory();
      } catch (err) {
        console.dir(err);
        console.log('Skipping aggHistory error on ' + m.destinyUserInfo.displayName + ' and continuing');
      }
      finally {
        loadAggNum++;
        const pct = loadAggNum / loadAggDenom;
        this.aggHistoryLoaded.next(pct);
        if (pct >= 1 && type != 'cache') {
          this.aggHistoryAllLoaded.next(true);
        }
      }
    }
  }

  public async loadAggHistory() {
    // don't reload unless clan is reloaded
    if (this.aggHistoryAllLoaded.getValue()) {
      return;
    }
    await this.sweepAggHistory('cache');
    await this.sweepAggHistory('best');
    await this.sweepAggHistory('nf');

  }

  private handleAggHistory(): void {
    const clanAggHistoryDict: { [key: string]: ClanAggHistoryEntry } = {};
    for (const m of this.sortedMembers.getValue()) {
      if (!m.player) {
        continue;
      }
      if (m.player.aggHistory) {
        for (const s of m.player.aggHistory) {
          let entry = clanAggHistoryDict[s.name];
          if (entry == null) {
            entry = {
              data: s,
              complete: 0,
              total: 0,
              all: [],
              done: [],
              notDone: [],

              activityCompletions: [],
              activitySecondsPlayed: [],
              kd: [],
              activityBestSingleGameScore: [],
              fastestCompletionMsForActivity: [],
              highScore: []
            };
            clanAggHistoryDict[s.name] = entry;
          }
          const playerEntry: PlayerAggHistoryEntry = {
            member: m,
            data: s
          };
          entry.all.push(playerEntry);
          if (s.activityCompletions > 0) {
            clanAggHistoryDict[s.name].complete++;
          }
          clanAggHistoryDict[s.name].total++;
        }
      }
    }
    const clanAggHistoryEntrys: ClanAggHistoryEntry[] = [];
    for (const key of Object.keys(clanAggHistoryDict)) {
      const pushMe: ClanAggHistoryEntry = clanAggHistoryDict[key];
      ClanStateService.cookAggHistory(pushMe, { name: 'name', ascending: true });
      clanAggHistoryEntrys.push(pushMe);
    }
    console.dir(clanAggHistoryEntrys);
    this.aggHistory.next(clanAggHistoryEntrys);
  }

  public async loadSpecificPlayer(target: BungieGroupMember, reload: boolean): Promise<void> {
    if (target.player != null && !reload) { return; }

    try {
      const x = await this.bungieService.getChars(target.destinyUserInfo.membershipType,
        target.destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions',
          'CharacterActivities', 'Records', 'PresentationNodes'], true);
      target.player = x;
      if (this.modelPlayer.getValue() == null && x != null && x.characters != null && x.characters[0].clanMilestones != null) {
        this.modelPlayer.next(x);
      }
      if (x != null && x.characters != null) {
        // in case this is a retry
        target.errorMsg = null;
      } else {
        target.errorMsg = 'Unabled to load player data';
      }


    } catch (err) {
      console.dir(err);
      console.log('Skipping error on ' + target.destinyUserInfo.displayName + ' and continuing');
      target.errorMsg = 'Unabled to load player data';
    }
    let loadNum = 0;
    let loadDenom = 0;
    for (const t of this.members) {
      if (t.errorMsg != null || t.player != null) {
        loadNum++;
      }
      loadDenom++;
    }
    if (loadDenom === 0) {
      loadDenom++;
    }
    const pct = loadNum / loadDenom;
    this.profilesLoaded.next(pct);
    if (pct >= 1) {
      this.allLoaded.next(true);
    }
    this.sortData();
  }


}
