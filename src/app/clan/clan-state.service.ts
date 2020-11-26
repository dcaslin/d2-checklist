import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BungieService } from '@app/service/bungie.service';
import { Sort } from '@app/service/model';
import { StorageService } from '@app/service/storage.service';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { AggHistoryEntry, Badge, BungieGroupMember, ClanInfo, Const, Platform, Player, Seal, TriumphCollectibleNode, TriumphRecordNode } from '../service/model';

export interface ClanUserList {
  title: string;
  desc: string;
  users: BungieGroupMember[];
}

interface ClanAggregate {
  complete: number;
  total: number;
}

export interface PlayerTriumph {
  member: BungieGroupMember;
  data: TriumphRecordNode;
}

export interface PlayerCollectible {
  member: BungieGroupMember;
  data: TriumphCollectibleNode;
}

interface PlayerSeal {
  member: BungieGroupMember;
  data: Seal;
}

export interface PlayerBadge {
  member: BungieGroupMember;
  data: Badge;
}

export interface PlayerAggHistoryEntry {
  member: BungieGroupMember;
  data: AggHistoryEntry;
}

export interface ClanAggHistoryEntry extends ClanAggregate {
  data: AggHistoryEntry;

  // all
  activityCompletions: PlayerAggHistoryEntry[];
  efficiency: PlayerAggHistoryEntry[];

  activitySecondsPlayed: PlayerAggHistoryEntry[];
  kd?: PlayerAggHistoryEntry[];

  // nf only
  activityBestSingleGameScore: PlayerAggHistoryEntry[]; // this is a personal score, NOT team score, useless
  fastestCompletionMsForActivity: PlayerAggHistoryEntry[];
  highScore: PlayerAggHistoryEntry[];

  all: PlayerAggHistoryEntry[];
  notDone: ClanUserList;
}

export interface ClanSeal extends ClanAggregate {
  data: Seal;
  children: ClanSearchableTriumph[];
  all: PlayerSeal[];
  done: PlayerSeal[];
  notDone: PlayerSeal[];
}

export interface ClanBadge extends ClanAggregate {
  data: Badge;
  children: ClanSearchableCollection[];
  all: PlayerBadge[];
  done: PlayerBadge[];
  notDone: PlayerBadge[];
}


export interface ClanSearchableTriumph extends ClanAggregate {
  data: TriumphRecordNode;
  all: PlayerTriumph[];
  done: PlayerTriumph[];
  notDone: PlayerTriumph[];
}

export interface ClanSearchableCollection extends ClanAggregate {
  data: TriumphCollectibleNode;
  all: PlayerCollectible[];
  done: PlayerCollectible[];
  notDone: PlayerCollectible[];
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

