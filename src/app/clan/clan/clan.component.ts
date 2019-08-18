
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BungieService } from '../../service/bungie.service';
import { BungieGroupMember, ClanInfo, Const, MileStoneName, Platform, Player } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { ChildComponent } from '../../shared/child.component';


@Component({
  selector: 'd2c-clan-history',
  templateUrl: './clan.component.html',
  styleUrls: ['./clan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClanComponent extends ChildComponent implements OnInit, OnDestroy {

  id: string;

  public sortedMembers: BehaviorSubject<BungieGroupMember[]> = new BehaviorSubject([]);
  public info: BehaviorSubject<ClanInfo> = new BehaviorSubject(null);
  public allLoaded: BehaviorSubject<boolean> = new BehaviorSubject(false);

  platforms: Platform[];
  selectedPlatform: Platform;
  members: BungieGroupMember[] = [];
  modelPlayer: Player;
  sort = 'dateAsc';
  filterMode = 'none';
  filterActivity: MileStoneName = null;

  constructor(storageService: StorageService, private bungieService: BungieService,
    private route: ActivatedRoute, private router: Router,
    private ref: ChangeDetectorRef) {
    super(storageService, ref);
    this.platforms = Const.PLATFORMS_ARRAY.slice(0);
    this.platforms.unshift(Const.ALL_PLATFORM);
    this.selectedPlatform = Const.ALL_PLATFORM;
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
    if (bnetName != null) { this.router.navigate(['/', 4, bnetName]); }
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

  public toggleValorSort() {
    if (this.sort === 'valorAsc') {
      this.sort = 'valorDesc';
    } else {
      this.sort = 'valorAsc';
    }
    this.sortData();
  }
  public toggleInfamySort() {
    if (this.sort === 'infamyAsc') {
      this.sort = 'infamyDesc';
    } else {
      this.sort = 'infamyAsc';
    }
    this.sortData();
  }

  public toggleGlorySort() {
    if (this.sort === 'gloryAsc') {
      this.sort = 'gloryDesc';
    } else {
      this.sort = 'gloryAsc';
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


  private static compareGlory(a: BungieGroupMember, b: BungieGroupMember): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null && a.player.glory != null)  { aX = a.player.glory.currentProgress; }
    if (b.player != null && b.player.glory != null) { bX = b.player.glory.currentProgress; }
    if (aX < bX) { return 1; }
    if (aX > bX) { return -1; }
    return 0;
  }

  private static compareGloryReverse(a: BungieGroupMember, b: BungieGroupMember): number {
    return ClanComponent.compareGlory(a, b) * -1;
  }

  private static compareValor(a: BungieGroupMember, b: BungieGroupMember): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null && a.player.valor != null)  { aX = a.player.valor.currentProgress; }
    if (b.player != null && b.player.valor != null) { bX = b.player.valor.currentProgress; }
    if (aX < bX) { return 1; }
    if (aX > bX) { return -1; }
    return 0;
  }

  private static compareValorReverse(a: BungieGroupMember, b: BungieGroupMember): number {
    return ClanComponent.compareValor(a, b) * -1;
  }


  private static compareInfamy(a: BungieGroupMember, b: BungieGroupMember): number {
    let aX = 0;
    let bX = 0;
    if (a.player != null && a.player.infamy != null)  { aX = a.player.infamy.currentProgress; }
    if (b.player != null && b.player.infamy != null) { bX = b.player.infamy.currentProgress; }
    if (aX < bX) { return 1; }
    if (aX > bX) { return -1; }
    return 0;
  }

  private static compareInfamyReverse(a: BungieGroupMember, b: BungieGroupMember): number {
    return ClanComponent.compareInfamy(a, b) * -1;
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
    let temp = this.members.slice(0);

    temp = temp.filter(member => {
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
    if (this.selectedPlatform != Const.ALL_PLATFORM) {
      temp = temp.filter(member => {
        return member.destinyUserInfo.membershipType == this.selectedPlatform.type;
      });
    }


    if (this.sort === 'memberAsc') { temp.sort(ClanComponent.compareName); }
    if (this.sort === 'memberDesc') { temp.sort(ClanComponent.compareNameReverse); }
    if (this.sort === 'dateAsc') { temp.sort(ClanComponent.compareDate); }
    if (this.sort === 'xpAsc') { temp.sort(ClanComponent.compareXp); }
    if (this.sort === 'triumphAsc') { temp.sort(ClanComponent.compareTriumph); }
    if (this.sort === 'gloryAsc') { temp.sort(ClanComponent.compareGlory); }
    if (this.sort === 'valorAsc') { temp.sort(ClanComponent.compareValor); }
    if (this.sort === 'infamyAsc') { temp.sort(ClanComponent.compareInfamy); }
    if (this.sort === 'dateDesc') { temp.sort(ClanComponent.compareDateReverse); }
    if (this.sort === 'llAsc') { temp.sort(ClanComponent.compareLLs); }
    if (this.sort === 'llDesc') { temp.sort(ClanComponent.compareLLsReverse); }
    if (this.sort === 'triumphDesc') { temp.sort(ClanComponent.compareTriumphReverse); }
    if (this.sort === 'gloryDesc') { temp.sort(ClanComponent.compareGloryReverse); }
    if (this.sort === 'valorDesc') { temp.sort(ClanComponent.compareValorReverse); }
    if (this.sort === 'infamyDesc') { temp.sort(ClanComponent.compareInfamyReverse); }
    this.sortedMembers.next(temp);
  }

  public async loadSpecificPlayer(target: BungieGroupMember, reload: boolean): Promise<void> {
    if (target.player != null && !reload) { return; }

    try {
      const x = await this.bungieService.getChars(target.destinyUserInfo.membershipType,
        target.destinyUserInfo.membershipId, ['Profiles', 'Characters', 'CharacterProgressions', 'CharacterActivities', 'Records'], true);
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
    } catch (err) {
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

    if (allLoaded) {
      this.allLoaded.next(true);
    }
    this.sortData();
  }

  private downloadCsvReport() {
    const sDate = new Date().toISOString().slice(0, 10);
    let sCsv = 'member,platform,chars,lastPlayed days ago,Triumph Score,Glory,Infamy,Valor,Weekly XP,max LL,';
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

  public showAllClanMilestones(): void {
    this.storageService.showAllClanMilestones();
  }

  public showDefaultClanMilestones(): void {
    this.storageService.showDefaultClanMilestones();
  }

  public hideClanMilestone(ms: string): void {
    this.storageService.hideClanMilestone(ms);
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
    this.loading.next(true);
    this.members = [];
    this.modelPlayer = null;
    this.allLoaded.next(false);
    try {
      const i = await this.bungieService.getClanInfo(this.id);
      this.info.next(i);
      if (i != null) {
        // load the clan members
        const members = await this.bungieService.getClanMembers(this.id);
        this.members = members;
        this.sortedMembers.next(this.members.slice(0));
        this.loading.next(false);
        for (const t of this.members) {
          if (this.modelPlayer == null) {
            await this.loadSpecificPlayer(t, false);
          } else {
            this.loadSpecificPlayer(t, false);
          }
        }
      } else {
        this.loading.next(false);
      }
    } catch (x) {
      this.loading.next(false);
    }
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
