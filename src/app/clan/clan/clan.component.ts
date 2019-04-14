
import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from '../../service/bungie.service';
import { BungieMember, Player, BungieGroupMember, ClanInfo, MileStoneName } from '../../service/model';
import { ChildComponent } from '../../shared/child.component';
import { StorageService } from '../../service/storage.service';
import * as moment from 'moment';

@Component({
  selector: 'anms-clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss']
})
export class ClanComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;

  id: string;
  info: ClanInfo;
  members: BungieGroupMember[] = [];
  sortedMembers: BungieGroupMember[] = [];
  modelPlayer: Player;
  sort = 'dateAsc';
  allLoaded: boolean;
  raidsLoading: boolean;

  filterMode = 'none';
  filterActivity: MileStoneName = null;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router) {
    super(storageService);
  }

  public toggleMemberSort() {
    if (this.sort === 'memberAsc') {
      this.sort = 'memberDesc';
    } else {
      this.sort = 'memberAsc';
    }
    this.sortData();
  }

  public async navigateBnetMember(target: BungieGroupMember) {    
    const bnetName = await this.bungieService.getFullBNetName(target.bungieNetUserInfo.membershipId);
    if (bnetName!=null) this.router.navigate(['/', 4, bnetName]);    
    return;
  }

  public toggleDateSort() {
    if (this.sort === 'dateAsc') {
      this.sort = 'dateDesc';
    } else {
      this.sort = 'dateAsc';
    }
    this.sortData();
  }
  public toggleXpSort() {
    if (this.sort === 'xpAsc') {
      this.sort = 'xpDesc';
    } else {
      this.sort = 'xpAsc';
    }
    this.sortData();
  }

  public toggleTriumphSort() {
    if (this.sort === 'triumphAsc') {
      this.sort = 'triumphDesc';
    } else {
      this.sort = 'triumphAsc';
    }
    this.sortData();
  }
  

  public toggleLLSort() {
    if (this.sort === 'llAsc') {
      this.sort = 'llDesc';
    } else {
      this.sort = 'llAsc';
    }
    this.sortData();
  }

  private static compareDate(a: BungieGroupMember, b: BungieGroupMember): number {
    let aD = 0;
    let bD = 0;
    if (a.player != null) { aD = Date.parse(a.player.profile.dateLastPlayed); }
    if (b.player != null) { bD = Date.parse(b.player.profile.dateLastPlayed); }

    if (aD < bD) { return 1; }
    if (aD > bD) { return -1; }
    return 0;
  }

  private static compareXp(a: BungieGroupMember, b: BungieGroupMember): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null) { aX = a.player.getWeeklyXp(); }
    if (b.player != null) { bX = b.player.getWeeklyXp(); }

    if (aX < bX) { return 1; }
    if (aX > bX) { return -1; }
    return 0;
  }

  private static compareTriumph(a: BungieGroupMember, b: BungieGroupMember): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null) { aX = a.player.triumphScore; }
    if (b.player != null) { bX = b.player.triumphScore; }

    if (aX < bX) { return 1; }
    if (aX > bX) { return -1; }
    return 0;
  }

  private static compareTriumphReverse(a: BungieGroupMember, b: BungieGroupMember): number {
    return ClanComponent.compareTriumph(a, b) * -1;
  }

  

  private static compareDateReverse(a, b): number {
    return ClanComponent.compareDate(a, b) * -1;
  }
  private static compareName(a: BungieGroupMember, b: BungieGroupMember): number {
    const bs: string = b.destinyUserInfo.displayName;
    const as: string = a.destinyUserInfo.displayName;
    return as.localeCompare(bs);
  }


  private static compareLLs(a: BungieGroupMember, b: BungieGroupMember): number {
    let aPts = -1;
    if (a.player != null && a.player.maxLL != null) {
      aPts = a.player.maxLL;
    }
    let bPts = -1;
    if (b.player != null && b.player.maxLL != null) {
      bPts = b.player.maxLL;
    }
    if (bPts < aPts) { return 1; }
    if (bPts > aPts) { return -1; }
    return 0;
  }
  private static compareLLsReverse(a, b): number {
    return ClanComponent.compareLLs(a, b) * -1;
  }

  private static compareNameReverse(a, b): number {
    return ClanComponent.compareName(a, b) * -1;
  }

  private filterPlayers() {
    if (this.filterMode === 'none') {
      this.filterActivity = null;
    }
    this.sortData();

  }

  private sortData(): void {
    const temp = this.members.slice(0);
    this.sortedMembers = temp.filter(member => {
      if (this.filterActivity == null) { return true; }
      if (member.player == null) { return false; }
      if (member.player.characters == null) { return false; }
      if (member.player.characters.length === 0) { return false; }
      if (member.player.characters[0].milestones == null) { return false; }
      let comp = 0;
      let total = 0;
      member.player.characters.forEach(char => {
        total++;
        const ms = char.milestones[this.filterActivity.key];
        if (ms == null && char.baseCharacterLevel >= char.maxLevel) { comp++; } else if (ms != null && ms.complete === true) { comp++; }
      });
      if (this.filterMode === 'zero' && comp === 0) { return true; }
      if (this.filterMode === 'all' && comp === total) { return true; }
      return false;
    });

    if (this.sort === 'memberAsc') { this.sortedMembers.sort(ClanComponent.compareName); }
    if (this.sort === 'memberDesc') { this.sortedMembers.sort(ClanComponent.compareNameReverse); }
    if (this.sort === 'dateAsc') { this.sortedMembers.sort(ClanComponent.compareDate); }
    if (this.sort === 'xpAsc') { this.sortedMembers.sort(ClanComponent.compareXp); }
    if (this.sort === 'triumphAsc') { this.sortedMembers.sort(ClanComponent.compareTriumph); }
    if (this.sort === 'dateDesc') { this.sortedMembers.sort(ClanComponent.compareDateReverse); }
    if (this.sort === 'llAsc') { this.sortedMembers.sort(ClanComponent.compareLLs); }
    if (this.sort === 'llDesc') { this.sortedMembers.sort(ClanComponent.compareLLsReverse); }
    if (this.sort === 'triumphDesc') { this.sortedMembers.sort(ClanComponent.compareTriumphReverse); }
  }

  public async loadSpecificPlayer(target: BungieGroupMember, reload: boolean): Promise<void> {
    if (target.player != null && !reload) return;

    try {
      const x = await this.bungieService.getChars(target.destinyUserInfo.membershipType, 
        target.destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions', 'Records'], true);
      target.player = x;
      if (this.modelPlayer == null && x != null && x.characters != null && x.characters[0].clanMilestones != null) {
        this.modelPlayer = x;
      }
      if (x != null && x.characters != null) {
        // in case this is a retry
        target.errorMsg = null;
      } else {
        target.errorMsg = 'Unabled to load player data';
      }
      // if (reload == true) {
      //   await this.loadRaidHistory(target, true);
      // }
    }
    catch (err) {
      console.dir(err);
      console.log('Skipping error on ' + target.destinyUserInfo.displayName + ' and continuing');
      target.errorMsg = 'Unabled to load player data';
    }
    let allLoaded = true;
    for (const t of this.members) {
      if (t.errorMsg == null && t.player == null) {
        allLoaded = false;
        break;
      }
    }

    if (allLoaded) this.allLoaded = true;
    this.sortData();
  }

  // private async loadRaidHistory(target: BungieGroupMember, reload: boolean): Promise<void> {
  //   try {
  //     if (target.player != null) {
  //       if (target.player.raidChecked && !reload) return;
  //       await this.bungieService.updateRaidHistory(target.player, true);
  //     }
  //   }
  //   catch (x) {
  //     console.log(x);
  //   }
  //   let allLoaded = true;
  //   for (const t of this.members) {
  //     if ((t.player == null && t.errorMsg == null) || (t.player != null && !t.player.raidChecked)) {
  //       allLoaded = false;
  //       break;
  //     }
  //   }

  //   if (allLoaded) this.raidsLoading = false;
  // }

  // private async loadRaidHistories(): Promise<void> {
  //   this.raidsLoading = true;
  //   console.log("Load raid history");
  //   for (const t of this.members) {
  //     this.loadRaidHistory(t, false);
  //   }
  // }

  private downloadCsvReport() {
    const sDate = new Date().toISOString().slice(0, 10);
    let sCsv = 'member,platform,chars,lastPlayed days ago,Triumph Score,Weekly XP,max LL,';
    this.modelPlayer.milestoneList.forEach(m => {
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
      sCsv += member.player.getWeeklyXp() + ',';
      sCsv += member.player.maxLL + ',';

      if (member.player.characters != null) {
        this.modelPlayer.milestoneList.forEach(mileStoneName => {
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


  private downloadCsv(filename: string, csv: string) {
    const anch: HTMLAnchorElement = document.createElement('a');
    anch.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    anch.setAttribute('download', filename);
    anch.setAttribute('visibility', 'hidden');
    document.body.appendChild(anch);
    anch.click();
  }

  private async load() {
    this.loading = true;
    this.members = [];
    this.modelPlayer = null;
    this.allLoaded = false;
    this.raidsLoading = false;
    try {
      const i = await this.bungieService.getClanInfo(this.id);
      this.info = i;
      if (i != null) {
        // load the clan members
        const members = await this.bungieService.getClanMembers(this.id);
        this.members = members;
        this.sortedMembers = this.members.slice(0);
        this.loading = false;
        for (const t of this.members) {
          if (this.modelPlayer == null) {
            await this.loadSpecificPlayer(t, false);
          }
          else {
            this.loadSpecificPlayer(t, false);
          }
        }
      } else {
        this.loading = false;
      }
    } catch (x) {
      this.loading = false;
    };
  }

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.id = params['id'];
      if (this.id != null) {
        this.load();
      }
    });
  }
}