  public rawMembers: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);
  public sortedMembers: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);
  public seals: BehaviorSubject<ClanSeal[]> = new BehaviorSubject([]);
  public searchableTriumphs: BehaviorSubject<ClanSearchableTriumph[]> = new BehaviorSubject([]);

  public badges: BehaviorSubject<ClanBadge[]> = new BehaviorSubject([]);
  public searchableCollection: BehaviorSubject<ClanSearchableCollection[]> = new BehaviorSubject([]);

  public trackedTriumphs: BehaviorSubject<ClanSearchableTriumph[]> = new BehaviorSubject([]);
  public aggHistory: BehaviorSubject<ClanAggHistoryEntry[]> = new BehaviorSubject([]);
  public sweepMsg: BehaviorSubject<string> = new BehaviorSubject(null);
  public info: BehaviorSubject<ClanInfo> = new BehaviorSubject(null);
  public allLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);
  public profilesLoaded: BehaviorSubject<number> = new BehaviorSubject(0.01);
  public aggHistoryLoaded: BehaviorSubject<number> = new BehaviorSubject(0);
  public aggHistoryLoadCount: BehaviorSubject<number> = new BehaviorSubject(0);
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

  private static setLeader(pushMe: ClanAggHistoryEntry, x: PlayerAggHistoryEntry, field: string, requiresCompletion?: boolean) {
    // no data for this entry, can't be a leader
    if (!x.data[field]) {
      return;
    }

    // to be a meaningful leader, reqs completion which they don't have
    if (requiresCompletion && !x.data.activityCompletions) {
      return;
    }

    // if we have no leader, default they're a leader now
    if (pushMe[field].length === 0) {
      pushMe[field] = [x];
      return;
    }
    const curLeader = pushMe[field][0];

    // if this entry is better than the current leader, it's a new leader
    if (x.data[field] > curLeader.data[field]) {
      pushMe[field] = [x];
      return;
    }
    // if this entry is equal, add it
    if (x.data[field] == curLeader.data[field]) {
      pushMe[field].push(x);
      pushMe[field].sort((a, b) => {
        const aN = a.member.destinyUserInfo.displayName;
        const bN = b.member.destinyUserInfo.displayName;
        if (aN < bN) {
          return -1;
        } else if (aN > bN) {
          return 1;
        }
      });
    }
  }

  private static setLeaderFastest(pushMe: ClanAggHistoryEntry, x: PlayerAggHistoryEntry) {
    if (x.data.fastestCompletionMsForActivity) {
      if (x.data.activityCompletions == 0) {
        return;
      }
      if (pushMe.fastestCompletionMsForActivity.length === 0) {
        pushMe.fastestCompletionMsForActivity = [x];
      } else if (x.data.fastestCompletionMsForActivity < pushMe.fastestCompletionMsForActivity[0].data.fastestCompletionMsForActivity) {
        pushMe.fastestCompletionMsForActivity = [x];
      } else if (x.data.fastestCompletionMsForActivity == pushMe.fastestCompletionMsForActivity[0].data.fastestCompletionMsForActivity) {
        pushMe.fastestCompletionMsForActivity.push(x);
      }
    }
  }


  public static cookAggHistoryEntry(pushMe: ClanAggHistoryEntry, members: BungieGroupMember[]) {
    for (const x of pushMe.all) {
      ClanStateService.setLeader(pushMe, x, 'kd');
      // if (pushMe.data.type == 'nf') {
      ClanStateService.setLeader(pushMe, x, 'activityBestSingleGameScore', true);
      ClanStateService.setLeaderFastest(pushMe, x);
      ClanStateService.setLeader(pushMe, x, 'highScore', true);
      // }
      ClanStateService.setLeader(pushMe, x, 'activityCompletions', true);
      ClanStateService.setLeader(pushMe, x, 'efficiency');
      ClanStateService.setLeader(pushMe, x, 'activitySecondsPlayed');
    }
    const notDone: ClanUserList = {
      title: pushMe.data.name,
      desc: 'The following players have never completed this activity',
      users: []
    };
    for (const x of members) {
      let found: PlayerAggHistoryEntry = null;
      for (const y of pushMe.all) {
        if (y.member.destinyUserInfo.membershipId == x.destinyUserInfo.membershipId) {
          found = y;
          break;
        }
      }
      if (!found || !found.data.activityCompletions) {
        notDone.users.push(x);
      }
    }
    notDone.users.sort((a, b) => {
      const aN = a.destinyUserInfo.displayName;
      const bN = b.destinyUserInfo.displayName;
      if (aN < bN) {
        return -1;
      } else if (aN > bN) {
        return 1;
      }
      return 0;
    });
    pushMe.notDone = notDone;
  }

  public static sortAggHistory(pushMe: ClanAggHistoryEntry, sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    if (sort.name == 'name') {
      pushMe.all.sort((a, b) => {
        const aN = a.member.destinyUserInfo.displayName;
        const bN = b.member.destinyUserInfo.displayName;
        if (aN < bN) {
          return modifier * -1;
        } else if (aN > bN) {
          return modifier * 1;
        }
        return 0;
      });
    } else {
      pushMe.all.sort((a, b) => {
        let aV = a.data[sort.name];
        let bV = b.data[sort.name];
        if (aV == null) {
          aV = 0;
        } else if (bV == null) {
          bV = 0;
        }
        if (aV < bV) {
          return modifier * -1;
        } else if (aV > bV) {
          return modifier * 1;
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
    }
  }

  public static sortBadges(pushMe: ClanBadge, sort: Sort) {
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

  public static sortCollectibles(pushMe: ClanSearchableCollection, sort: Sort) {
    const modifier = sort.ascending ? 1 : -1;
    pushMe.all.sort((a, b) => {
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
      if (!m.currentPlayer()) {
        continue;
      }
      if (m.currentPlayer().seals) {
        for (const s of m.currentPlayer().seals) {
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

      if (m.currentPlayer().searchableTriumphs) {
        for (const s of m.currentPlayer().searchableTriumphs) {
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
          console.log('Warning: ' + child.hash + ' not found');
          continue;
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

  private static buildBestCollectionNodes(b: Badge): TriumphCollectibleNode[] {
    const dict = {};
    for (const bc of b.classes) {
      for (const c of bc.children) {
        if (dict[c.hash] == null) {
          dict[c.hash] = c;
        } else {
          if (!dict[c.hash].complete && c.complete) {
            dict[c.hash] = c;
          }
        }
      }
    }
    const returnMe: TriumphCollectibleNode[] = [];
    for (const key of Object.keys(dict)) {
      returnMe.push(dict[key]);
    }
    return returnMe;

  }

  private handleCollections(): void {
    // dictionary by hash of badges
    const clanBadgesDict: any = {};

    //  dictionary by hash of collectibles
    const clanSearchableCollectionsDict: any = {};

    // loop through all clan-members to gather badges and collectibles
    for (const m of this.sortedMembers.getValue()) {
      if (!m.currentPlayer()) {
        continue;
      }

      // process players badges
      if (m.currentPlayer().badges) {
        for (const b of m.currentPlayer().badges) {
          // do we have this badge already?
          let badge: ClanBadge = clanBadgesDict[b.hash];

          // if not, create it and store in the dict
          if (badge == null) {
            badge = {
              data: b,
              complete: 0,
              total: 0,
              done: [],
              all: [],
              notDone: [],
              children: []
            };
            clanBadgesDict[b.hash] = badge;
          }

          // create this specific players badge and save it
          const playerBadge: PlayerBadge = {
            member: m,
            data: b
          };
          badge.all.push(playerBadge);

          // record complete vs not
          if (b.complete) {
            badge.complete++;
            badge.done.push(playerBadge);
          } else {
            badge.notDone.push(playerBadge);
          }
          badge.total++;
        }
      }

      // process player collectibles
      if (m.currentPlayer().searchableCollection) {
        for (const c of m.currentPlayer().searchableCollection) {
          // do we have a copy of this collectible yet? If not create it
          let collectible = clanSearchableCollectionsDict[c.hash];
          if (collectible == null) {
            collectible = {
              data: c,
              complete: 0,
              total: 0,
              all: [],
              done: [],
              notDone: []
            };
            clanSearchableCollectionsDict[c.hash] = collectible;
          }
          // create player collectible link
          const playerCollectible: PlayerCollectible = {
            member: m,
            data: c
          };
          collectible.all.push(playerCollectible);
          if (c.complete) {
            clanSearchableCollectionsDict[c.hash].complete++;
          }
          clanSearchableCollectionsDict[c.hash].total++;
        }
      }
    }

    // convert our dicts into arrays
    const clanBadges: ClanBadge[] = [];
    const clanSearchableCollection: ClanSearchableCollection[] = [];
    const allMembers = this.sortedMembers.getValue();
    for (const key of Object.keys(clanSearchableCollectionsDict)) {
      const pushMe: ClanSearchableCollection = clanSearchableCollectionsDict[key];
      // handle secret collections
      if (pushMe.total == pushMe.complete && pushMe.total < allMembers.length) {
        for (const m of allMembers) {
          const found = pushMe.all.some(x => {
            return x.member == m;
          });
          if (!found) {
            const newData = Object.assign({}, pushMe.data);
            newData.complete = false;
            newData.acquired = false;
            pushMe.total++;
            const playerCollectible: PlayerCollectible = {
              member: m,
              data: newData
            };
            pushMe.all.push(playerCollectible);
          }
        }

      }


      // sort the node's children and divide into done/notDone before pushing
      // we divide into done/notDone here so we can avoid 3 sorts and just use one
      ClanStateService.sortCollectibles(pushMe, { name: 'name', ascending: true });
      clanSearchableCollection.push(pushMe);
    }


    // we're going to skip stocking children b/c it's too confusing with diff badge entries across classes
    // also using the accordion UI is too slow and painful
    for (const key of Object.keys(clanBadgesDict)) {
      // stock children
      const badge: ClanBadge = clanBadgesDict[key];
      ClanStateService.sortBadges(badge, { name: 'name', ascending: false });
      clanBadges.push(badge);
    }
    clanBadges.sort((a, b) => {
      if (a.data.name > b.data.name) {
        return 1;
      }
      if (a.data.name < b.data.name) {
        return -1;
      }
      return 0;
    });
    this.badges.next(clanBadges);
    this.searchableCollection.next(clanSearchableCollection);
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
    this.aggHistoryLoadCount.next(0);

    try {
      // async load clan progressions etc
      this.loadClanInfo();
      // load the clan members
      const allMembers = await this.bungieService.getClanMembers(this.id);
      this.rawMembers.next(allMembers);
      const functMembers = allMembers.filter(x => {
        if (x.isDefunct()) {
          this.defunctMembers.push(x);
        } else {
          return true;
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
    let sCsv = 'member,platform,chars,lastPlayed days ago,Artifact,Season Rank,Triumph Score,Glory,Infamy,Valor,Weekly XP,max LL,';
    this.modelPlayer.getValue().milestoneList.forEach(m => {
      let tempName = m.name;
      tempName = m.name.replace(',', '_');
      sCsv += tempName + ',';
      sCsv += tempName + '%,';
    });
    sCsv += '\n';

    this.members.forEach(member => {
      if (member.destinyUserInfo == null) { return; }
      if (member.currentPlayer() == null) { return; }

      sCsv += member.destinyUserInfo.displayName + ',';
      sCsv += member.destinyUserInfo.platformName + ',';
      if (member.currentPlayer().characters != null) {
        sCsv += member.currentPlayer().characters.length + ',';
      } else {
        sCsv += '0,';
      }

      const today = moment();
      const lastPlayed = moment(member.currentPlayer().profile.dateLastPlayed);
      const diff = today.diff(lastPlayed, 'days');
      sCsv += diff + ',';
      sCsv += member.currentPlayer().artifactPowerBonus + ',';
      if (member.currentPlayer().seasonRank) {
        sCsv += member.currentPlayer().seasonRank.level + ',';
      } else {
        sCsv += '-,';
      }

      sCsv += member.currentPlayer().triumphScore + ',';
      if (member.currentPlayer().glory) {
        sCsv += member.currentPlayer().glory.currentProgress + ',';
      } else {
        sCsv += '-,';
      }
      if (member.currentPlayer().infamy) {
        sCsv += member.currentPlayer().infamy.currentProgress + ',';
      } else {
        sCsv += '-,';
      }
      if (member.currentPlayer().valor) {
        sCsv += member.currentPlayer().valor.currentProgress + ',';
      } else {
        sCsv += '-,';
      }
      sCsv += member.currentPlayer().getWeeklyXp() + ',';
      sCsv += member.currentPlayer().maxLL + ',';

      if (member.currentPlayer().characters != null) {
        this.modelPlayer.getValue().milestoneList.forEach(mileStoneName => {
          let total = 0;
          let pctTotal = 0;
          let possible = 0;
          member.currentPlayer().characters.forEach(char => {
            // handle privacy settings
            if (char.milestones == null) {
              return;
            }
            if (char.milestones[mileStoneName.key] != null
              && !char.milestones[mileStoneName.key].locked
              && !char.milestones[mileStoneName.key].tooLowPower
              ) {
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
      this.handleCollections();
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
      } else if (sort.name === 'artifactPowerBonus') {
        return ClanStateService.compareArtifactPowerBonus(a, b, sort.ascending);
      } else if (sort.name === 'seasonRank') {
        return ClanStateService.compareSeasonRank(a, b, sort.ascending);
      } else if (sort.name === 'glory') {
        return ClanStateService.compareGlory(a, b, sort.ascending);
      } else if (sort.name === 'valor') {
        return ClanStateService.compareValor(a, b, sort.ascending);
      } else if (sort.name === 'infamy') {
        return ClanStateService.compareInfamy(a, b, sort.ascending);
      } else if (sort.name === 'll') {
        return ClanStateService.compareLLs(a, b, sort.ascending);
      } else if (sort.name === 'minsPlayed') {
        return ClanStateService.compareMinsPlayed(a, b, sort.ascending);
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
    if (a.currentPlayer() != null) {
      aD = Date.parse(a.currentPlayer().profile.dateLastPlayed);
    } else {
      aD = a.lastOnlineStatusChange * 1000;
    }
    if (b.currentPlayer() != null) {
      bD = Date.parse(b.currentPlayer().profile.dateLastPlayed);
    } else {
      bD = b.lastOnlineStatusChange * 1000;
    }
    return ClanStateService.simpleCompare(aD, bD, reverse);
  }

  private static compareXp(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null) { aX = a.currentPlayer().getWeeklyXp(); }
    if (b.currentPlayer() != null) { bX = b.currentPlayer().getWeeklyXp(); }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }


  private static compareArtifactPowerBonus(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null) { aX = a.currentPlayer().artifactPowerBonus; }
    if (b.currentPlayer() != null) { bX = b.currentPlayer().artifactPowerBonus; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareSeasonRank(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() && a.currentPlayer().seasonRank) { aX = a.currentPlayer().seasonRank.level; }
    if (b.currentPlayer() && b.currentPlayer().seasonRank) { bX = b.currentPlayer().seasonRank.level; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }


  private static compareTriumph(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null) { aX = a.currentPlayer().triumphScore; }
    if (b.currentPlayer() != null) { bX = b.currentPlayer().triumphScore; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareGlory(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null && a.currentPlayer().glory != null) { aX = a.currentPlayer().glory.completeProgress; }
    if (b.currentPlayer() != null && b.currentPlayer().glory != null) { bX = b.currentPlayer().glory.completeProgress; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareValor(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null && a.currentPlayer().valor != null) { aX = a.currentPlayer().valor.completeProgress; }
    if (b.currentPlayer() != null && b.currentPlayer().valor != null) { bX = b.currentPlayer().valor.completeProgress; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareInfamy(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null && a.currentPlayer().infamy != null) { aX = a.currentPlayer().infamy.completeProgress; }
    if (b.currentPlayer() != null && b.currentPlayer().infamy != null) { bX = b.currentPlayer().infamy.completeProgress; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareMinsPlayed(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aX = 0;
    let bX = 0;
    if (a.currentPlayer() != null) { aX = a.currentPlayer().minsPlayed; }
    if (b.currentPlayer() != null) { bX = b.currentPlayer().minsPlayed; }
    return ClanStateService.simpleCompare(aX, bX, reverse);
  }

  private static compareLLs(a: BungieGroupMember, b: BungieGroupMember, reverse?: boolean): number {
    let aPts = -1;
    if (a.currentPlayer() != null && a.currentPlayer().maxLL != null) {
      aPts = a.currentPlayer().maxLL;
    }
    let bPts = -1;
    if (b.currentPlayer() != null && b.currentPlayer().maxLL != null) {
      bPts = b.currentPlayer().maxLL;
    }
    return ClanStateService.simpleCompare(aPts, bPts, reverse);
  }

  // dialog
  // graph
  private async sweepAggHistory(type: string, msg: string) {
    this.sweepMsg.next(msg);
    const loadAggDenom = this.sortedMembers.getValue().length;
    let loadAggNum = 0;
    for (const m of this.sortedMembers.getValue()) {
      try {
        if (!m.currentPlayer()) {
          continue;
        }
        if (type != 'nf') {
          await this.bungieService.applyAggHistoryForPlayer(m.currentPlayer(), type);
        }
        if (type == 'nf') {
          await this.bungieService.updateNfScores(m.currentPlayer());
        }
        this.handleAggHistory();
      } catch (err) {
        console.dir(err);
        console.log('Skipping aggHistory error on ' + m.destinyUserInfo.displayName + ' and continuing');
      }
      finally {
        loadAggNum++;
        const pct = loadAggNum / loadAggDenom;
        this.aggHistoryLoadCount.next(loadAggNum);
        this.aggHistoryLoaded.next(pct);
      }
    }
  }

  public async loadAggHistory() {
    // don't reload unless clan is reloaded
    if (this.aggHistoryAllLoaded.getValue()) {
      return;
    }
    await this.sweepAggHistory('cache', 'Checking cached history info: ');
    await this.sweepAggHistory('best', 'Loading latest history info: ');
    await this.sweepAggHistory('nf', 'Checking NF high scores: ');
    this.aggHistoryAllLoaded.next(true);
  }

  private static removePrefix(s: string, preFix: string, ignoreCase: true): string {
    if (s == null) { return s; }
    const s1 = ignoreCase ? s.toLowerCase() : s;
    const p1 = ignoreCase ? preFix.toLowerCase() : preFix;

    if (s1.startsWith(p1)) {
      return s.substr(preFix.length);
    }
    return s;
  }

  private handleAggHistory(): void {
    const clanAggHistoryDict: { [key: string]: ClanAggHistoryEntry } = {};
    const sortedMembers = this.sortedMembers.getValue();
    for (const m of sortedMembers) {
      if (!m.currentPlayer()) {
        continue;
      }
      if (m.currentPlayer().aggHistory) {
        for (const s of m.currentPlayer().aggHistory) {
          let entry = clanAggHistoryDict[s.name];
          if (entry == null) {
            entry = {
              data: s,
              complete: 0,
              total: 0,
              all: [],
              notDone: null,
              activityCompletions: [],
              efficiency: [],
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
      ClanStateService.cookAggHistoryEntry(pushMe, sortedMembers);
      clanAggHistoryEntrys.push(pushMe);
    }
    clanAggHistoryEntrys.sort((a, b) => {
      let aN = ClanStateService.removePrefix(a.data.name, 'The ', true);
      const bN = ClanStateService.removePrefix(b.data.name, 'The ', true);
      if (aN.startsWith('The ')) {
        aN = aN.substr('The '.length);
      }
      if (aN > bN) {
        return 1;
      }
      if (bN > aN) {
        return -1;
      }
      return 0;
    });
    this.aggHistory.next(clanAggHistoryEntrys);
  }

  public async loadSpecificPlayer(target: BungieGroupMember, reload: boolean): Promise<void> {
    if (target.currentPlayer() != null && !reload) { return; }

    try {
      const x = await this.bungieService.getChars(target.destinyUserInfo.membershipType,
        target.destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions', 'ProfileProgression', 'ItemObjectives',
        'CharacterEquipment', 'ItemInstances', 'CharacterInventories', 'ProfileInventories',
        'CharacterActivities', 'Records', 'Collectibles', 'PresentationNodes'], true, true);
      target.player$.next(x);
      if (this.modelPlayer.getValue() == null && x != null && x.characters != null && x.characters[0].clanMilestones != null) {
        this.modelPlayer.next(x);
      }
      if (x != null && x.characters != null) {
        // in case this is a retry
        target.errorMsg = null;
        // this.bungieService.loadActivityPsuedoMilestones(target.player$);
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
      if (t.errorMsg != null || target.currentPlayer() != null) {
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
