
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, Inject, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabChangeEvent, MatTabGroup, MatTreeFlattener, MatTreeFlatDataSource, MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog } from '@angular/material';
import { Observable, of as observableOf, fromEvent as observableFromEvent, combineLatest, Subject } from 'rxjs';

import { ANIMATE_ON_ROUTE_ENTER } from '../../animations/router.transition';
import { BungieService } from '../../service/bungie.service';
import { Player, Character, Platform, Const, TriumphNode, MileStoneName, TriumphRecordNode, NameDesc } from '../../service/model';
import { StorageService } from '../../service/storage.service';
import { NotificationService } from '../../service/notification.service';
import { ChildComponent } from '../../shared/child.component';
import { FlatTreeControl } from '@angular/cdk/tree';


export class TriumphFlatNode {
  constructor(
    public expandable: boolean, public level: number, public data: TriumphNode, public expanded: boolean) { }
}

@Component({
  selector: 'anms-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent extends ChildComponent implements OnInit, OnDestroy {
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  currentGt: string;
  currentPlatform: string;
  readonly TAB_URI = [
    'milestones',
    'bounties',
    'checklist',
    'progress',
    'triumphs',
    'collections',
    'chars'
  ];

  @ViewChild('maintabs') tabs: MatTabGroup;
  @ViewChild('triumphtabs') triumphtabs: MatTabGroup;

  private triumphSearchSubject: Subject<void> = new Subject<void>();


  public triumphFilterText: string = null;
  public filteredTriumphs: TriumphRecordNode[] = [];

  public const: Const = Const;
  platforms: Platform[];
  selectedPlatform: Platform;
  msg: string;
  selectedTab: string;
  gamerTag: string;
  player: Player;
  hideComplete = false;
  showZeroPtTriumphs = false;
  showInvisTriumphs = false;
  selectedTreeNodeHash: string = null;
  sort = 'rewardsDesc';

  hideCompleteChars: string = null;

  triumphTreeControl: FlatTreeControl<any>;
  collectionTreeControl: FlatTreeControl<any>;
  treeFlattener2: MatTreeFlattener<TriumphNode, TriumphFlatNode>;
  recordDatasource: MatTreeFlatDataSource<any, TriumphFlatNode>;
  collectionDatasource: MatTreeFlatDataSource<any, TriumphFlatNode>;
  burns: NameDesc[] = [];

  constructor(public bungieService: BungieService,
    storageService: StorageService,
    private notificationService: NotificationService,
    private route: ActivatedRoute, private router: Router,
    public dialog: MatDialog) {
    super(storageService);
    this.platforms = Const.PLATFORMS_ARRAY;
    this.selectedPlatform = this.platforms[0];

    this.triumphTreeControl = new FlatTreeControl<TriumphFlatNode>(this._getLevel, this._isExpandable);
    this.collectionTreeControl = new FlatTreeControl<TriumphFlatNode>(this._getLevel, this._isExpandable);
    this.treeFlattener2 = new MatTreeFlattener(this.transformer2, this._getLevel, this._isExpandable, this._getChildren);
    this.hideComplete = localStorage.getItem('hide-completed') === 'true';
    this.showZeroPtTriumphs = localStorage.getItem('show-zero-pt-triumphs') === 'true';
    this.showInvisTriumphs = localStorage.getItem('show-invis-triumph') === 'true';

  }

  transformer2 = (node: TriumphNode, level: number) => {
    return new TriumphFlatNode(!!node.children, level, node, true);
  }

  private _getLevel = (node: TriumphFlatNode) => node.level;

  private _isExpandable = (node: TriumphFlatNode) => node.expandable;

  private _getChildren = (node: any): Observable<any[]> => observableOf(node.children);

  hasChild = (_: number, _nodeData: TriumphFlatNode) => _nodeData.expandable;

  hideNode = (_nodeData: TriumphFlatNode) => this.hideComplete && _nodeData.data.complete;

  private getParentNode(tree: FlatTreeControl<any>, node: TriumphFlatNode): TriumphFlatNode {
    const currentLevel = tree.getLevel(node);
    if (currentLevel < 1) {
      return null;
    }
    const startIndex = tree.dataNodes.indexOf(node) - 1;
    for (let i = startIndex; i >= 0; i--) {
      const currentNode = tree.dataNodes[i];
      if (tree.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }

  private expandParents(tree: FlatTreeControl<any>, node: TriumphFlatNode): void {
    const parent = this.getParentNode(tree, node);
    tree.expand(parent);
    if (parent && parent.level > 0) {
      this.expandParents(tree, parent);
    }
  }

  triumphSearchChange(event: any) {
    this.triumphSearchSubject.next();
  }

  private filterTriumphs() {
    if (this.triumphFilterText == null || this.triumphFilterText.trim().length == 0) {
      this.filteredTriumphs = [];
      return;
    }
    if (this.player == null || this.player.searchableTriumphs == null) {
      this.filteredTriumphs = [];
      return;
    }
    const temp = [];
    const filterText = this.triumphFilterText.toLowerCase();
    for (const t of this.player.searchableTriumphs) {
      if (temp.length > 20) break;
      if (t.searchText.indexOf(filterText) >= 0) {
        temp.push(t);
      }
    }
    this.filteredTriumphs = temp;
  }

  private jumpToTriumph(targetHash: number) {
    this.triumphTreeControl.collapseAll();
    this.triumphtabs.selectedIndex = 0;
    for (const n of this.triumphTreeControl.dataNodes) {
      if (n.data.hash === targetHash) {
        this.triumphTreeControl.expand(n);
        this.expandParents(this.triumphTreeControl, n);
        this.selectedTreeNodeHash = ""+targetHash;
        break;
      }
    }
  }

  private setPlayer(x: Player): void {
    this.player = x;
    if (x != null) {
      this.sort = 'rewardsDesc';
      this.recordDatasource = new MatTreeFlatDataSource(this.triumphTreeControl, this.treeFlattener2);

      this.recordDatasource.data = this.player.records;
      this.filterTriumphs();
      if (this.selectedTab === 'triumphs') {
        if (this.selectedTreeNodeHash != null) {
          for (const n of this.triumphTreeControl.dataNodes) {
            if (n.data.hash === +this.selectedTreeNodeHash) {
              this.triumphTreeControl.expand(n);
              this.expandParents(this.triumphTreeControl, n);
              break;
            }
          }
        }
      }
      this.collectionDatasource = new MatTreeFlatDataSource(this.collectionTreeControl, this.treeFlattener2);
      this.collectionDatasource.data = this.player.collections;
      if (this.selectedTab === 'collections') {
        if (this.selectedTreeNodeHash != null) {
          for (const n of this.collectionTreeControl.dataNodes) {
            if (n.data.hash === +this.selectedTreeNodeHash) {
              this.collectionTreeControl.expand(n);
              this.expandParents(this.collectionTreeControl, n);
              break;
            }
          }
        }
      }

    } else {
      this.recordDatasource = null;
      this.collectionDatasource = null;
    }
  }

  public branchNodeClick(hash: string): void {
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, this.selectedTab, { id: hash }]);
  }

  public historyPlayer(p: Player) {
    const c: Character = p.characters[0];
    this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
  }

  public showBurns(){
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    //dc.width = '500px';
    dc.data = this.burns;
    const dialogRef = this.dialog.open(BurnDialogComponent, dc);
  }

  public getRaidLink(p: Player) {
    let platformstr: string;
    let memberid: string;
    if (p.profile.userInfo.membershipType === 1) {
      platformstr = 'xb';
      memberid = p.profile.userInfo.displayName;
    } else if (p.profile.userInfo.membershipType === 2) {
      platformstr = 'ps';
      memberid = p.profile.userInfo.displayName;
    } else if (p.profile.userInfo.membershipType === 4) {
      platformstr = 'pc'
      memberid = p.profile.userInfo.membershipId;
    }
    return 'http://raid.report/' + platformstr + '/' + memberid;
  }

  public getCharacterById(p: Player, id: string) {
    if (p.characters == null) { return null; }
    for (const c of p.characters) {
      if (c.characterId === id) {
        return c;
      }
    }
    return null;
  }

  public getTrialsLink(p: Player) {
    let platformstr: string;
    if (p.profile.userInfo.membershipType === 1) {
      platformstr = 'xbox';
    } else if (p.profile.userInfo.membershipType === 2) {
      platformstr = 'ps';
    } else if (p.profile.userInfo.membershipType === 4) {
      platformstr = 'pc';
    }
    return 'https://trials.report/report/' + platformstr + '/' + encodeURI(this.gamerTag);
  }


  public history(c: Character) {
    this.router.navigate(['/history', c.membershipType, c.membershipId, c.characterId]);
  }

  public routeSearch(): void {

    // if route hasn't changed it won't refresh, so we have to force it
    if (this.selectedPlatform.type === +this.route.snapshot.params.platform &&
      this.gamerTag === this.route.snapshot.params.gt) {
      this.performSearch(true);
      return;
    }

    // otherwise just re-route
    if (this.gamerTag == null || this.gamerTag.trim().length < 1) {
      return;
    }
    this.router.navigate([this.selectedPlatform.type, this.gamerTag, this.selectedTab]);
  }

  public toggleHide(hideMe: string) {
    if (this.hideCompleteChars === hideMe) {
      this.hideCompleteChars = null;
    } else {
      this.hideCompleteChars = hideMe;
    }
  }

  public hideRow(mileStoneName: MileStoneName): boolean {
    if (this.hideCompleteChars == null) { return false; }
    let allDone = true;
    for (const char of this.player.characters) {
      let doneChar = false;
      if (char.milestones[mileStoneName.key] != null) {
        if (char.milestones[mileStoneName.key].complete === true) {
          if (this.hideCompleteChars === char.characterId) { return true; }
          doneChar = true;
        }
      } else if (char.baseCharacterLevel >= char.maxLevel) {
        if (char.milestones[mileStoneName.key] == null && !mileStoneName.neverDisappears) {
          if (this.hideCompleteChars === char.characterId) { return true; }
          doneChar = true;
        }
      }
      allDone = allDone && doneChar;
    }
    if (this.hideCompleteChars === 'ALL' && allDone) { return true; }
    return false;
  }

  public changeTab(event: MatTabChangeEvent) {
    const tabName: string = this.getTabLabel(event.index);

    if (this.selectedTab !== tabName) {

      if (this.debugmode) {
      }
      this.selectedTab = tabName;
      this.router.navigate([this.selectedPlatform.type, this.gamerTag, tabName]);
    }
  }


  public sortByName(): void {
    if (this.sort === 'nameAsc') {
      this.sort = 'nameDesc';
    } else {
      this.sort = 'nameAsc';
    }
    this.sortMileStones();
  }
  public sortByReset(): void {
    if (this.sort === 'resetDesc') {
      this.sort = 'resetAsc';
    } else {
      this.sort = 'resetDesc';
    }
    this.sortMileStones();
  }

  public sortByRewards(): void {
    if (this.sort === 'rewardsDesc') {
      this.sort = 'rewardsAsc';
    } else {
      this.sort = 'rewardsDesc';
    }
    this.sortMileStones();
  }

  private getTabLabel(index: number): string {
    if (index >= this.TAB_URI.length) { return null; }
    return this.TAB_URI[index];
  }

  private sortMileStones() {
    if (this.player == null || this.player.milestoneList == null) { return; }
    if (this.sort === 'rewardsDesc') {
      this.player.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return 1; }
        if (a.pl > b.pl) { return -1; }
        if (a.rewards < b.rewards) { return 1; }
        if (a.rewards > b.rewards) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'rewardsAsc') {
      this.player.milestoneList.sort((a, b) => {
        if (a.pl < b.pl) { return -1; }
        if (a.pl > b.pl) { return 1; }
        if (a.rewards < b.rewards) { return -1; }
        if (a.rewards > b.rewards) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'resetDesc') {
      this.player.milestoneList.sort((a, b) => {
        if (a.resets==null && b.resets!=null) return 1;
        if (a.resets!=null && b.resets==null) return -1;
        if (a.resets==null && b.resets==null) return 0;
        if (a.resets < b.resets) { return 1; }
        if (a.resets > b.resets) { return -1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'resetAsc') {
      this.player.milestoneList.sort((a, b) => {

        if (a.resets==null && b.resets!=null) return -1;
        if (a.resets!=null && b.resets==null) return 1;
        if (a.resets==null && b.resets==null) return 0;
        if (a.resets < b.resets) { return -1; }
        if (a.resets > b.resets) { return 1; }
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'nameAsc') {
      this.player.milestoneList.sort((a, b) => {
        if (a.name > b.name) { return 1; }
        if (a.name < b.name) { return -1; }
        return 0;
      });
    } else if (this.sort === 'nameDesc') {
      this.player.milestoneList.sort((a, b) => {
        if (a.name > b.name) { return -1; }
        if (a.name < b.name) { return 1; }
        return 0;
      });
    }

  }


  private setTab(): void {
    if (this.tabs == null) {
      return;
    }
    const tab: string = this.selectedTab;
    if (tab == null) {
      return;
    }
    let cntr = 0;
    for (const label of this.TAB_URI) {
      if (tab === label) {
        this.tabs.selectedIndex = cntr;
        break;
      }
      cntr++;
    }
  }

  public showAllMilestones(): void {
    this.storageService.showAllMilestones();
    this.hideCompleteChars = null;
  }

  public hideMilestone(ms: string): void {
    this.storageService.hideMilestone(ms);
  }

  public async performSearch(forceRefresh?: boolean): Promise<void> {
    if (this.gamerTag == null || this.gamerTag.trim().length === 0) {
      return;
    }
    this.loading = true;
    //set player to empty unless we're refreshing in place
    if (forceRefresh !== true) {
      this.setPlayer(null);
    }
    const p = await this.bungieService.searchPlayer(this.selectedPlatform.type, this.gamerTag);

    try {
      if (p != null) {
        const x = await this.bungieService.getChars(p.membershipType, p.membershipId,
          ['Profiles', 'Characters', 'CharacterProgressions', 'CharacterActivities',
            'CharacterEquipment', 'CharacterInventories',
            'ProfileProgression', 'ItemObjectives', 'PresentationNodes', 'Records', 'Collectibles'
            // 'ItemInstances','ItemPerks','ItemStats','ItemSockets','ItemPlugStates',
            // 'ItemTalentGrids','ItemCommonData','ProfileInventories'
          ], false, false, this.showZeroPtTriumphs, this.showInvisTriumphs);
        this.bungieService.loadClans(x.profile.userInfo);
        this.setPlayer(x);

        // need to get out of this change detection cycle to have tabs set
        setTimeout(() => {
          this.setTab();
        }, 0)

        this.loading = false;

        if (x.characters != null) {
          await this.bungieService.updateAggHistory(x.characters);
          // await this.bungieService.updateRaidHistory(x);
          // await this.bungieService.updateNfHistory(x.milestoneList, x.characters);
          // await this.xyzService.updateDrops(x);
        }
      } else {
        this.loading = false;
        this.setPlayer(null);
      }
    } catch (x) {
      this.loading = false;

    }
  }

  public hideCompleteChange() {
    localStorage.setItem('hide-completed', '' + this.hideComplete);
  }


  public showZeroPtTriumphsChange() {
    localStorage.setItem('show-zero-pt-triumphs', '' + this.showZeroPtTriumphs);
    this.performSearch(true);
  }

  public showInvisTriumphsChange() {
    localStorage.setItem('show-invis-triumphs', '' + this.showInvisTriumphs);
    this.performSearch(true);
  }

  async setBurns(){
    this.burns = await this.bungieService.getBurns();
  }

  ngOnInit() {
    this.setBurns();
    this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      const newPlatform: string = params['platform'];
      const newGt: string = params['gt'];
      const tab: string = params['tab'];
      this.selectedTreeNodeHash = params['id'];

      // nothing changed
      if (this.currentGt === newGt && this.currentPlatform === newPlatform) {
        return;
      }

      let oNewPlatform: Platform = null;
      let redirected = false;
      this.platforms.forEach((p: Platform) => {
        if ((p.type + '') === newPlatform) {
          oNewPlatform = p;
        } else if (p.name.toLowerCase() === newPlatform.toLowerCase()) {
          this.router.navigate([p.type, newGt, tab]);
          redirected = true;
        }
      });

      // we already redirected
      if (redirected) { return; }

      // invalid platform
      if (oNewPlatform == null) {
        this.router.navigate(['home']);
        return;
      }

      // we have a valid numeric platform, and a gamer tag, and a tab
      this.currentGt = newGt;
      this.currentPlatform = newPlatform;

      this.selectedPlatform = oNewPlatform;

      this.gamerTag = newGt;
      this.selectedTab = tab.trim().toLowerCase();

      this.performSearch();
    });

    this.triumphSearchSubject.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(50))
      .subscribe(() => {
        this.filterTriumphs();
      });

  }

  onPlatformChange() {
    this.storageService.setItem('defaultplatform', this.selectedPlatform.type);
  }
  onGtChange() {
    this.storageService.setItem('defaultgt', this.gamerTag);
  }


  public openQuestDialog(quest: any): void {
    const dc = new MatDialogConfig();
    dc.disableClose = false;
    dc.autoFocus = true;
    //dc.width = '500px';
    dc.data = quest;
    const dialogRef = this.dialog.open(QuestDialogComponent, dc);
  }


  ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}


@Component({
  selector: 'anms-quest-dialog',
  templateUrl: './quest-dialog.component.html',
  styleUrls: ['./quest-dialog.component.scss']
})
export class QuestDialogComponent {
  public const: Const = Const;
  constructor(
    public dialogRef: MatDialogRef<QuestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

}

@Component({
  selector: 'anms-burn-dialog',
  templateUrl: './burn-dialog.component.html',
  styleUrls: ['./burn-dialog.component.scss']
})
export class BurnDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BurnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }
}